from __future__ import annotations

import asyncio
from dataclasses import dataclass
from datetime import UTC, datetime
from uuid import uuid4

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


@dataclass(frozen=True)
class LiveQueueTicket:
    ticket_id: str
    user_id: int
    country_code: str
    gender: str
    judge_gender: str
    enqueued_at: datetime


@dataclass(frozen=True)
class LiveQueueSnapshot:
    country_code: str
    male_waiting: int
    female_waiting: int
    total_waiting: int


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


def _server_id(country_code: str) -> str:
    return country_code.lower()


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
    _live_queue_lock = asyncio.Lock()
    _live_queue_by_bucket: dict[str, list[LiveQueueTicket]] = {}
    _live_queue_ticket_by_user: dict[int, LiveQueueTicket] = {}

    def __init__(self, session: AsyncSession):
        self.repository = UserRepository(session)
        self.bot_service = BotSimulationService(session)

    @staticmethod
    def _queue_bucket(country_code: str, gender: str) -> str:
        normalized_country = (country_code or "").strip().upper() or "GL"
        normalized_gender = "female" if gender == "female" else "male"
        return f"{normalized_country}:{normalized_gender}"

    async def enqueue_live_candidate(
        self,
        *,
        user: User,
        country_code: str,
    ) -> LiveQueueTicket:
        _ensure_zone_eligibility(user)
        user_gender = _normalized_gender(user)
        judge_gender = "male" if user_gender == "female" else "female"
        normalized_country = (country_code or "").strip().upper() or "GL"
        ticket = LiveQueueTicket(
            ticket_id=uuid4().hex,
            user_id=user.id,
            country_code=normalized_country,
            gender=user_gender,
            judge_gender=judge_gender,
            enqueued_at=datetime.now(UTC),
        )
        bucket = self._queue_bucket(normalized_country, user_gender)

        async with self._live_queue_lock:
            previous_ticket = self._live_queue_ticket_by_user.get(user.id)
            if previous_ticket is not None:
                previous_bucket = self._queue_bucket(previous_ticket.country_code, previous_ticket.gender)
                existing = self._live_queue_by_bucket.get(previous_bucket, [])
                self._live_queue_by_bucket[previous_bucket] = [
                    item for item in existing if item.user_id != user.id
                ]

            self._live_queue_by_bucket.setdefault(bucket, []).append(ticket)
            self._live_queue_ticket_by_user[user.id] = ticket

        return ticket

    async def dequeue_live_candidate(self, user_id: int) -> bool:
        async with self._live_queue_lock:
            ticket = self._live_queue_ticket_by_user.pop(user_id, None)
            if ticket is None:
                return False

            bucket = self._queue_bucket(ticket.country_code, ticket.gender)
            queued = self._live_queue_by_bucket.get(bucket, [])
            self._live_queue_by_bucket[bucket] = [item for item in queued if item.user_id != user_id]
            return True

    async def pop_live_room_candidates(
        self,
        *,
        country_code: str,
        competitors_gender: str,
    ) -> dict[str, list[LiveQueueTicket]] | None:
        normalized_country = (country_code or "").strip().upper() or "GL"
        competitor_gender = "female" if competitors_gender == "female" else "male"
        judge_gender = "male" if competitor_gender == "female" else "female"
        competitor_bucket = self._queue_bucket(normalized_country, competitor_gender)
        judge_bucket = self._queue_bucket(normalized_country, judge_gender)

        async with self._live_queue_lock:
            competitors = self._live_queue_by_bucket.get(competitor_bucket, [])
            judges = self._live_queue_by_bucket.get(judge_bucket, [])
            if len(competitors) < 3 or len(judges) < 1:
                return None

            picked_competitors = competitors[:3]
            picked_judge = judges[0]

            self._live_queue_by_bucket[competitor_bucket] = competitors[3:]
            self._live_queue_by_bucket[judge_bucket] = judges[1:]
            for picked in [*picked_competitors, picked_judge]:
                self._live_queue_ticket_by_user.pop(picked.user_id, None)

            return {
                "competitors": picked_competitors,
                "judges": [picked_judge],
            }

    async def get_live_queue_snapshot(self, country_code: str) -> LiveQueueSnapshot:
        normalized_country = (country_code or "").strip().upper() or "GL"
        male_bucket = self._queue_bucket(normalized_country, "male")
        female_bucket = self._queue_bucket(normalized_country, "female")

        async with self._live_queue_lock:
            male_waiting = len(self._live_queue_by_bucket.get(male_bucket, []))
            female_waiting = len(self._live_queue_by_bucket.get(female_bucket, []))

        return LiveQueueSnapshot(
            country_code=normalized_country,
            male_waiting=male_waiting,
            female_waiting=female_waiting,
            total_waiting=male_waiting + female_waiting,
        )

    async def get_round_candidates(
        self,
        *,
        user: User,
        country_code: str,
        country_name: str,
        latitude: float,
        longitude: float,
        use_bots: bool,
        round_size: int = 3,
        exclude_user_ids: set[int] | None = None,
    ) -> MatchmakingResult:
        _ensure_zone_eligibility(user)
        await self.repository.update_server_location(
            user,
            country_code=country_code,
            country_name=country_name,
            latitude=latitude,
            longitude=longitude,
        )
        location_label = country_name

        if not use_bots:
            real_user_count = await self.repository.count_real_users_in_location(
                country_code=country_code,
                exclude_user_id=user.id,
            )
            if real_user_count < LOCAL_AI_MIN_REAL_USERS and self.bot_service.api_bots_enabled:
                await self.bot_service.ensure_local_ai_bots_for_location(
                    country_code=country_code,
                    country_name=country_name,
                    latitude=latitude,
                    longitude=longitude,
                    target_count=LOCAL_AI_BOT_TARGET_COUNT,
                )
                local_bots = await self.bot_service.get_local_ai_bots_for_location(
                    country_code=country_code,
                    exclude_user_id=user.id,
                    limit=LOCAL_AI_BOT_TARGET_COUNT,
                )
                excluded_ids = set(exclude_user_ids or set())
                unique_local_bots = [bot for bot in local_bots if bot.id not in excluded_ids]
                if len(unique_local_bots) < round_size:
                    unique_local_bots = local_bots
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
                    for bot in unique_local_bots[:round_size]
                ]
                if round_candidates:
                    return MatchmakingResult(zone_id=_server_id(country_code), users=round_candidates)

        required_gender = _required_match_gender(user)
        candidates = await self.repository.get_random_users_in_location(
            current_user_id=user.id,
            required_gender=required_gender,
            country_code=country_code,
            latitude=latitude,
            longitude=longitude,
            limit=round_size,
            exclude_user_ids=exclude_user_ids,
            include_bots=use_bots,
            include_humans=not use_bots,
        )

        if use_bots and len(candidates) < round_size:
            existing_ids = {candidate.id for candidate in candidates}
            extra = await self.repository.get_random_users_in_location(
                current_user_id=user.id,
                required_gender=required_gender,
                country_code=country_code,
                latitude=latitude,
                longitude=longitude,
                limit=round_size - len(candidates),
                exclude_user_ids=existing_ids | set(exclude_user_ids or set()),
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
        return MatchmakingResult(zone_id=_server_id(country_code), users=round_candidates)

    async def get_zone_debug_info(
        self,
        *,
        user: User,
        country_code: str,
        country_name: str,
        latitude: float,
        longitude: float,
        use_bots: bool,
    ) -> ZoneDebugResponse:
        _ensure_zone_eligibility(user)
        await self.repository.update_server_location(
            user,
            country_code=country_code,
            country_name=country_name,
            latitude=latitude,
            longitude=longitude,
        )

        nearest = await self.repository.get_random_users_in_location(
            current_user_id=user.id,
            required_gender="",
            country_code=country_code,
            latitude=latitude,
            longitude=longitude,
            limit=10,
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
            zone_id=_server_id(country_code),
            total_profiles_within_radius=len(nearest_sorted),
            nearest_profiles=nearest_profiles,
        )
