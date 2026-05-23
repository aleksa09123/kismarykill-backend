from __future__ import annotations

import asyncio
import json
import random
from datetime import UTC, datetime, timedelta
from urllib.parse import urlencode
from urllib.request import urlopen
from uuid import uuid4

from sqlalchemy import case, delete, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased

from app.core.location_context import DEFAULT_LOCATION, GLOBAL_CITY, GLOBAL_COUNTRY_CODE
from app.models.enums import Gender, VoteType
from app.models.user import User
from app.models.vote import Vote
from app.schemas.vote import BotFeedbackEntry, BotFeedbackResponse

ENABLE_API_BOTS = False
BOT_TARGET_COUNT = 30
BOT_MINUTES_RANGE = (7, 15)
BOT_MIN_AGE = 18
BOT_MAX_AGE = 35
LOCAL_AI_BOT_TARGET_COUNT = 30
LOCAL_AI_MIN_REAL_USERS = 10
LOCAL_AI_FEED_PROBABILITY = 0.35

LOCAL_AI_EMAIL_PREFIX = "local_ai_bot_"
GLOBAL_AI_EMAIL_PREFIX = "global_ai_bot_"

RANDOMUSER_BASE_URL = "https://randomuser.me/api/"
RANDOMUSER_DEFAULT_NAT_POOL = "us,gb,de,fr,br"
RANDOMUSER_SUPPORTED_NATS: set[str] = {
    "au",
    "br",
    "ca",
    "ch",
    "de",
    "dk",
    "es",
    "fi",
    "fr",
    "gb",
    "ie",
    "in",
    "ir",
    "mx",
    "nl",
    "no",
    "nz",
    "rs",
    "tr",
    "ua",
    "us",
}


def _point_wkt(latitude: float, longitude: float) -> str:
    return f"POINT({longitude} {latitude})"


def _as_naive_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value
    return value.astimezone(UTC).replace(tzinfo=None)


def _normalized_city_key(city: str) -> str:
    return city.strip().lower().replace(" ", "_")


def _randomuser_nat_for_country(country_code: str) -> str:
    normalized = country_code.strip().lower()
    if normalized in RANDOMUSER_SUPPORTED_NATS:
        return normalized
    return RANDOMUSER_DEFAULT_NAT_POOL


def _randomuser_url(*, results: int, country_code: str) -> str:
    nat = _randomuser_nat_for_country(country_code)
    query = urlencode(
        {
            "results": str(max(1, min(results, 100))),
            "nat": nat,
        }
    )
    return f"{RANDOMUSER_BASE_URL}?{query}"


def _capitalize_name(value: str) -> str:
    stripped = value.strip()
    if not stripped:
        return "Player"
    return stripped[:1].upper() + stripped[1:].lower()


def _normalized_gender(value: str) -> Gender:
    return Gender.female if value.strip().lower() == "female" else Gender.male


def _profile_from_random_user(payload: dict[str, object]) -> tuple[str, Gender, str, str]:
    login = payload.get("login")
    login_uuid = (
        str(login.get("uuid")).strip()
        if isinstance(login, dict) and login.get("uuid")
        else uuid4().hex
    )

    name_payload = payload.get("name")
    first_name = (
        _capitalize_name(str(name_payload.get("first")))
        if isinstance(name_payload, dict) and name_payload.get("first")
        else "Player"
    )

    gender_value = (
        str(payload.get("gender")).strip().lower()
        if payload.get("gender") is not None
        else "male"
    )
    gender = _normalized_gender(gender_value)

    picture_payload = payload.get("picture")
    image_url = (
        str(picture_payload.get("large")).strip()
        if isinstance(picture_payload, dict) and picture_payload.get("large")
        else ""
    )
    return login_uuid, gender, first_name, image_url


def _fetch_randomuser_results_sync(url: str) -> list[dict[str, object]]:
    with urlopen(url, timeout=15) as response:
        payload = json.loads(response.read().decode("utf-8"))
    rows = payload.get("results")
    if not isinstance(rows, list):
        return []
    return [row for row in rows if isinstance(row, dict)]


def _bot_email(prefix: str, country_code: str, city: str, external_uuid: str) -> str:
    normalized_uuid = "".join(ch for ch in external_uuid.lower() if ch.isalnum()) or uuid4().hex
    return f"{prefix}{country_code.lower()}_{_normalized_city_key(city)}_{normalized_uuid}@kmk.local"


