from __future__ import annotations

from fastapi import APIRouter, BackgroundTasks, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.database import AsyncSessionLocal, get_async_session
from app.core.location_context import decode_location_cookie_value
from app.models.user import User
from app.schemas.vote import BotFeedbackEntry, BotFeedbackResponse, VoteRoundRequest, VoteRoundResponse
from app.services.bot_simulation import BOT_TARGET_COUNT, ENABLE_API_BOTS, LOCAL_AI_BOT_TARGET_COUNT, BotSimulationService
from app.services.voting import VotingService

router = APIRouter(tags=["votes"])
PAYWALL_MESSAGE = "Unlock your Live Feed to see exactly who Kissed, Married, or Killed you!"


def _apply_paywall_mask(feedback: BotFeedbackResponse) -> BotFeedbackResponse:
    masked_recent = [
        BotFeedbackEntry(
            actor_user_id=0,
            actor_name="Hidden Member",
            target_user_id=0 if not entry.is_for_current_user else entry.target_user_id,
            target_name="you" if entry.is_for_current_user else "Hidden Member",
            tip_glasa=entry.tip_glasa,
            is_for_current_user=entry.is_for_current_user,
            timestamp=entry.timestamp,
        )
        for entry in feedback.recent
    ]
    return BotFeedbackResponse(
        total=feedback.total,
        kisses=feedback.kisses,
        marries=feedback.marries,
        kills=feedback.kills,
        recent=masked_recent,
        is_masked=True,
        paywall_message=PAYWALL_MESSAGE,
    )


async def _simulate_local_ai_feed_background(
    user_id: int,
    country_code: str,
    local_bot_ids: list[int],
) -> None:
    async with AsyncSessionLocal() as background_session:
        background_service = BotSimulationService(background_session)
        await background_service.simulate_local_ai_live_feed_event(
            user_id=user_id,
            country_code=country_code,
            local_bot_ids=local_bot_ids,
        )


@router.post("/vote", response_model=VoteRoundResponse)
async def submit_vote(
    payload: VoteRoundRequest,
    request: Request,
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user),
) -> VoteRoundResponse:
    service = VotingService(session)
    saved_votes = await service.submit_round_votes(voter_id=current_user.id, payload=payload)

    location_context = decode_location_cookie_value(request.cookies.get("user_location"))
    bot_service = BotSimulationService(session)
    if location_context.is_global:
        if ENABLE_API_BOTS:
            await bot_service.ensure_bots_seeded_for_location(
                country_code=location_context.country_code,
                country_name=location_context.country_name,
                latitude=location_context.latitude,
                longitude=location_context.longitude,
                target_count=BOT_TARGET_COUNT,
            )
            await bot_service.simulate_paced_activity_for_user(
                current_user,
                country_code=location_context.country_code,
            )
    else:
        round_target_ids = [vote.target_id for vote in payload.votes]
        contains_local_bots = await bot_service.round_contains_local_ai_bots(
            country_code=location_context.country_code,
            user_ids=round_target_ids,
        )
        if ENABLE_API_BOTS and contains_local_bots:
            background_tasks.add_task(
                _simulate_local_ai_feed_background,
                current_user.id,
                location_context.country_code,
                round_target_ids,
            )

    return VoteRoundResponse(status="ok", saved_votes=saved_votes)


@router.get("/bot-feedback", response_model=BotFeedbackResponse)
async def get_bot_feedback(
    request: Request,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user),
) -> BotFeedbackResponse:
    bot_service = BotSimulationService(session)
    location_context = decode_location_cookie_value(request.cookies.get("user_location"))
    include_bots = location_context.is_global and ENABLE_API_BOTS
    if location_context.is_global:
        if ENABLE_API_BOTS:
            await bot_service.ensure_bots_seeded_for_location(
                country_code=location_context.country_code,
                country_name=location_context.country_name,
                latitude=location_context.latitude,
                longitude=location_context.longitude,
                target_count=BOT_TARGET_COUNT,
            )
            await bot_service.simulate_paced_activity_for_user(
                current_user,
                country_code=location_context.country_code,
            )
    else:
        include_bots = await bot_service.should_use_local_ai_bots(
            country_code=location_context.country_code,
            exclude_user_id=current_user.id,
        )
        if ENABLE_API_BOTS and include_bots:
            await bot_service.ensure_local_ai_bots_for_location(
                country_code=location_context.country_code,
                country_name=location_context.country_name,
                latitude=location_context.latitude,
                longitude=location_context.longitude,
                target_count=LOCAL_AI_BOT_TARGET_COUNT,
            )

    feedback = await bot_service.get_live_feedback_for_user(
        current_user.id,
        country_code=location_context.country_code,
        include_bots=include_bots,
    )
    if current_user.is_premium:
        return feedback

    return _apply_paywall_mask(feedback)
