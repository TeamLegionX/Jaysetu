"""Async PostgreSQL connection pool (asyncpg), configured from environment variables."""
from __future__ import annotations

import os
from contextlib import asynccontextmanager

import asyncpg

import asyncio

# Keyed by running event loop: a TestClient (or any short-lived runner) may create a fresh loop per
# request context, and an asyncpg Pool bound to a closed loop raises "another operation is in
# progress" on reuse. Keying by loop avoids that without giving up pooling in the normal
# single-loop server case.
_pools: dict[int, asyncpg.Pool] = {}


def dsn() -> str:
    return os.environ.get(
        "DATABASE_URL",
        "postgresql://{u}:{p}@{h}:{port}/{db}".format(
            u=os.environ.get("PGUSER", "postgres"), p=os.environ.get("PGPASSWORD", "postgres"),
            h=os.environ.get("PGHOST", "localhost"), port=os.environ.get("PGPORT", "5432"),
            db=os.environ.get("PGDATABASE", "springrevival")),
    )


async def get_pool() -> asyncpg.Pool:
    key = id(asyncio.get_running_loop())
    pool = _pools.get(key)
    if pool is None or pool._closed:
        pool = await asyncpg.create_pool(dsn(), min_size=1, max_size=10)
        _pools[key] = pool
    return pool


async def close_pool() -> None:
    key = id(asyncio.get_running_loop())
    pool = _pools.pop(key, None)
    if pool is not None:
        await pool.close()


@asynccontextmanager
async def acquire():
    pool = await get_pool()
    async with pool.acquire() as conn:
        yield conn