class BotSimulationService:
    def __init__(self, session: AsyncSession):
        self.session = session

    @property
    def api_bots_enabled(self) -> bool:
        return ENABLE_API_BOTS

    async def _seed_randomuser_bots(
        self,
        *,
        country_code: str,
        city: str,
        country_name: str,
        latitude: float,
        longitude: float,
        target_count: int,
        email_prefix: str,
        existing_emails: set[str] | None = None,
    ) -> int:
        if not self.api_bots_enabled:
            return 0

        desired = max(0, target_count)
        if desired == 0:
            return 0

        known_emails = set(existing_emails or set())
        created = 0
        attempts = 0
        while created < desired and attempts < 6:
            attempts += 1
            needed = desired - created
            rows = await asyncio.to_thread(
                _fetch_randomuser_results_sync,
                _randomuser_url(results=max(needed, 10), country_code=country_code),
            )
            if not rows:
                continue

            for row in rows:
                external_uuid, gender, profile_name, image_url = _profile_from_random_user(row)
                email = _bot_email(email_prefix, country_code, city, external_uuid)
                if email in known_emails:
                    continue

                known_emails.add(email)
                bot_latitude = latitude + random.uniform(-0.04, 0.04)
                bot_longitude = longitude + random.uniform(-0.04, 0.04)

                self.session.add(
                    User(
                        ime=profile_name,
                        slika_url=image_url or None,
                        pol=gender,
                        email=email,
                        password_hash=None,
                        gender=gender.value,
                        preferred_gender="both",
                        profile_image_url=image_url or None,
                        age=random.randint(BOT_MIN_AGE, BOT_MAX_AGE),
                        country_code=country_code,
                        country_name=country_name,
                        city=city,
                        latitude=bot_latitude,
                        longitude=bot_longitude,
                        koordinati=_point_wkt(bot_latitude, bot_longitude),
                        otp_verified=True,
                        face_verified=True,
                        is_bot=True,
                    )
                )
                created += 1
                if created >= desired:
                    break

        return created

    async def ensure_bots_seeded(self, target_count: int = BOT_TARGET_COUNT) -> int:
        return await self.ensure_bots_seeded_for_location(
            country_code=DEFAULT_LOCATION.country_code,
            city=DEFAULT_LOCATION.city,
            country_name=DEFAULT_LOCATION.country_name,
            latitude=DEFAULT_LOCATION.latitude,
            longitude=DEFAULT_LOCATION.longitude,
            target_count=target_count,
        )

    async def count_real_users_in_location(
        self,
        *,
        country_code: str,
        city: str,
        exclude_user_id: int | None = None,
    ) -> int:
        stmt = (
            select(func.count(User.id))
            .where(User.is_bot.is_(False))
            .where(User.country_code == country_code)
            .where(User.city == city)
        )
        if exclude_user_id is not None:
            stmt = stmt.where(User.id != exclude_user_id)
        return int((await self.session.scalar(stmt)) or 0)

    async def should_use_local_ai_bots(
        self,
        *,
        country_code: str,
        city: str,
        exclude_user_id: int | None = None,
        minimum_real_players: int = LOCAL_AI_MIN_REAL_USERS,
    ) -> bool:
        if not self.api_bots_enabled:
            return False

        real_users = await self.count_real_users_in_location(
            country_code=country_code,
            city=city,
            exclude_user_id=exclude_user_id,
        )
        return real_users < minimum_real_players

    async def ensure_local_ai_bots_for_location(
        self,
        *,
        country_code: str,
        city: str,
        country_name: str,
        latitude: float,
        longitude: float,
        target_count: int = LOCAL_AI_BOT_TARGET_COUNT,
        force_refresh: bool = False,
    ) -> int:
        if not self.api_bots_enabled:
            return 0

        existing_bots = (
            await self.session.execute(
                select(User)
                .where(User.is_bot.is_(True))
                .where(User.country_code == country_code)
                .where(User.city == city)
                .where(User.email.is_not(None))
                .where(User.email.startswith(LOCAL_AI_EMAIL_PREFIX))
            )
        ).scalars().all()

        if force_refresh and existing_bots:
            await self.session.execute(
                delete(User)
                .where(User.is_bot.is_(True))
                .where(User.country_code == country_code)
                .where(User.city == city)
                .where(User.email.is_not(None))
                .where(User.email.startswith(LOCAL_AI_EMAIL_PREFIX))
            )
            existing_bots = []

        existing_count = len(existing_bots)
        if existing_count >= target_count:
            await self.session.commit()
            return 0

        created = await self._seed_randomuser_bots(
            country_code=country_code,
            city=city,
            country_name=country_name,
            latitude=latitude,
            longitude=longitude,
            target_count=target_count - existing_count,
            email_prefix=LOCAL_AI_EMAIL_PREFIX,
            existing_emails={bot.email or "" for bot in existing_bots},
        )
        await self.session.commit()
        return created

    async def get_local_ai_bots_for_location(
        self,
        *,
        country_code: str,
        city: str,
        exclude_user_id: int | None = None,
        limit: int = LOCAL_AI_BOT_TARGET_COUNT,
    ) -> list[User]:
        if not self.api_bots_enabled:
            return []

        stmt = (
            select(User)
            .where(User.is_bot.is_(True))
            .where(User.country_code == country_code)
            .where(User.city == city)
            .where(User.email.is_not(None))
            .where(User.email.startswith(LOCAL_AI_EMAIL_PREFIX))
        )
        if exclude_user_id is not None:
            stmt = stmt.where(User.id != exclude_user_id)
        bots = (await self.session.execute(stmt)).scalars().all()
        random.shuffle(bots)
        return bots[:limit]

    async def purge_local_ai_bots_for_location(
        self,
        *,
        country_code: str,
        city: str,
    ) -> int:
        result = await self.session.execute(
            delete(User)
            .where(User.is_bot.is_(True))
            .where(User.country_code == country_code)
            .where(User.city == city)
            .where(User.email.is_not(None))
            .where(User.email.startswith(LOCAL_AI_EMAIL_PREFIX))
        )
        await self.session.commit()
        return int(result.rowcount or 0)

    async def reset_local_ai_bots_for_location(
        self,
        *,
        country_code: str,
        city: str,
        country_name: str,
        latitude: float,
        longitude: float,
        target_count: int = LOCAL_AI_BOT_TARGET_COUNT,
    ) -> int:
        return await self.ensure_local_ai_bots_for_location(
            country_code=country_code,
            city=city,
            country_name=country_name,
            latitude=latitude,
            longitude=longitude,
            target_count=target_count,
            force_refresh=True,
        )

    async def purge_global_bots(self) -> int:
        result = await self.session.execute(
            delete(User)
            .where(User.is_bot.is_(True))
            .where(
                or_(
                    User.country_code == GLOBAL_COUNTRY_CODE,
                    User.city == GLOBAL_CITY,
                    User.email.like("bot_gl_%@kmk.local"),
                    User.email.like(f"{GLOBAL_AI_EMAIL_PREFIX}%"),
                )
            )
        )
        await self.session.commit()
        return int(result.rowcount or 0)

    async def round_contains_local_ai_bots(
        self,
        *,
        country_code: str,
        city: str,
        user_ids: list[int],
    ) -> bool:
        if not self.api_bots_enabled:
            return False

        if not user_ids:
            return False

        total = await self.session.scalar(
            select(func.count(User.id))
            .where(User.id.in_(set(user_ids)))
            .where(User.is_bot.is_(True))
            .where(User.country_code == country_code)
            .where(User.city == city)
            .where(User.email.is_not(None))
            .where(User.email.startswith(LOCAL_AI_EMAIL_PREFIX))
        )
        return int(total or 0) > 0

    async def simulate_local_ai_live_feed_event(
        self,
        *,
        user_id: int,
        country_code: str,
        city: str,
        local_bot_ids: list[int],
        probability: float = LOCAL_AI_FEED_PROBABILITY,
    ) -> bool:
        if not self.api_bots_enabled:
            return False

        if not local_bot_ids or random.random() > probability:
            return False

        bots = (
            await self.session.execute(
                select(User)
                .where(User.id.in_(set(local_bot_ids)))
                .where(User.is_bot.is_(True))
                .where(User.country_code == country_code)
                .where(User.city == city)
                .where(User.email.is_not(None))
                .where(User.email.startswith(LOCAL_AI_EMAIL_PREFIX))
            )
        ).scalars().all()
        if not bots:
            return False

        voter_bot = random.choice(bots)
        tip_glasa = random.choice((VoteType.kiss, VoteType.marry))
        self.session.add(
            Vote(
                voter_id=voter_bot.id,
                target_id=user_id,
                tip_glasa=tip_glasa,
                timestamp=datetime.utcnow(),
            )
        )
        await self.session.commit()
        return True

    async def ensure_bots_seeded_for_location(
        self,
        *,
        country_code: str,
        city: str,
        country_name: str,
        latitude: float,
        longitude: float,
        target_count: int = BOT_TARGET_COUNT,
    ) -> int:
        if not self.api_bots_enabled:
            return 0

        existing_bots = (
            await self.session.execute(
                select(User)
                .where(User.is_bot.is_(True))
                .where(User.country_code == country_code)
                .where(User.city == city)
                .where(User.email.is_not(None))
                .where(User.email.startswith(GLOBAL_AI_EMAIL_PREFIX))
            )
        ).scalars().all()

        if len(existing_bots) >= target_count:
            await self.session.commit()
            return 0

        created = await self._seed_randomuser_bots(
            country_code=country_code,
            city=city,
            country_name=country_name,
            latitude=latitude,
            longitude=longitude,
            target_count=target_count - len(existing_bots),
            email_prefix=GLOBAL_AI_EMAIL_PREFIX,
            existing_emails={bot.email or "" for bot in existing_bots},
        )
        await self.session.commit()
        return created

    def _random_vote_type(self) -> VoteType:
        return random.choices(
            [VoteType.kiss, VoteType.marry, VoteType.kill],
            weights=[0.45, 0.35, 0.2],
            k=1,
        )[0]

    async def simulate_paced_activity_for_user(
        self,
        user: User,
        *,
        country_code: str,
        city: str,
    ) -> int:
        if not self.api_bots_enabled:
            return 0

        bots = (
            await self.session.execute(
                select(User)
                .where(User.is_bot.is_(True))
                .where(User.country_code == country_code)
                .where(User.city == city)
                .where(User.id != user.id)
            )
        ).scalars().all()
        if not bots:
            return 0

        latest_vote_ts = await self.session.scalar(
            select(func.max(Vote.timestamp))
            .select_from(Vote)
            .join(User, Vote.voter_id == User.id)
            .where(Vote.target_id == user.id)
            .where(User.is_bot.is_(True))
            .where(User.country_code == country_code)
            .where(User.city == city)
        )

        now = datetime.utcnow()
        min_wait_minutes = random.randint(*BOT_MINUTES_RANGE)
        if latest_vote_ts is not None:
            latest_vote_ts_naive = _as_naive_utc(latest_vote_ts)
            elapsed = now - latest_vote_ts_naive
            if elapsed < timedelta(minutes=min_wait_minutes):
                return 0

        created_events = 0
        voter_bot = random.choice(bots)
        self.session.add(
            Vote(
                voter_id=voter_bot.id,
                target_id=user.id,
                tip_glasa=self._random_vote_type(),
                timestamp=now,
            )
        )
        created_events += 1

        if len(bots) >= 2:
            bot_a, bot_b = random.sample(bots, k=2)
            self.session.add(
                Vote(
                    voter_id=bot_a.id,
                    target_id=bot_b.id,
                    tip_glasa=self._random_vote_type(),
                    timestamp=now + timedelta(microseconds=1),
                )
            )
            created_events += 1

        await self.session.commit()
        return created_events

    async def get_live_feedback_for_user(
        self,
        user_id: int,
        *,
        country_code: str,
        city: str,
        include_bots: bool,
        limit: int = 12,
    ) -> BotFeedbackResponse:
        voter = aliased(User)
        target = aliased(User)
        actor_is_bot = bool(include_bots)

        reaction_stmt = (
            select(
                voter.id.label("actor_id"),
                voter.ime.label("actor_name"),
                target.id.label("target_id"),
                target.ime.label("target_name"),
                Vote.tip_glasa,
                Vote.timestamp,
            )
            .select_from(Vote)
            .join(voter, Vote.voter_id == voter.id)
            .join(target, Vote.target_id == target.id)
            .where(voter.is_bot.is_(actor_is_bot))
            .where(voter.country_code == country_code)
            .where(voter.city == city)
        )

        if include_bots:
            reaction_stmt = reaction_stmt.where((Vote.target_id == user_id) | (target.is_bot.is_(True)))
        else:
            reaction_stmt = (
                reaction_stmt.where(target.is_bot.is_(False))
                .where(target.country_code == country_code)
                .where(target.city == city)
            )

        reactions = (
            await self.session.execute(reaction_stmt.order_by(Vote.timestamp.desc()).limit(limit))
        ).all()

        voter_counts = aliased(User)
        counts = (
            await self.session.execute(
                select(
                    func.coalesce(func.sum(case((Vote.tip_glasa == VoteType.kiss, 1), else_=0)), 0).label("kisses"),
                    func.coalesce(func.sum(case((Vote.tip_glasa == VoteType.marry, 1), else_=0)), 0).label("marries"),
                    func.coalesce(func.sum(case((Vote.tip_glasa == VoteType.kill, 1), else_=0)), 0).label("kills"),
                )
                .select_from(Vote)
                .join(voter_counts, Vote.voter_id == voter_counts.id)
                .where(Vote.target_id == user_id)
                .where(voter_counts.is_bot.is_(actor_is_bot))
                .where(voter_counts.country_code == country_code)
                .where(voter_counts.city == city)
            )
        ).one()

        recent = [
            BotFeedbackEntry(
                actor_user_id=int(row.actor_id),
                actor_name=str(row.actor_name),
                target_user_id=int(row.target_id),
                target_name=str(row.target_name),
                tip_glasa=row.tip_glasa,
                is_for_current_user=int(row.target_id) == user_id,
                timestamp=row.timestamp,
            )
            for row in reactions
        ]

        kisses = int(counts.kisses)
        marries = int(counts.marries)
        kills = int(counts.kills)
        return BotFeedbackResponse(
            total=kisses + marries + kills,
            kisses=kisses,
            marries=marries,
            kills=kills,
            recent=recent,
        )
