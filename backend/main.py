from __future__ import annotations

import os
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import httpx
from supabase import Client, create_client
from supabase.lib.client_options import SyncClientOptions

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.append(BACKEND_DIR)

from app.api.routes.auth import router as auth_router
from app.api.routes.leaderboard import router as leaderboard_router
from app.api.routes.location import router as location_router
from app.api.routes.rounds import router as rounds_router
from app.api.routes.votes import router as votes_router
from app.core.auth import UserNotFoundForTokenError
from app.core.config import settings
from app.core.database import AsyncSessionLocal, init_db
from app.services.bot_simulation import ENABLE_API_BOTS, BotSimulationService
from app.services.countries_sync import ensure_countries_seeded


def _create_supabase_client() -> tuple[Client | None, httpx.Client | None]:
    url = (settings.supabase_url or "").strip()
    key = (settings.supabase_key or "").strip()
    if not url or not key:
        return None, None

    http_client = httpx.Client(
        timeout=httpx.Timeout(30.0),
        limits=httpx.Limits(
            max_connections=100,
            max_keepalive_connections=40,
            keepalive_expiry=45.0,
        ),
    )
    options = SyncClientOptions(
        auto_refresh_token=False,
        persist_session=False,
        httpx_client=http_client,
        postgrest_client_timeout=30,
        storage_client_timeout=30,
        function_client_timeout=30,
    )
    return create_client(url, key, options=options), http_client


def _close_supabase_client(
    *,
    supabase_client: Client | None,
    http_client: httpx.Client | None,
) -> None:
    if supabase_client is not None:
        auth_client = getattr(supabase_client, "auth", None)
        if auth_client is not None and hasattr(auth_client, "close"):
            try:
                auth_client.close()
            except Exception:
                pass

        for component_name in ("postgrest", "storage"):
            component = getattr(supabase_client, component_name, None)
            session = getattr(component, "session", None)
            if session is not None and hasattr(session, "close"):
                try:
                    session.close()
                except Exception:
                    pass

    if http_client is not None and not http_client.is_closed:
        try:
            http_client.close()
        except Exception:
            pass


@asynccontextmanager
async def lifespan(app: FastAPI):
    supabase_client, supabase_http_client = _create_supabase_client()
    app.state.supabase = supabase_client
    app.state.supabase_http_client = supabase_http_client
    await init_db()
    async with AsyncSessionLocal() as session:
        await ensure_countries_seeded(session=session)
    if ENABLE_API_BOTS:
        async with AsyncSessionLocal() as session:
            bot_service = BotSimulationService(session)
            await bot_service.ensure_bots_seeded()
    try:
        yield
    finally:
        _close_supabase_client(
            supabase_client=supabase_client,
            http_client=supabase_http_client,
        )


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    lifespan=lifespan,
)

uploads_dir = os.path.join(BACKEND_DIR, "uploads")
os.makedirs(uploads_dir, exist_ok=True)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://kissmerrykil.com",
        "https://www.kissmerrykil.com",
        "https://kiss-merry-kill.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_private_network=True,
)

app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

app.include_router(auth_router)
app.include_router(leaderboard_router)
app.include_router(location_router)
app.include_router(rounds_router)
app.include_router(votes_router)


@app.exception_handler(UserNotFoundForTokenError)
async def user_not_found_for_token_handler(_: Request, __: UserNotFoundForTokenError) -> JSONResponse:
    return JSONResponse(
        status_code=401,
        content={
            "detail": "user_not_found",
            "error": "User not found for this token",
        },
    )


@app.get("/health", tags=["health"])
async def health_check() -> dict[str, str]:
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
