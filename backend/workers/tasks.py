"""Async ingestion tasks. Thin wrappers around the pipeline modules so heavy I/O (DEM downloads,
Bhukosh tiling, IMD pulls) runs off the request/response path."""
from __future__ import annotations

from workers.celery_app import celery_app


@celery_app.task(name="pipeline.process_dem_tile")
def process_dem_tile_task(dem_path: str, out_dir: str, routing: str = "d8") -> dict:
    from pipeline.terrain import process_dem, write_raster
    t = process_dem(dem_path, routing=routing)
    write_raster(t.twi, f"{out_dir}/twi.tif", t.transform, t.crs)
    write_raster(t.flowacc, f"{out_dir}/flowacc.tif", t.transform, t.crs)
    return {"shape": list(t.twi.shape), "cellsize": t.cellsize}


@celery_app.task(name="pipeline.dissolve_bhukosh_tiles")
def dissolve_bhukosh_tiles_task(tile_paths: list[str], by: str, out_path: str) -> dict:
    import geopandas as gpd
    from pipeline.vector import dissolve_polygons
    tiles = [gpd.read_file(p) for p in tile_paths]
    out = dissolve_polygons(tiles, by=by)
    out.to_file(out_path)
    return {"n_features": len(out), "out_path": out_path}
