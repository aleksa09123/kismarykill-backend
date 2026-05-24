from __future__ import annotations

from fastapi import APIRouter, Depends, Request, Response
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.database import get_async_session
from app.core.location_context import (
    available_locations_payload,
    decode_location_cookie_value,
    encode_location_cookie_value,
    normalize_location,
)
from app.models.user import User
from app.services.bot_simulation import BOT_TARGET_COUNT, ENABLE_API_BOTS, LOCAL_AI_BOT_TARGET_COUNT, BotSimulationService

router = APIRouter(prefix="/location", tags=["location"])


class LocationSelectionRequest(BaseModel):
    country_code: str = Field(min_length=2, max_length=2)
    country_name: str | None = Field(default=None, min_length=1, max_length=120)


class LocationSelectionResponse(BaseModel):
    country_code: str
    country_name: str
    latitude: float
    longitude: float
    server_id: str


def _response_from_context(country_code: str, country_name: str, latitude: float, longitude: float, server_id: str) -> LocationSelectionResponse:
    return LocationSelectionResponse(
        country_code=country_code,
        country_name=country_name,
        latitude=latitude,
        longitude=longitude,
        server_id=server_id,
    )


@router.get("/options")
async def get_location_options() -> list[dict[str, object]]:
    return available_locations_payload()


@router.get("/current", response_model=LocationSelectionResponse)
async def get_current_location(
    request: Request,
    response: Response,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user),
) -> LocationSelectionResponse:
    raw_cookie = request.cookies.get("user_location")
    context = decode_location_cookie_value(raw_cookie)
    # Persist last known selector so user profile stays aligned with active server room.
    current_user.country_code = context.country_code
    current_user.country_name = context.country_name
    current_user.latitude = context.latitude
    current_user.longitude = context.longitude
    await session.commit()

    if context.is_global and ENABLE_API_BOTS:
        bot_service = BotSimulationService(session)
        await bot_service.ensure_bots_seeded_for_location(
            country_code=context.country_code,
            country_name=context.country_name,
            latitude=context.latitude,
            longitude=context.longitude,
            target_count=BOT_TARGET_COUNT,
        )

    if raw_cookie is None:
        response.set_cookie(
            key="user_location",
            value=encode_location_cookie_value(context),
            max_age=60 * 60 * 24 * 180,
            path="/",
            samesite="lax",
            httponly=False,
            secure=False,
        )

    return _response_from_context(
        country_code=context.country_code,
        country_name=context.country_name,
        latitude=context.latitude,
        longitude=context.longitude,
        server_id=context.server_id,
    )


@router.post("/select", response_model=LocationSelectionResponse)
async def select_location(
    payload: LocationSelectionRequest,
    response: Response,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user),
) -> LocationSelectionResponse:
    context = normalize_location(payload.country_code, payload.country_name)

    current_user.country_code = context.country_code
    current_user.country_name = context.country_name
    current_user.latitude = context.latitude
    current_user.longitude = context.longitude
    await session.commit()

    bot_service = BotSimulationService(session)
    if context.is_global and ENABLE_API_BOTS:
        await bot_service.ensure_bots_seeded_for_location(
            country_code=context.country_code,
            country_name=context.country_name,
            latitude=context.latitude,
            longitude=context.longitude,
            target_count=BOT_TARGET_COUNT,
        )
    elif ENABLE_API_BOTS:
        # Remove stale global bots and regenerate a fresh local set for selected country pool.
        await bot_service.purge_global_bots()
        await bot_service.reset_local_ai_bots_for_location(
            country_code=context.country_code,
            country_name=context.country_name,
            latitude=context.latitude,
            longitude=context.longitude,
            target_count=LOCAL_AI_BOT_TARGET_COUNT,
        )

    cookie_value = encode_location_cookie_value(context)
    response.set_cookie(
        key="user_location",
        value=cookie_value,
        max_age=60 * 60 * 24 * 180,
        path="/",
        samesite="lax",
        httponly=False,
        secure=False,
    )

    return _response_from_context(
        country_code=context.country_code,
        country_name=context.country_name,
        latitude=context.latitude,
        longitude=context.longitude,
        server_id=context.server_id,
    )
