"""Springshed (recharge/catchment area) delineation for a spring point.

Preferred path: DEM-based catchment delineation (pysheds D8/D-inf), reusing
`pipeline.terrain.catchment_of`. This needs a conditioned, projected DEM covering the point.

FALLBACK (no DEM available for the area): a geodesic circular buffer around the spring, radius
`fallback_radius_m`. This is a placeholder only - real hard-rock springshed extents vary hugely
with slope, lithology and fracture density and can be far from circular - and every zone stored
this way is tagged `method: "buffer_fallback"` so it is never mistaken for a modelled catchment.
"""
from __future__ import annotations

import math
from dataclasses import dataclass
from pathlib import Path

import numpy as np
import rasterio
from pyproj import Geod, Transformer
from rasterio import features
from shapely.geometry import Point, Polygon, shape
from shapely.ops import transform as shp_transform, unary_union

from pipeline.terrain import catchment_of

DEFAULT_FALLBACK_RADIUS_M = 500.0
_GEOD = Geod(ellps="WGS84")


@dataclass
class RechargeAssessment:
    geometry: Polygon          # EPSG:4326
    area_m2: float
    method: str                # "dem_catchment" | "buffer_fallback"
    detail: str


def _largest_polygon(polys) -> Polygon:
    polys = list(polys)
    if not polys:
        raise ValueError("no polygon produced from mask")
    return max(polys, key=lambda p: p.area)


def assess_from_dem(dem_path: str | Path, lon: float, lat: float, routing: str = "d8",
                    snap_acc_threshold: float = 100) -> RechargeAssessment:
    """Delineate the contributing catchment of the spring outlet from a conditioned DEM.

    `lon`/`lat` are reprojected into the DEM's CRS before calling `catchment_of` (which expects
    coordinates in that CRS).
    """
    with rasterio.open(dem_path) as src:
        if src.crs is None or src.crs.is_geographic:
            raise ValueError("DEM must be projected (run pipeline.terrain.to_projected first)")
        transform, crs = src.transform, src.crs
        cellsize = float(abs(transform.a))
    to_dem = Transformer.from_crs("EPSG:4326", crs, always_xy=True)
    x, y = to_dem.transform(lon, lat)

    mask = catchment_of(dem_path, x, y, routing=routing, snap_acc_threshold=snap_acc_threshold)
    if not mask.any():
        raise ValueError("empty catchment mask - point may be off the DEM or below the accumulation threshold")

    shapes = features.shapes(mask.astype("uint8"), mask=mask, transform=transform)
    poly_dem_crs = _largest_polygon(shape(g) for g, v in shapes if v == 1)
    area_m2 = float(mask.sum()) * cellsize * cellsize   # exact: projected CRS, so cell area is cellsize^2

    to_wgs84 = Transformer.from_crs(crs, "EPSG:4326", always_xy=True).transform
    poly_wgs84 = shp_transform(to_wgs84, poly_dem_crs)
    return RechargeAssessment(poly_wgs84, area_m2, "dem_catchment",
                              f"D8/D-inf ({routing}) contributing area from conditioned DEM, "
                              f"{int(mask.sum())} cells at {cellsize:.0f} m resolution.")


def assess_fallback_buffer(lon: float, lat: float, radius_m: float = DEFAULT_FALLBACK_RADIUS_M) -> RechargeAssessment:
    """Geodesic circular buffer, for when no DEM is available. See module docstring - placeholder only."""
    if radius_m <= 0:
        raise ValueError("radius_m must be > 0")
    bearings = np.linspace(0, 360, 65)[:-1]
    lons, lats, _ = _GEOD.fwd(np.full_like(bearings, lon), np.full_like(bearings, lat), bearings,
                              np.full_like(bearings, radius_m))
    poly = Polygon(zip(lons, lats))
    area_m2 = math.pi * radius_m ** 2
    return RechargeAssessment(poly, area_m2, "buffer_fallback",
                              f"No DEM supplied - placeholder {radius_m:.0f} m geodesic circular buffer. "
                              "Replace with a DEM-derived catchment before using this for sizing decisions.")


def assess_recharge_area(lon: float, lat: float, dem_path: str | Path | None = None,
                         routing: str = "d8", fallback_radius_m: float = DEFAULT_FALLBACK_RADIUS_M
                         ) -> RechargeAssessment:
    if dem_path is not None and Path(dem_path).exists():
        try:
            return assess_from_dem(dem_path, lon, lat, routing=routing)
        except ValueError:
            pass  # fall through to buffer fallback, e.g. point off-DEM or empty catchment
    return assess_fallback_buffer(lon, lat, fallback_radius_m)
