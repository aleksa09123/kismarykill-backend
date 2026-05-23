from __future__ import annotations

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.database import get_async_session
from app.core.location_context import decode_location_cookie_value
from app.models.user import User
from app.schemas.round import GetRoundRequest, GetRoundResponse, ZoneDebugResponse
from app.services.bot_simulation import BOT_TARGET_COUNT, ENABLE_API_BOTS, BotSimulationService
from app.services.matchmaking import MatchmakingService

router = APIRouter(tags=["rounds"])


@router.post("/get-round", response_model=GetRoundResponse)
@router.post("/discovery", response_model=GetRoundResponse)
async def get_round(
    payload: GetRoundRequest,
    request: Request,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user),
) -> GetRoundResponse:
    del payload
    location_context = decode_location_cookie_value(request.cookies.get("user_location"))
    use_api_bots = location_context.is_global and ENABLE_API_BOTS

    if use_api_bots:
        bot_service = BotSimulationService(session)
        await bot_service.ensure_bots_seeded_for_location(
            country_code=location_context.country_code,
            city=location_context.city,
            country_name=location_context.country_name,
            latitude=location_context.latitude,
            longitude=location_context.longitude,
            target_count=BOT_TARGET_COUNT,
        )
        await bot_service.simulate_paced_activity_for_user(
            current_user,
            country_code=location_context.country_code,
            city=location_context.city,
        )

    service = MatchmakingService(session)
    result = await service.get_round_candidates(
        user=current_user,
        country_code=location_context.country_code,
        country_name=location_context.country_name,
        city=location_context.city,
        latitude=location_context.latitude,
        longitude=location_context.longitude,
        use_bots=use_api_bots,
        round_size=3,
    )
    return GetRoundResponse(zone_id=result.zone_id, users=result.users)


@router.get("/profiles", response_model=GetRoundResponse)
async def get_profiles(
    request: Request,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user),
) -> GetRoundResponse:
    location_context = decode_location_cookie_value(request.cookies.get("user_location"))
    use_api_bots = location_context.is_global and ENABLE_API_BOTS

    if use_api_bots:
        bot_service = BotSimulationService(session)
        await bot_service.ensure_bots_seeded_for_location(
            country_code=location_context.country_code,
            city=location_context.city,
            country_name=location_context.country_name,
            latitude=location_context.latitude,
            longitude=location_context.longitude,
            target_count=BOT_TARGET_COUNT,
        )
        await bot_service.simulate_paced_activity_for_user(
            current_user,
            country_code=location_context.country_code,
            city=location_context.city,
        )

    service = MatchmakingService(session)
    result = await service.get_round_candidates(
        user=current_user,
        country_code=location_context.country_code,
        country_name=location_context.country_name,
        city=location_context.city,
        latitude=location_context.latitude,
        longitude=location_context.longitude,
        use_bots=use_api_bots,
        round_size=3,
    )
    return GetRoundResponse(zone_id=result.zone_id, users=result.users)


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
        city=location_context.city,
        latitude=location_context.latitude,
        longitude=location_context.longitude,
        use_bots=use_api_bots,
    )
