"""Shared fixtures for API tests that need a live PostGIS instance.

DB-backed tests are skipped cleanly (not failed) if Postgres isn't reachable. Everything here is
synchronous (asyncio.run under the hood) so it works without a pytest-asyncio plugin; the FastAPI
TestClient itself drives the app's async routes through its own event loop per request.
"""
from __future__ import annotations

import asyncio
import os

import pytest

asyncpg = pytest.importorskip("asyncpg")

DB_KWARGS = dict(host="localhost", user="postgres", password="postgres", database="springrevival")


def _run(coro):
    return asyncio.run(coro)


def _pg_available() -> bool:
    async def _check():
        conn = await asyncpg.connect(**DB_KWARGS)
        await conn.close()
    try:
        _run(_check())
        return True
    except Exception:
        return False


requires_pg = pytest.mark.skipif(not _pg_available(), reason="PostGIS not reachable")


@pytest.fixture(scope="session", autouse=True)
def _database_env():
    os.environ["DATABASE_URL"] = "postgresql://postgres:postgres@localhost:5432/springrevival"
    yield


@pytest.fixture()
def client():
    from fastapi.testclient import TestClient
    from app.main import app
    return TestClient(app)


def fetch(query: str, *args):
    async def _q():
        conn = await asyncpg.connect(**DB_KWARGS)
        try:
            return await conn.fetch(query, *args)
        finally:
            await conn.close()
    return _run(_q())


def execute(query: str, *args):
    async def _q():
        conn = await asyncpg.connect(**DB_KWARGS)
        try:
            return await conn.execute(query, *args)
        finally:
            await conn.close()
    return _run(_q())


@pytest.fixture()
def clean_tables():
    """Wipe the tables the API test suite writes to, before AND after each test, so tests don't
    depend on execution order or on whatever seed.py last loaded."""
    stmt = ("TRUNCATE interventions, recharge_zones, discharge_readings, hydromet_readings, "
           "review_queue, springs RESTART IDENTITY CASCADE")
    execute(stmt)
    yield
    execute(stmt)
