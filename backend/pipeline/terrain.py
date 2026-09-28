"""DEM ingestion and terrain derivatives (30 m CartoDEM -> conditioned DEM, flow dir/acc, slope, TWI).

CartoDEM tiles are distributed through NRSC Bhuvan behind a login, so tiles must be downloaded
manually (or via an authorised mirror) and passed in as GeoTIFF paths.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Sequence

import numpy as np
import rasterio

from . import _compat  # noqa: F401  (pysheds/NumPy 2.4 shim)
from rasterio.merge import merge
from rasterio.warp import Resampling, calculate_default_transform, reproject
from rasterio.crs import CRS

log = logging.getLogger(__name__)

MIN_SLOPE_RAD = 1e-3  # brief: replace beta <= 0 with 0.001 rad before tan(beta)


# ----------------------------------------------------------------------------- I/O helpers
def mosaic_tiles(tile_paths: Sequence[str | Path], out_path: str | Path) -> Path:
    """Mosaic DEM tiles into one GeoTIFF."""
    srcs = [rasterio.open(p) for p in tile_paths]
    try:
        arr, transform = merge(srcs)
        meta = srcs[0].meta.copy()
        meta.update(height=arr.shape[1], width=arr.shape[2], transform=transform, driver="GTiff")
        with rasterio.open(out_path, "w", **meta) as dst:
            dst.write(arr)
    finally:
        for s in srcs:
            s.close()
    return Path(out_path)


def utm_crs_for(lon: float, lat: float) -> CRS:
    zone = int((lon + 180) // 6) + 1
    return CRS.from_epsg((32600 if lat >= 0 else 32700) + zone)


def to_projected(src_path: str | Path, dst_path: str | Path, resolution_m: float = 30.0) -> Path:
    """Reproject to UTM if the DEM is in geographic coordinates (slope/area need metres)."""
    with rasterio.open(src_path) as src:
        if src.crs is None:
            raise ValueError("DEM has no CRS")
        if not src.crs.is_geographic:
            if src.crs.to_string() != "" and str(dst_path) != str(src_path):
                Path(dst_path).write_bytes(Path(src_path).read_bytes())
            return Path(dst_path)
        cx, cy = (src.bounds.left + src.bounds.right) / 2, (src.bounds.top + src.bounds.bottom) / 2
        dst_crs = utm_crs_for(cx, cy)
        transform, w, h = calculate_default_transform(src.crs, dst_crs, src.width, src.height,
                                                      *src.bounds, resolution=resolution_m)
        meta = src.meta.copy()
        meta.update(crs=dst_crs, transform=transform, width=w, height=h, nodata=-9999.0, dtype="float32")
        with rasterio.open(dst_path, "w", **meta) as dst:
            reproject(source=rasterio.band(src, 1), destination=rasterio.band(dst, 1),
                      src_transform=src.transform, src_crs=src.crs, dst_transform=transform,
                      dst_crs=dst_crs, resampling=Resampling.bilinear, dst_nodata=-9999.0)
    return Path(dst_path)


# ----------------------------------------------------------------------------- pure numpy pieces
def slope_radians(dem: np.ndarray, cellsize: float) -> np.ndarray:
    """Slope angle (rad) via central differences. NaNs propagate."""
    gy, gx = np.gradient(dem, cellsize)
    return np.arctan(np.hypot(gx, gy))


def compute_twi(flow_acc_cells: np.ndarray, slope_rad: np.ndarray, cellsize: float,
                min_slope_rad: float = MIN_SLOPE_RAD) -> np.ndarray:
    """TWI = ln(a / tan(beta)); a = specific catchment area = acc * cellsize (m) [cells * m^2 / m].

    Non-positive / zero slopes are replaced by `min_slope_rad` BEFORE tan(), so flat cells give a
    large-but-finite TWI instead of division by zero / +inf.
    """
    if min_slope_rad <= 0:
        raise ValueError("min_slope_rad must be > 0")
    beta = np.where(np.isnan(slope_rad), np.nan, np.where(slope_rad <= 0, min_slope_rad, slope_rad))
    a = flow_acc_cells * cellsize
    with np.errstate(divide="ignore", invalid="ignore"):
        twi = np.log(a / np.tan(beta))
    return twi


# ----------------------------------------------------------------------------- pysheds pipeline
@dataclass
class TerrainProducts:
    dem_filled: np.ndarray
    flowdir: np.ndarray
    flowacc: np.ndarray
    slope_rad: np.ndarray
    twi: np.ndarray
    cellsize: float
    transform: rasterio.Affine
    crs: CRS


def process_dem(dem_path: str | Path, routing: str = "d8") -> TerrainProducts:
    """Sink filling -> flow direction (D8 / D-inf) -> accumulation -> slope -> TWI."""
    from pysheds.grid import Grid  # imported lazily so unit tests of pure functions don't need it

    if routing not in {"d8", "dinf"}:
        raise ValueError("routing must be 'd8' or 'dinf'")
    with rasterio.open(dem_path) as src:
        if src.crs is None or src.crs.is_geographic:
            raise ValueError("DEM must be in a projected CRS; run to_projected() first")
        cellsize = float(abs(src.transform.a))
        transform, crs = src.transform, src.crs

    grid = Grid.from_raster(str(dem_path))
    dem = grid.read_raster(str(dem_path))
    pit_filled = grid.fill_pits(dem)
    flooded = grid.fill_depressions(pit_filled)
    inflated = grid.resolve_flats(flooded)
    fdir = grid.flowdir(inflated, routing=routing)
    acc = grid.accumulation(fdir, routing=routing)

    filled = np.array(flooded, dtype="float64")
    filled[~np.isfinite(filled)] = np.nan
    slope = slope_radians(filled, cellsize)
    acc_arr = np.array(acc, dtype="float64")
    n_flat = int((slope <= 0).sum())
    if n_flat:
        log.info("TWI: %d zero-slope cells patched to %.4f rad", n_flat, MIN_SLOPE_RAD)
    twi = compute_twi(acc_arr, slope, cellsize)
    return TerrainProducts(filled, np.array(fdir), acc_arr, slope, twi, cellsize, transform, crs)


def catchment_of(dem_path: str | Path, x: float, y: float, routing: str = "d8",
                 snap_acc_threshold: float = 100) -> np.ndarray:
    """Boolean mask of the contributing area of an outlet (x, y in the DEM's CRS); snaps to the
    nearest high-accumulation cell so a hand-placed spring point lands on a stream."""
    from pysheds.grid import Grid

    grid = Grid.from_raster(str(dem_path))
    dem = grid.read_raster(str(dem_path))
    inflated = grid.resolve_flats(grid.fill_depressions(grid.fill_pits(dem)))
    fdir = grid.flowdir(inflated, routing=routing)
    acc = grid.accumulation(fdir, routing=routing)
    xs, ys = grid.snap_to_mask(acc > snap_acc_threshold, (x, y))
    return np.array(grid.catchment(x=xs, y=ys, fdir=fdir, xytype="coordinate", routing=routing), dtype=bool)


def write_raster(arr: np.ndarray, path: str | Path, transform, crs, nodata: float = -9999.0) -> Path:
    out = np.where(np.isfinite(arr), arr, nodata).astype("float32")
    with rasterio.open(path, "w", driver="GTiff", height=out.shape[0], width=out.shape[1], count=1,
                       dtype="float32", crs=crs, transform=transform, nodata=nodata, compress="deflate") as dst:
        dst.write(out, 1)
    return Path(path)
