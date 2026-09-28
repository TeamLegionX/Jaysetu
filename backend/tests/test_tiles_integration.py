"""Integration test against a real PostGIS instance. Skips cleanly if DATABASE_URL/Postgres is unavailable."""
import asyncio
import os

import pytest
from fastapi.testclient import TestClient

asyncpg = pytest.importorskip("asyncpg")


def _pg_available() -> bool:
    async def _check():
        conn = await asyncpg.connect(host="localhost", user="postgres", password="postgres", database="springrevival")
        await conn.close()
    try:
        asyncio.run(_check())
        return True
    except Exception:
        return False


pytestmark = pytest.mark.skipif(not _pg_available(), reason="PostGIS not reachable")


@pytest.fixture(scope="module", autouse=True)
def _env():
    os.environ["DATABASE_URL"] = "postgresql://postgres:postgres@localhost:5432/springrevival"
    yield


def test_tile_over_known_spring_has_bytes():
    from app.main import app
    client = TestClient(app)
    # tile computed for (76.9558, 11.4064) at z=12 -> x=2923, y=1917 (inserted in db/schema.sql test data)
    r = client.get("/tiles/springs/12/2923/1917.mvt")
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("application/vnd.mapbox-vector-tile")
    assert len(r.content) > 0


def test_empty_tile_returns_204():
    from app.main import app
    client = TestClient(app)
    r = client.get("/tiles/springs/12/0/0.mvt")
    assert r.status_code == 204


def test_unknown_layer_404():
    from app.main import app
    client = TestClient(app)
    r = client.get("/tiles/not_a_layer/1/0/0.mvt")
    assert r.status_code == 404


def test_out_of_range_xy_400():
    from app.main import app
    client = TestClient(app)
    r = client.get("/tiles/springs/2/99/99.mvt")
    assert r.status_code == 400
