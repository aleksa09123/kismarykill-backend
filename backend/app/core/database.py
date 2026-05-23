from __future__ import annotations

from collections.abc import AsyncGenerator
import os
from pathlib import Path

from sqlalchemy import inspect
from sqlalchemy.engine import URL, make_url
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import BACKEND_DIR, settings
from app.models.base import Base
from app.models.user import User
from app.models.vote import Vote


def _query_value(value: str | tuple[str, ...] | None) -> str | None:
    if value is None:
        return None
    if isinstance(value, tuple):
        return value[0] if value else None
    return value


def _sanitize_postgres_url_for_asyncpg(url: URL) -> tuple[URL, dict[str, object]]:
    if url.get_backend_name() != "postgresql":
        return url, {}

    query = dict(url.query)
    connect_args: dict[str, object] = {
        # Keeps asyncpg stable on managed Postgres instances.
        "server_settings": {"jit": "off"}
    }

    # Managed providers sometimes append this and asyncpg can reject it.
    query.pop("target_session_attrs", None)

    ssl = _query_value(query.pop("ssl", None))
    sslmode = _query_value(query.pop("sslmode", None))
    requested_ssl = (ssl or sslmode or "").strip().lower()

    if requested_ssl:
        if requested_ssl in {"disable", "false", "0", "off"}:
            connect_args["ssl"] = False
        else:
            # Convert libpq-style SSL modes to asyncpg-compatible SSL setting.
            connect_args["ssl"] = "require"

    return url.set(query=query), connect_args


def _resolved_database_config() -> tuple[URL, dict[str, object]]:
    raw_database_url = (
        os.environ.get("DATABASE_URL")
        or settings.database_url
    ).strip()
    if raw_database_url.startswith("postgres://"):
        raw_database_url = "postgresql://" + raw_database_url[len("postgres://") :]

    url = make_url(raw_database_url)
    if url.get_backend_name() == "postgresql" and url.drivername != "postgresql+asyncpg":
        url = url.set(drivername="postgresql+asyncpg")

    if url.get_backend_name() != "sqlite" or not url.database:
        return _sanitize_postgres_url_for_asyncpg(url)

    sqlite_path = Path(url.database)
    if sqlite_path.is_absolute():
        return url, {}

    absolute_path = (BACKEND_DIR / sqlite_path).resolve()
    return url.set(database=str(absolute_path)), {}


DATABASE_URL, DATABASE_CONNECT_ARGS = _resolved_database_config()
engine = create_async_engine(
    DATABASE_URL,
    future=True,
    pool_pre_ping=True,
    connect_args=DATABASE_CONNECT_ARGS,
)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
IS_SQLITE = DATABASE_URL.get_backend_name() == "sqlite"

_ = (User, Vote)


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session


def _ensure_runtime_columns(sync_conn: object) -> None:
    inspector = inspect(sync_conn)
    existing_columns = {column["name"] for column in inspector.get_columns("users")}
    if "is_premium" in existing_columns:
        return

    dialect_name = inspector.bind.dialect.name if inspector.bind is not None else ""
    if dialect_name == "sqlite":
        inspector.bind.exec_driver_sql(
            "ALTER TABLE users ADD COLUMN is_premium BOOLEAN NOT NULL DEFAULT 0"
        )
        return

    inspector.bind.exec_driver_sql(
        "ALTER TABLE users ADD COLUMN is_premium BOOLEAN NOT NULL DEFAULT FALSE"
    )


async def init_db() -> None:
    async with engine.begin() as conn:
        # Keep data between restarts so live activity can build up over time.
        await conn.run_sync(Base.metadata.create_all)
        await conn.run_sync(_ensure_runtime_columns)
