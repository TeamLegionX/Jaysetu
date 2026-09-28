"""Mapbox Vector Tile endpoints. Never returns full GeoJSON layers to the frontend (bandwidth rule).

Serves Spring locations (points), Recharge Zones (polygons) and Intervention structures
(points/polygons) as protobuf MVT tiles via the `mvt_tile` PL/pgSQL function in db/schema.sql.
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, Response

from db.connection import acquire

router = APIRouter(prefix="/api/v1/tiles", tags=["tiles"])

# table -> (attr_cols, layer_name). Whitelisted so `tbl` is never taken from the request path.
_LAYERS = {
    "springs": ("id, display_code, village_code, spring_typology, status", "springs"),
    "recharge_zones": ("id, spring_id, zone_rank, mean_score, area_m2, reasons", "recharge_zones"),
    "interventions": ("id, zone_id, structure_type, total_cost_inr, annual_recharge_l, cost_per_litre_inr",
                      "interventions"),
}

MVT_CONTENT_TYPE = "application/x-protobuf"


async def _tile_response(layer: str, z: int, x: int, y: int) -> Response:
    if layer not in _LAYERS:
        raise HTTPException(404, f"unknown layer {layer!r}; available: {sorted(_LAYERS)}")
    if not (0 <= z <= 22):
        raise HTTPException(400, "z out of range")
    n = 2 ** z
    if not (0 <= x < n and 0 <= y < n):
        raise HTTPException(400, "x/y out of range for this z")
    attrs, name = _LAYERS[layer]
    async with acquire() as conn:
        tile = await conn.fetchval(
            "SELECT mvt_tile($1::regclass, $2, $3, $4, 'geom', $5, $6)", layer, z, x, y, attrs, name)
    if not tile:
        return Response(content=b"", status_code=204, media_type=MVT_CONTENT_TYPE)
    return Response(content=bytes(tile), media_type=MVT_CONTENT_TYPE,
                    headers={"Cache-Control": "public, max-age=300"})


@router.get("/{layer}/{z}/{x}/{y}.pbf")
async def get_tile_pbf(layer: str, z: int, x: int, y: int) -> Response:
    return await _tile_response(layer, z, x, y)


@router.get("/{layer}/{z}/{x}/{y}.mvt")
async def get_tile_mvt(layer: str, z: int, x: int, y: int) -> Response:
    return await _tile_response(layer, z, x, y)
