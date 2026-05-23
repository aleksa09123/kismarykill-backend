from __future__ import annotations

import random

from fastapi import APIRouter, Depends, Request
from sqlalchemy import Integer, case, cast, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.database import get_async_session
from app.core.location_context import decode_location_cookie_value
from app.models.enums import VoteType
from app.models.user import User
from app.models.vote import Vote
from app.schemas.leaderboard import LeaderboardEntry, LeaderboardResponse
from app.services.bot_simulation import ENABLE_API_BOTS, LOCAL_AI_BOT_TARGET_COUNT, BotSimulationService

router = APIRouter(tags=["leaderboard"])


def _synthetic_local_stats(
    *,
    bot_id: int,
    country_code: str,
    city: str,
) -> tuple[int, int, int, int, float]:
    seeded = random.Random(f"{country_code}|{city}|{bot_id}")
    rounds_played = seeded.randint(140, 540)
    win_rate = round(seeded.uniform(62.0, 97.0), 1)
    score = int(rounds_played * (win_rate / 100.0) * seeded.uniform(4.5, 8.0))
    kisses = seeded.randint(35, 220)
    marries = seeded.randint(30, 190)
    kills = seeded.randint(5, 55)
    return score, kisses, marries, kills, win_rate


@router.get("/leaderboard", response_model=LeaderboardResponse)
async def get_leaderboard(
    request: Request,
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session),
) -> LeaderboardResponse:
    location_context = decode_location_cookie_value(request.cookies.get("user_location"))

    if not location_context.is_global and ENABLE_API_BOTS:
        bot_service = BotSimulationService(session)
        await bot_service.ensure_local_ai_bots_for_location(
            country_code=location_context.country_code,
            city=location_context.city,
            country_name=location_context.country_name,
            latitude=location_context.latitude,
            longitude=location_context.longitude,
            target_count=LOCAL_AI_BOT_TARGET_COUNT,
        )
        local_bots = await bot_service.get_local_ai_bots_for_location(
            country_code=location_context.country_code,
            city=location_context.city,
            limit=LOCAL_AI_BOT_TARGET_COUNT,
        )

        leaderboard_rows: list[LeaderboardEntry] = []
        for bot in local_bots:
            score, kisses, marries, kills, win_rate = _synthetic_local_stats(
                bot_id=bot.id,
                country_code=location_context.country_code,
                city=location_context.city,
            )
            leaderboard_rows.append(
                LeaderboardEntry(
                    rank=0,
                    user_id=bot.id,
                    name=bot.ime,
                    profile_image_url=bot.profile_image_url or bot.slika_url,
                    score=score,
                    kisses=kisses,
                    marries=marries,
                    kills=kills,
                    rounds_played=max(30, score // 6),
                    win_rate=win_rate,
                )
            )

        top_rows = sorted(
            leaderboard_rows,
            key=lambda entry: (entry.score, entry.rounds_played, entry.win_rate),
            reverse=True,
        )[:10]
        ranked = [
            LeaderboardEntry(
                rank=index + 1,
                user_id=entry.user_id,
                name=entry.name,
                profile_image_url=entry.profile_image_url,
                score=entry.score,
                kisses=entry.kisses,
                marries=entry.marries,
                kills=entry.kills,
                rounds_played=entry.rounds_played,
                win_rate=entry.win_rate,
            )
            for index, entry in enumerate(top_rows)
        ]
        return LeaderboardResponse(users=ranked)

    marry_points = cast(3, Integer)
    kiss_points = cast(2, Integer)
    kill_points = cast(-1, Integer)
    zero = cast(0, Integer)
    one = cast(1, Integer)

    score_expr = func.sum(
        case(
            (Vote.tip_glasa == VoteType.marry, marry_points),
            (Vote.tip_glasa == VoteType.kiss, kiss_points),
            (Vote.tip_glasa == VoteType.kill, kill_points),
            else_=zero,
        )
    )
    kisses_expr = func.sum(case((Vote.tip_glasa == VoteType.kiss, one), else_=zero))
    marries_expr = func.sum(case((Vote.tip_glasa == VoteType.marry, one), else_=zero))
    kills_expr = func.sum(case((Vote.tip_glasa == VoteType.kill, one), else_=zero))

    stmt = (
        select(
            User.id.label("user_id"),
            User.ime.label("name"),
            func.coalesce(User.profile_image_url, User.slika_url).label("profile_image_url"),
            func.coalesce(score_expr, zero).label("score"),
            func.coalesce(kisses_expr, zero).label("kisses"),
            func.coalesce(marries_expr, zero).label("marries"),
            func.coalesce(kills_expr, zero).label("kills"),
        )
        .outerjoin(Vote, Vote.target_id == User.id)
        .where(User.country_code == location_context.country_code)
        .where(User.city == location_context.city)
        .group_by(User.id, User.ime, User.profile_image_url, User.slika_url)
        .order_by(
            func.coalesce(score_expr, zero).desc(),
            func.coalesce(marries_expr, zero).desc(),
            func.coalesce(kisses_expr, zero).desc(),
            User.id.asc(),
        )
        .limit(100)
    )
    if not ENABLE_API_BOTS:
        stmt = stmt.where(User.is_bot.is_(False))

    rows = (await session.execute(stmt)).all()
    entries = [
        LeaderboardEntry(
            rank=index + 1,
            user_id=row.user_id,
            name=row.name,
            profile_image_url=row.profile_image_url,
            score=int(row.score),
            kisses=int(row.kisses),
            marries=int(row.marries),
            kills=int(row.kills),
            rounds_played=max(0, int(row.kisses) + int(row.marries) + int(row.kills)),
            win_rate=round(
                (
                    (int(row.kisses) + int(row.marries))
                    / max(1, int(row.kisses) + int(row.marries) + int(row.kills))
                )
                * 100.0,
                1,
            ),
        )
        for index, row in enumerate(rows)
    ]
    return LeaderboardResponse(users=entries)
