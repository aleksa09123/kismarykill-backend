from __future__ import annotations

import os
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.append(BACKEND_DIR)

from app.api.routes.auth import router as auth_router
from app.api.routes.leaderboard import router as leaderboard_router
from app.api.routes.location import router as location_router
from app.api.routes.rounds import router as rounds_router
from app.api.routes.votes import router as votes_router
from app.core.config import settings
from app.core.database import AsyncSessionLocal, init_db
from app.services.bot_simulation import ENABLE_API_BOTS, BotSimulationService


@asynccontextmanager
async def lifespan(_: FastAPI):
    await init_db()
    if ENABLE_API_BOTS:
        async with AsyncSessionLocal() as session:
            bot_service = BotSimulationService(session)
            await bot_service.ensure_bots_seeded()
    yield


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    lifespan=lifespan,
)

uploads_dir = os.path.join(BACKEND_DIR, "uploads")
os.makedirs(uploads_dir, exist_ok=True)

app.add_middleware(
    CORSMiddleware,
    # Temporary production debug mode:
    # keep CORS fully open until frontend/backend integration is verified.
    allow_origins=["*"],
    allow_credentials=True,
    # '*' includes OPTIONS and all standard HTTP methods for preflight/actual requests.
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
