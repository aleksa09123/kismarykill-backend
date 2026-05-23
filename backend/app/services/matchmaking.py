from __future__ import annotations

from dataclasses import dataclass

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import Gender
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.round import RoundCandidate, ZoneDebugNearestProfile, ZoneDebugResponse
from app.services.bot_simulation import LOCAL_AI_BOT_TARGET_COUNT, LOCAL_AI_MIN_REAL_USERS, BotSimulationService


@dataclass(frozen=True)
class MatchmakingResult:
    zone_id: str
    users: list[RoundCandidate]


def _normalized_gender(user: User) -> str:
    if user.gender in {"male", "female"}:
        return user.gender
    if user.pol == Gender.male:
        return "male"
    if user.pol == Gender.female:
        return "female"
    raise HTTPException(status_code=400, detail="Profile gender must be male or female to enter discovery")


def _required_match_gender(user: User) -> str:
    normalized_gender = _normalized_gender(user)
    if normalized_gender == "female":
        return "male"
    if normalized_gender == "male":
        return "female"
    raise HTTPException(status_code=400, detail="Profile gender must be male or female to enter discovery")


def _ensure_zone_eligibility(user: User) -> None:
    if not user.otp_verified:
        raise HTTPException(status_code=403, detail="OTP verification is required before entering discovery")
    if not user.face_verified:
        raise HTTPException(status_code=403, detail="Face verification is required before entering discovery")


def _server_id(country_code: str, city: str) -> str:
    return f"{country_code.lower()}_{city.lower().replace(' ', '_')}"


def _external_profile_id(*, user_id: int, is_bot: bool, email: str | None) -> str:
    if is_bot and email:
        local_part = email.split("@", 1)[0].strip()
        if local_part:
            candidate = local_part.rsplit("_", 1)[-1].strip()
            if candidate:
                return candidate
    return str(user_id)


def _round_candidate(
    *,
    user_id: int,
    external_id: str,
    name: str,
    image_url: str | None,
    gender: str | None,
    latitude: float,
    longitude: float,
    distance_km: float,
    location_label: str,
    is_local_ai_bot: bool,
) -> RoundCandidate:
    normalized_gender = "female" if gender == "female" else "male"
    return RoundCandidate(
        id=external_id,
        target_id=user_id,
        name=name,
        profile_image_url=image_url,
        imageUrl=image_url,
        location=location_label,
        gender=normalized_gender,
        latitude=latitude,
        longitude=longitude,
        distance_km=round(distance_km, 2),
        is_local_ai_bot=is_local_ai_bot,
    )


class MatchmakingService:
    def __init__(self, session: AsyncSession):
        self.repository = UserRepository(session)
        self.bot_service = BotSimulationService(session)

    async def get_round_candidates(
        self,
        *,
        user: User,
        country_code: str,
        country_name: str,
        city: str,
        latitude: float,
        longitude: float,
        use_bots: bool,
        round_size: int = 3,
    ) -> MatchmakingResult:
        _ensure_zone_eligibility(user)
        await self.repository.update_server_location(
            user,
            country_code=country_code,
            country_name=country_name,
            city=city,
            latitude=latitude,
            longitude=longitude,
        )
        location_label = f"{city}, {country_name}"

        if not use_bots:
            real_user_count = await self.repository.count_real_users_in_location(
                country_code=country_code,
                city=city,
                exclude_user_id=user.id,
            )
            if real_user_count < LOCAL_AI_MIN_REAL_USERS and self.bot_service.api_bots_enabled:
                await self.bot_service.ensure_local_ai_bots_for_location(
                    country_code=country_code,
                    city=city,
                    country_name=country_name,
                    latitude=latitude,
                    longitude=longitude,
                    target_count=LOCAL_AI_BOT_TARGET_COUNT,
                )
                local_bots = await self.bot_service.get_local_ai_bots_for_location(
                    country_code=country_code,
                    city=city,
                    exclude_user_id=user.id,
                    limit=LOCAL_AI_BOT_TARGET_COUNT,
                )
                round_candidates = [
                    _round_candidate(
                        user_id=bot.id,
                        external_id=_external_profile_id(user_id=bot.id, is_bot=True, email=bot.email),
                        name=bot.ime,
                        image_url=bot.profile_image_url or bot.slika_url,
                        gender=bot.gender or (bot.pol.value if bot.pol else "male"),
                        latitude=float(bot.latitude or latitude),
                        longitude=float(bot.longitude or longitude),
                        distance_km=0.0,
                        location_label=location_label,
                        is_local_ai_bot=True,
                    )
                    for bot in local_bots
                ]
                if round_candidates:
                    return MatchmakingResult(zone_id=_server_id(country_code, city), users=round_candidates)

        required_gender = _required_match_gender(user)
        candidates = await self.repository.get_random_users_in_location(
            current_user_id=user.id,
            required_gender=required_gender,
            country_code=country_code,
            city=city,
            latitude=latitude,
            longitude=longitude,
            limit=round_size,
            city_only=True,
            include_bots=use_bots,
            include_humans=not use_bots,
        )

        if use_bots and len(candidates) < round_size:
            existing_ids = {candidate.id for candidate in candidates}
            extra = await self.repository.get_random_users_in_location(
                current_user_id=user.id,
                required_gender=required_gender,
                country_code=country_code,
                city=city,
                latitude=latitude,
                longitude=longitude,
                limit=round_size - len(candidates),
                exclude_user_ids=existing_ids,
                city_only=False,
                include_bots=True,
                include_humans=False,
            )
            candidates.extend(extra)

        round_candidates = [
            _round_candidate(
                user_id=candidate.id,
                external_id=_external_profile_id(
                    user_id=candidate.id,
                    is_bot=bool(getattr(candidate, "is_bot", False)),
                    email=getattr(candidate, "email", None),
                ),
                name=candidate.name,
                image_url=candidate.profile_image_url,
                gender=str(candidate.gender or "male"),
                latitude=float(candidate.latitude),
                longitude=float(candidate.longitude),
                distance_km=float(candidate.distance_km),
                location_label=location_label,
                is_local_ai_bot=False,
            )
            for candidate in candidates[:round_size]
        ]
        return MatchmakingResult(zone_id=_server_id(country_code, city), users=round_candidates)

    async def get_zone_debug_info(
        self,
        *,
        user: User,
        country_code: str,
        country_name: str,
        city: str,
        latitude: float,
        longitude: float,
        use_bots: bool,
    ) -> ZoneDebugResponse:
        _ensure_zone_eligibility(user)
        await self.repository.update_server_location(
            user,
            country_code=country_code,
            country_name=country_name,
            city=city,
            latitude=latitude,
            longitude=longitude,
        )

        nearest = await self.repository.get_random_users_in_location(
            current_user_id=user.id,
            required_gender="",
            country_code=country_code,
            city=city,
            latitude=latitude,
            longitude=longitude,
            limit=10,
            city_only=True,
            include_bots=use_bots,
            include_humans=not use_bots,
        )
        nearest_sorted = sorted(nearest, key=lambda candidate: candidate.distance_km)
        nearest_profiles = [
            ZoneDebugNearestProfile(
                user_id=candidate.id,
                name=candidate.name,
                distance_km=round(float(candidate.distance_km), 2),
            )
            for candidate in nearest_sorted[:3]
        ]
        return ZoneDebugResponse(
            zone_id=_server_id(country_code, city),
            total_profiles_within_radius=len(nearest_sorted),
            nearest_profiles=nearest_profiles,
        )
