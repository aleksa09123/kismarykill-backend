from __future__ import annotations

import logging
import re

import httpx
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

REST_COUNTRIES_ALL_URL = "https://restcountries.com/v3.1/all?fields=name,cca2"
MIN_EXPECTED_COUNTRIES = 180
LOGGER = logging.getLogger(__name__)
_IDENTIFIER_PATTERN = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")


def _safe_identifier(identifier: str) -> str:
    if not _IDENTIFIER_PATTERN.fullmatch(identifier):
        raise ValueError(f"Unsupported SQL identifier: {identifier!r}")
    return identifier


def _dialect_name(session: AsyncSession) -> str:
    bind = session.get_bind()
    return bind.dialect.name if bind is not None else ""


def _countries_table_ref(session: AsyncSession) -> str:
    return "countries" if _dialect_name(session) == "sqlite" else "public.countries"


def _normalize_remote_countries(payload: object) -> list[dict[str, str]]:
    if not isinstance(payload, list):
        raise ValueError("Unexpected countries API payload format")

    by_code: dict[str, dict[str, str]] = {}
    for row in payload:
        if not isinstance(row, dict):
            continue

        code = str(row.get("cca2") or "").strip().upper()
        name_data = row.get("name")
        name = ""
        if isinstance(name_data, dict):
            name = str(name_data.get("common") or "").strip()

        if len(code) != 2 or not name:
            continue
        by_code[code] = {
            "country_code": code,
            "country_name": name,
        }

    countries = sorted(
        by_code.values(),
        key=lambda item: (item["country_name"].lower(), item["country_code"]),
    )
    if len(countries) < MIN_EXPECTED_COUNTRIES:
        raise ValueError(
            f"Countries API returned only {len(countries)} valid countries; expected at least {MIN_EXPECTED_COUNTRIES}."
        )
    return countries


async def fetch_remote_countries() -> list[dict[str, str]]:
    timeout = httpx.Timeout(30.0)
    async with httpx.AsyncClient(timeout=timeout) as client:
        response = await client.get(
            REST_COUNTRIES_ALL_URL,
            headers={"Accept": "application/json"},
        )
        response.raise_for_status()
        payload = response.json()
    return _normalize_remote_countries(payload)


async def _resolve_countries_columns(session: AsyncSession) -> tuple[str, str] | None:
    if _dialect_name(session) == "sqlite":
        sqlite_rows = (
            await session.execute(text("PRAGMA table_info(countries)"))
        ).mappings().all()
        columns = [str(row.get("name")) for row in sqlite_rows if row.get("name")]
    else:
        result = await session.execute(
            text(
                """
                SELECT column_name
                FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = 'countries'
                ORDER BY ordinal_position
                """
            )
        )
        columns = [str(value) for value in result.scalars().all()]

    if not columns:
        return None

    code_column = next(
        (candidate for candidate in ("country_code", "code", "cca2", "iso2") if candidate in columns),
        None,
    )
    name_column = next(
        (candidate for candidate in ("country_name", "name") if candidate in columns),
        None,
    )
    if code_column is None or name_column is None:
        return None
    return code_column, name_column


async def list_countries_from_db(session: AsyncSession) -> list[dict[str, str]]:
    columns = await _resolve_countries_columns(session)
    if columns is None:
        return []

    code_column, name_column = (_safe_identifier(columns[0]), _safe_identifier(columns[1]))
    table_ref = _countries_table_ref(session)
    rows = (
        await session.execute(
            text(
                f"""
                SELECT "{code_column}" AS country_code, "{name_column}" AS country_name
                FROM {table_ref}
                WHERE "{code_column}" IS NOT NULL
                  AND "{name_column}" IS NOT NULL
                ORDER BY "{name_column}" ASC
                """
            )
        )
    ).mappings().all()

    normalized: list[dict[str, str]] = []
    for row in rows:
        code = str(row.get("country_code") or "").strip().upper()
        name = str(row.get("country_name") or "").strip()
        if len(code) != 2 or not name:
            continue
        normalized.append(
            {
                "country_code": code,
                "country_name": name,
            }
        )

    deduplicated: dict[str, dict[str, str]] = {}
    for item in normalized:
        deduplicated[item["country_code"]] = item
    return sorted(
        deduplicated.values(),
        key=lambda item: (item["country_name"].lower(), item["country_code"]),
    )


async def sync_countries_from_remote(session: AsyncSession) -> int:
    countries = await fetch_remote_countries()
    columns = await _resolve_countries_columns(session)
    if columns is None:
        raise RuntimeError("public.countries table or expected columns are missing.")

    code_column, name_column = (_safe_identifier(columns[0]), _safe_identifier(columns[1]))
    table_ref = _countries_table_ref(session)

    if _dialect_name(session) == "sqlite":
        await session.execute(text(f"DELETE FROM {table_ref}"))
    else:
        try:
            await session.execute(text(f"TRUNCATE TABLE {table_ref} CASCADE"))
        except SQLAlchemyError:
            # Managed DB roles can block TRUNCATE; fallback to DELETE while preserving flow.
            await session.rollback()
            await session.execute(text(f"DELETE FROM {table_ref}"))
    await session.execute(
        text(
            f"""
            INSERT INTO {table_ref} ("{code_column}", "{name_column}")
            VALUES (:country_code, :country_name)
            """
        ),
        countries,
    )
    await session.commit()
    return len(countries)


async def ensure_countries_seeded(session: AsyncSession) -> int:
    try:
        existing = await list_countries_from_db(session)
    except SQLAlchemyError:
        LOGGER.exception("Could not inspect countries table during startup sync")
        await session.rollback()
        return 0

    if len(existing) >= MIN_EXPECTED_COUNTRIES:
        return 0

    try:
        inserted = await sync_countries_from_remote(session)
        LOGGER.info("Countries sync completed", extra={"countries_inserted": inserted})
        return inserted
    except Exception:
        LOGGER.exception("Countries sync failed during startup")
        await session.rollback()
        return 0
