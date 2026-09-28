"""Recharge assessment: delineate and persist a spring's springshed (recharge/catchment area).

POST triggers delineation (DEM-based if a DEM is available for the spring's state, else a
documented buffer fallback - see hydrology/recharge_assessment.py) and stores the polygon in
`recharge_zones`. GET returns what's stored for a spring.
"""
from __future__ import annotations

import json
import os
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query

from db.connection import acquire
from hydrology.recharge_assessment import assess_recharge_area

router = APIRouter(prefix="/api/v1/recharge-assessment", tags=["recharge-assessment"])

DEM_DIR = os.environ.get("DEM_DIR", "/home/claude/springrevival/data/dem")


def _dem_path_for_state(state_code: str | None) -> str | None:
    if not state_code:
        return None
    p = Path(DEM_DIR) / f"{state_code.upper()}.tif"
    return str(p) if p.exists() else None


@router.post("/{spring_id}")
async def run_recharge_assessment(spring_id: int, dem_path: str | None = Query(default=None),
                                  fallback_radius_m: float = Query(default=500.0, gt=0)) -> dict:
    async with acquire() as conn:
        spring = await conn.fetchrow(
            "SELECT id, state_code, ST_Y(geom) AS lat, ST_X(geom) AS lon FROM springs WHERE id = $1", spring_id)
        if spring is None:
            raise HTTPException(404, f"spring {spring_id} not found")

        path = dem_path or _dem_path_for_state(spring["state_code"])
        result = assess_recharge_area(spring["lon"], spring["lat"], dem_path=path,
                                      fallback_radius_m=fallback_radius_m)

        row = await conn.fetchrow(
            """INSERT INTO recharge_zones (spring_id, zone_rank, mean_score, area_m2, reasons, geom)
               VALUES ($1, 1, NULL, $2, $3::jsonb, ST_Multi(ST_SetSRID(ST_GeomFromText($4), 4326)))
               RETURNING id""",
            spring_id, result.area_m2, json.dumps({"method": result.method, "detail": result.detail}),
            result.geometry.wkt)

    return {"zone_id": row["id"], "spring_id": spring_id, "method": result.method,
           "area_m2": result.area_m2, "detail": result.detail}


@router.get("/{spring_id}")
async def get_recharge_zones(spring_id: int) -> list[dict]:
    async with acquire() as conn:
        rows = await conn.fetch(
            """SELECT id, zone_rank, mean_score, area_m2, reasons, created_at,
                      ST_AsGeoJSON(geom) AS geojson
               FROM recharge_zones WHERE spring_id = $1 ORDER BY created_at DESC""", spring_id)
    return [dict(r) | {"reasons": json.loads(r["reasons"]) if r["reasons"] else None,
                       "geojson": json.loads(r["geojson"])} for r in rows]
