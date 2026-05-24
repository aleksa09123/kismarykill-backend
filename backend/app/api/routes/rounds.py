from __future__ import annotations

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.database import get_async_session
from app.core.location_context import LocationContext, decode_location_cookie_value
from app.models.user import User
from app.schemas.round import GetRoundBatchResponse, GetRoundRequest, GetRoundResponse, ZoneDebugResponse
from app.services.bot_simulation import BOT_TARGET_COUNT, ENABLE_API_BOTS, BotSimulationService
from app.services.matchmaking import MatchmakingService

router = APIRouter(tags=["rounds"])
ROUND_SIZE = 3
DEFAULT_BATCH_SIZE = 18
MAX_BATCH_SIZE = 20


async def _prepare_round_context(
    *,
    request: Request,
    session: AsyncSession,
    current_user: User,
) -> tuple[LocationContext, bool]:
    location_context = decode_location_cookie_value(request.cookies.get("user_location"))
    use_api_bots = location_context.is_global and ENABLE_API_BOTS

    if use_api_bots:
        bot_service = BotSimulationService(session)
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

    return location_context, use_api_bots


async def _load_round(
    *,
    session: AsyncSession,
    current_user: User,
    location_context: LocationContext,
    use_api_bots: bool,
    exclude_user_ids: set[int] | None = None,
) -> GetRoundResponse:
    service = MatchmakingService(session)
    result = await service.get_round_candidates(
        user=current_user,
        country_code=location_context.country_code,
        country_name=location_context.country_name,
        latitude=location_context.latitude,
        longitude=location_context.longitude,
        use_bots=use_api_bots,
        round_size=ROUND_SIZE,
        exclude_user_ids=exclude_user_ids,
    )
    return GetRoundResponse(zone_id=result.zone_id, users=result.users)


@router.post("/get-round", response_model=GetRoundResponse)
@router.post("/discovery", response_model=GetRoundResponse)
async def get_round(
    payload: GetRoundRequest,
    request: Request,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user),
) -> GetRoundResponse:
    del payload
    location_context, use_api_bots = await _prepare_round_context(
        request=request,
        session=session,
        current_user=current_user,
    )
    return await _load_round(
        session=session,
        current_user=current_user,
        location_context=location_context,
        use_api_bots=use_api_bots,
    )


@router.get("/profiles", response_model=GetRoundResponse)
async def get_profiles(
    request: Request,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user),
) -> GetRoundResponse:
    location_context, use_api_bots = await _prepare_round_context(
        request=request,
        session=session,
        current_user=current_user,
    )
    return await _load_round(
        session=session,
        current_user=current_user,
        location_context=location_context,
        use_api_bots=use_api_bots,
    )


@router.get("/profiles/batch", response_model=GetRoundBatchResponse)
async def get_profiles_batch(
    request: Request,
    count: int = Query(default=DEFAULT_BATCH_SIZE, ge=1, le=MAX_BATCH_SIZE),
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user),
) -> GetRoundBatchResponse:
    location_context, use_api_bots = await _prepare_round_context(
        request=request,
        session=session,
        current_user=current_user,
    )

    rounds: list[GetRoundResponse] = []
    seen_target_ids: set[int] = set()

    for _ in range(count):
        round_response = await _load_round(
            session=session,
            current_user=current_user,
            location_context=location_context,
            use_api_bots=use_api_bots,
            exclude_user_ids=seen_target_ids if seen_target_ids else None,
        )
        if len(round_response.users) < ROUND_SIZE and seen_target_ids:
            round_response = await _load_round(
                session=session,
                current_user=current_user,
                location_context=location_context,
                use_api_bots=use_api_bots,
            )

        rounds.append(round_response)
        seen_target_ids.update(user.target_id for user in round_response.users)

    return GetRoundBatchResponse(rounds=rounds)


@router.get("/debug/zone", response_model=ZoneDebugResponse)
async def get_zone_debug(
    request: Request,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user),
) -> ZoneDebugResponse:
    location_context = decode_location_cookie_value(request.cookies.get("user_location"))
    use_api_bots = location_context.is_global and ENABLE_API_BOTS

    service = MatchmakingService(session)
    return await service.get_zone_debug_info(
        user=current_user,
        country_code=location_context.country_code,
        country_name=location_context.country_name,
        latitude=location_context.latitude,
        longitude=location_context.longitude,
        use_bots=use_api_bots,
    )
