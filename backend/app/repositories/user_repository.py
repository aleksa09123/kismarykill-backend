from __future__ import annotations

import random
from types import SimpleNamespace

from sqlalchemy import String, cast, func, select
from sqlalchemy.engine.row import Row
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.utils.geo import haversine_distance_km


def _point_wkt(latitude: float, longitude: float) -> str:
    return f"POINT({longitude} {latitude})"


def _parse_point_wkt(value: object) -> tuple[float, float] | None:
    if value is None:
        return None

    text = value.decode() if isinstance(value, (bytes, bytearray)) else str(value)
    normalized = text.strip()
    if not normalized.upper().startswith("POINT(") or not normalized.endswith(")"):
        return None

    payload = normalized[6:-1].strip()
    parts = payload.split()
    if len(parts) != 2:
        return None

    longitude, latitude = float(parts[0]), float(parts[1])
    return latitude, longitude


class UserRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, user_id: int) -> User | None:
        return await self.session.get(User, user_id)

    async def update_location(self, user: User, latitude: float, longitude: float) -> None:
        user.latitude = latitude
        user.longitude = longitude
        user.koordinati = _point_wkt(latitude=latitude, longitude=longitude)
        await self.session.commit()

    async def update_server_location(
        self,
        user: User,
        *,
        country_code: str,
        country_name: str,
        latitude: float,
        longitude: float,
    ) -> None:
        user.country_code = country_code
        user.country_name = country_name
        user.latitude = latitude
        user.longitude = longitude
        user.koordinati = _point_wkt(latitude=latitude, longitude=longitude)
        await self.session.commit()

    async def get_random_users_in_radius(
        self,
        current_user_id: int,
        required_gender: str,
        latitude: float,
        longitude: float,
        radius_km: float,
        limit: int,
    ) -> list[Row | SimpleNamespace]:
        user_gender = func.coalesce(User.gender, cast(User.pol, String))

        selected_columns = [
            User.id,
            User.ime.label("name"),
            func.coalesce(User.profile_image_url, User.slika_url).label("profile_image_url"),
            user_gender.label("gender"),
            User.latitude.label("latitude"),
            User.longitude.label("longitude"),
            User.koordinati.label("koordinati"),
        ]

        stmt = (
            select(*selected_columns)
            .where(User.id != current_user_id)
            .where(
                User.latitude.is_not(None)
                | User.longitude.is_not(None)
                | User.koordinati.is_not(None)
            )
        )

        if required_gender in {"male", "female"}:
            stmt = stmt.where(user_gender == required_gender)

        rows = (await self.session.execute(stmt)).all()
        candidates: list[SimpleNamespace] = []
        for row in rows:
            candidate_latitude = float(row.latitude) if row.latitude is not None else None
            candidate_longitude = float(row.longitude) if row.longitude is not None else None

            if candidate_latitude is None or candidate_longitude is None:
                parsed = _parse_point_wkt(row.koordinati)
                if parsed is not None:
                    candidate_latitude, candidate_longitude = parsed

            if candidate_latitude is None or candidate_longitude is None:
                continue

            distance_km = haversine_distance_km(
                latitude,
                longitude,
                candidate_latitude,
                candidate_longitude,
            )
            if distance_km > radius_km:
                continue

            candidates.append(
                SimpleNamespace(
                    id=row.id,
                    name=row.name,
                    profile_image_url=row.profile_image_url,
                    gender=row.gender,
                    latitude=candidate_latitude,
                    longitude=candidate_longitude,
                    distance_m=distance_km * 1000,
                )
            )

        random.shuffle(candidates)
        return candidates[:limit]

    async def get_profiles_within_radius(
        self,
        *,
        current_user_id: int,
        latitude: float,
        longitude: float,
        radius_km: float,
    ) -> list[SimpleNamespace]:
        user_gender = func.coalesce(User.gender, cast(User.pol, String))

        selected_columns = [
            User.id,
            User.ime.label("name"),
            user_gender.label("gender"),
            User.latitude.label("latitude"),
            User.longitude.label("longitude"),
            User.koordinati.label("koordinati"),
        ]

        rows = (
            await self.session.execute(
                select(*selected_columns)
                .where(User.id != current_user_id)
                .where(
                    User.latitude.is_not(None)
                    | User.longitude.is_not(None)
                    | User.koordinati.is_not(None)
                )
            )
        ).all()

        nearby_profiles: list[SimpleNamespace] = []
        for row in rows:
            candidate_latitude = float(row.latitude) if row.latitude is not None else None
            candidate_longitude = float(row.longitude) if row.longitude is not None else None

            if candidate_latitude is None or candidate_longitude is None:
                parsed = _parse_point_wkt(row.koordinati)
                if parsed is not None:
                    candidate_latitude, candidate_longitude = parsed

            if candidate_latitude is None or candidate_longitude is None:
                continue

            distance_km = haversine_distance_km(
                latitude,
                longitude,
                candidate_latitude,
                candidate_longitude,
            )
            if distance_km > radius_km:
                continue

            nearby_profiles.append(
                SimpleNamespace(
                    id=row.id,
                    name=row.name,
                    gender=row.gender,
                    latitude=candidate_latitude,
                    longitude=candidate_longitude,
                    distance_km=distance_km,
                )
            )

        nearby_profiles.sort(key=lambda item: item.distance_km)
        return nearby_profiles

    async def get_random_users_in_location(
        self,
        *,
        current_user_id: int,
        required_gender: str,
        country_code: str,
        latitude: float,
        longitude: float,
        limit: int,
        exclude_user_ids: set[int] | None = None,
        include_bots: bool = True,
        include_humans: bool = True,
    ) -> list[SimpleNamespace]:
        if not include_bots and not include_humans:
            return []

        user_gender = func.coalesce(User.gender, cast(User.pol, String))
        excluded_ids = set(exclude_user_ids or set())
        excluded_ids.add(current_user_id)

        selected_columns = [
            User.id,
            User.ime.label("name"),
            func.coalesce(User.profile_image_url, User.slika_url).label("profile_image_url"),
            user_gender.label("gender"),
            User.latitude.label("latitude"),
            User.longitude.label("longitude"),
            User.koordinati.label("koordinati"),
            User.is_bot.label("is_bot"),
            User.email.label("email"),
        ]

        stmt = select(*selected_columns).where(User.id.notin_(excluded_ids))
        if required_gender in {"male", "female"}:
            stmt = stmt.where(user_gender == required_gender)

        if include_bots and not include_humans:
            stmt = stmt.where(User.is_bot.is_(True))
        elif include_humans and not include_bots:
            stmt = stmt.where(User.is_bot.is_(False))

        stmt = stmt.where(User.country_code == country_code)

        rows = (await self.session.execute(stmt)).all()
        candidates: list[SimpleNamespace] = []
        for row in rows:
            candidate_latitude = float(row.latitude) if row.latitude is not None else None
            candidate_longitude = float(row.longitude) if row.longitude is not None else None
            if candidate_latitude is None or candidate_longitude is None:
                parsed = _parse_point_wkt(row.koordinati)
                if parsed is not None:
                    candidate_latitude, candidate_longitude = parsed

            if candidate_latitude is None or candidate_longitude is None:
                continue

            distance_km = haversine_distance_km(
                latitude,
                longitude,
                candidate_latitude,
                candidate_longitude,
            )
            candidates.append(
                SimpleNamespace(
                    id=row.id,
                    name=row.name,
                    profile_image_url=row.profile_image_url,
                    gender=row.gender,
                    latitude=candidate_latitude,
                    longitude=candidate_longitude,
                    distance_km=distance_km,
                    is_bot=bool(row.is_bot),
                    email=row.email,
                )
            )

        random.shuffle(candidates)
        return candidates[:limit]

    async def count_real_users_in_location(
        self,
        *,
        country_code: str,
        exclude_user_id: int | None = None,
    ) -> int:
        stmt = (
            select(func.count(User.id))
            .where(User.is_bot.is_(False))
            .where(User.country_code == country_code)
        )
        if exclude_user_id is not None:
            stmt = stmt.where(User.id != exclude_user_id)
        return int((await self.session.scalar(stmt)) or 0)
