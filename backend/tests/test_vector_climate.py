import numpy as np
import pandas as pd
import pytest
import xarray as xr
import geopandas as gpd
from shapely.geometry import box, LineString

from pipeline.climate import (clean_imd, monthly_totals, monthly_climatology, monthly_anomaly_pct, annual_stats)
from pipeline.vector import (split_bbox, bbox_area_km2, dissolve_polygons, dissolve_lines, lineament_density,
                             MAX_TILE_KM2)


# ---- climate
def _da(vals, name="x"):
    t = pd.date_range("2000-01-01", periods=len(vals))
    return xr.DataArray(np.array(vals, dtype=float), dims="time", coords={"time": t}, name=name)


def test_rain_sentinel_cleaned_and_zero_kept():
    out = clean_imd(_da([0.0, 5.0, -999.0, 12.0]), "rain")
    assert np.isnan(out.values[2]) and out.values[0] == 0.0 and out.values[3] == 12.0


def test_temp_sentinel_cleaned():
    out = clean_imd(_da([25.0, 99.9, 31.2]), "tmax")
    assert np.isnan(out.values[1]) and out.values[2] == 31.2


def test_bad_kind():
    with pytest.raises(ValueError):
        clean_imd(_da([1.0]), "wind")


def test_sentinel_would_corrupt_mean_without_cleaning():
    raw = _da([20.0, 21.0, 99.9, 22.0])
    assert raw.mean() > 40 and clean_imd(raw, "tmax").mean() == pytest.approx(21.0)


def test_monthly_totals_masks_incomplete_months():
    t = pd.date_range("2001-01-01", "2001-02-28")
    v = np.ones(len(t))
    v[35] = -999.0  # one missing day in Feb
    da = clean_imd(xr.DataArray(v, dims="time", coords={"time": t}), "rain")
    m = monthly_totals(da)
    assert m.sel(time="2001-01-01").item() == 31 and np.isnan(m.sel(time="2001-02-01").item())


def test_anomaly_pct():
    t = pd.date_range("2000-01-01", "2004-12-31")
    rain = xr.DataArray(np.ones(len(t)), dims="time", coords={"time": t})
    rain = rain.where(~((rain.time.dt.year == 2004) & (rain.time.dt.month == 7)), 2.0)
    m = monthly_totals(rain)
    clim = monthly_climatology(m, 2000, 2003)
    an = monthly_anomaly_pct(m, clim)
    assert an.sel(time="2004-07-01").item() == pytest.approx(100.0)
    assert an.sel(time="2004-06-01").item() == pytest.approx(0.0)


def test_hydrological_year_split():
    t = pd.date_range("2001-01-01", "2002-12-31")
    rain = xr.DataArray(np.ones(len(t)), dims="time", coords={"time": t})
    a = annual_stats(rain)
    # Jan-May 2001 = 151 d (hyear 2000); Jun 2001-May 2002 = 365 d; Jun-Dec 2002 = 214 d
    assert a.sel(hyear=2000).item() == 151
    assert a.sel(hyear=2001).item() == 365
    assert a.sel(hyear=2002).item() == 214


# ---- vector
def test_split_bbox_respects_cap():
    bbox = (74.0, 10.0, 80.0, 16.0)   # ~ 440,000 km2
    tiles = split_bbox(bbox)
    assert len(tiles) > 1 and all(bbox_area_km2(*t) < MAX_TILE_KM2 for t in tiles)
    assert sum(bbox_area_km2(*t) for t in tiles) == pytest.approx(bbox_area_km2(*bbox), rel=1e-3)


def test_small_bbox_single_tile():
    assert len(split_bbox((77, 12, 77.5, 12.5))) == 1


def test_dissolve_removes_tile_seam():
    a = gpd.GeoDataFrame({"lith": ["granite"], "geometry": [box(0, 0, 1, 1)]}, crs=4326)
    b = gpd.GeoDataFrame({"lith": ["granite"], "geometry": [box(1, 0, 2, 1)]}, crs=4326)
    c = gpd.GeoDataFrame({"lith": ["basalt"], "geometry": [box(2, 0, 3, 1)]}, crs=4326)
    out = dissolve_polygons([a, b, c], by="lith")
    assert len(out) == 2
    g = out[out.lith == "granite"].geometry.iloc[0]
    assert g.equals(box(0, 0, 2, 1)) or g.symmetric_difference(box(0, 0, 2, 1)).area < 1e-12


def test_dissolve_lines_rejoins_cut_lineament():
    l1 = gpd.GeoDataFrame({"geometry": [LineString([(0, 0), (1, 1)])]}, crs=32643)
    l2 = gpd.GeoDataFrame({"geometry": [LineString([(1, 1), (2, 2)])]}, crs=32643)
    out = dissolve_lines([l1, l2])
    assert len(out) == 1 and out.geometry.iloc[0].length == pytest.approx(2 * 2 ** 0.5)


def test_lineament_density():
    cells = gpd.GeoDataFrame({"geometry": [box(0, 0, 1000, 1000), box(1000, 0, 2000, 1000)]}, crs=32643)
    lines = gpd.GeoDataFrame({"geometry": [LineString([(0, 500), (1000, 500)])]}, crs=32643)
    d = lineament_density(lines, cells)
    assert d.iloc[0] == pytest.approx(1.0) and d.iloc[1] == 0.0
