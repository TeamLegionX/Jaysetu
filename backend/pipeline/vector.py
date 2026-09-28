"""GSI Bhukosh vector ingestion helpers: tile a study area under the download size cap, then
dissolve the downloaded tiles so the tiling grid leaves no seams.

The Bhukosh portal has no stable public API, so downloading stays a manual/authorised step.
"""
from __future__ import annotations

import math
from typing import Iterable

import geopandas as gpd
import pandas as pd
from pyproj import Geod
from shapely.geometry import box
from shapely.ops import linemerge, unary_union

MAX_TILE_KM2 = 50_000.0
_GEOD = Geod(ellps="WGS84")


def bbox_area_km2(minx: float, miny: float, maxx: float, maxy: float) -> float:
    area, _ = _GEOD.geometry_area_perimeter(box(minx, miny, maxx, maxy))
    return abs(area) / 1e6


def split_bbox(bbox: tuple[float, float, float, float], max_km2: float = MAX_TILE_KM2 * 0.9
               ) -> list[tuple[float, float, float, float]]:
    """Split a lon/lat bbox into a regular grid of tiles each below `max_km2` (default 90 % of the cap)."""
    minx, miny, maxx, maxy = bbox
    if not (minx < maxx and miny < maxy):
        raise ValueError("invalid bbox")
    total = bbox_area_km2(*bbox)
    n = max(1, math.ceil(math.sqrt(total / max_km2)))
    while True:
        xs = [minx + (maxx - minx) * i / n for i in range(n + 1)]
        ys = [miny + (maxy - miny) * j / n for j in range(n + 1)]
        tiles = [(xs[i], ys[j], xs[i + 1], ys[j + 1]) for i in range(n) for j in range(n)]
        if max(bbox_area_km2(*t) for t in tiles) < max_km2:
            return tiles
        n += 1


def dissolve_polygons(tiles: Iterable[gpd.GeoDataFrame], by: str | list[str]) -> gpd.GeoDataFrame:
    """Concatenate tile GeoDataFrames and dissolve on attribute(s), merging polygons that touch across tile edges.

    Returns single-part polygons (exploded) so downstream area stats are per-patch.
    """
    tiles = list(tiles)
    gdf = gpd.GeoDataFrame(pd.concat(tiles, ignore_index=True), geometry="geometry", crs=tiles[0].crs)
    gdf["geometry"] = gdf.geometry.make_valid()
    out = gdf.dissolve(by=by, as_index=False)
    return out.explode(index_parts=False, ignore_index=True)


def dissolve_lines(tiles: Iterable[gpd.GeoDataFrame], by: str | None = None) -> gpd.GeoDataFrame:
    """Merge lineaments cut at tile edges back into continuous lines."""
    tiles = list(tiles)
    gdf = gpd.GeoDataFrame(pd.concat(tiles, ignore_index=True), geometry="geometry", crs=tiles[0].crs)
    groups = [(None, gdf)] if by is None else list(gdf.groupby(by))
    rows = []
    for key, g in groups:
        merged = linemerge(unary_union(list(g.geometry)))
        parts = list(merged.geoms) if hasattr(merged, "geoms") else [merged]
        for part in parts:
            row = {"geometry": part}
            if by is not None:
                row[by] = key
            rows.append(row)
    return gpd.GeoDataFrame(rows, geometry="geometry", crs=gdf.crs)


def lineament_density(lines: gpd.GeoDataFrame, cell_polygons: gpd.GeoDataFrame) -> pd.Series:
    """Total lineament length (km) per km2 within each cell polygon. Inputs must share a projected CRS."""
    if lines.crs is None or lines.crs.is_geographic or cell_polygons.crs is None or cell_polygons.crs.is_geographic:
        raise ValueError("use a projected CRS (metres)")
    inter = gpd.overlay(lines[["geometry"]], cell_polygons[["geometry"]].reset_index(names="cell"),
                        how="intersection", keep_geom_type=True)
    length_km = inter.geometry.length.groupby(inter["cell"]).sum() / 1000.0
    area_km2 = cell_polygons.geometry.area / 1e6
    return (length_km.reindex(cell_polygons.index).fillna(0.0) / area_km2).rename("lineament_density_km_per_km2")
