"""FastAPI application entrypoint."""
from __future__ import annotations

from fastapi import FastAPI

from app.api import dashboard, interventions, inventory, recharge, springs, tiles
from db.connection import close_pool

app = FastAPI(title="Jal Sethu - AI-Based Spring Revival and Recharge Planning System",
             description="Backend for Ministry of Tribal Affairs Problem Statement 26240")

app.include_router(inventory.router)
app.include_router(tiles.router)
app.include_router(dashboard.router)
app.include_router(springs.router)
app.include_router(recharge.router)
app.include_router(interventions.router)


@app.on_event("shutdown")
async def _shutdown() -> None:
    await close_pool()


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
