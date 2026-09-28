import numpy as np
import pytest
import rasterio
from rasterio.transform import from_origin
from pipeline.terrain import (compute_twi, slope_radians, process_dem, to_projected, MIN_SLOPE_RAD,
                              write_raster, catchment_of)


def test_twi_zero_slope_patched_finite():
    acc = np.array([[10.0, 10.0]])
    slope = np.array([[0.0, -0.5]])   # zero and negative -> patched
    twi = compute_twi(acc, slope, 30.0)
    expected = np.log(10 * 30 / np.tan(MIN_SLOPE_RAD))
    assert np.isfinite(twi).all() and np.allclose(twi, expected)


def test_twi_unpatched_would_be_infinite():
    with np.errstate(divide="ignore"):
        assert not np.isfinite(np.log(300 / np.tan(0.0)))


def test_twi_formula_regular_cell():
    twi = compute_twi(np.array([[4.0]]), np.array([[0.1]]), 30.0)
    assert twi[0, 0] == pytest.approx(np.log(4 * 30 / np.tan(0.1)))


def test_twi_higher_where_flatter_and_more_area():
    a = compute_twi(np.array([[5.0]]), np.array([[0.3]]), 30)
    b = compute_twi(np.array([[5.0]]), np.array([[0.05]]), 30)
    c = compute_twi(np.array([[50.0]]), np.array([[0.3]]), 30)
    assert b > a and c > a


def test_twi_nan_propagates():
    assert np.isnan(compute_twi(np.array([[1.0]]), np.array([[np.nan]]), 30)).all()


def test_slope_of_plane():
    y, x = np.mgrid[0:20, 0:20]
    dem = 0.5 * x * 30.0   # rise 15 m per 30 m -> 0.5
    s = slope_radians(dem.astype(float), 30.0)
    assert np.allclose(s, np.arctan(0.5))


@pytest.fixture()
def valley_dem(tmp_path):
    """V-shaped valley draining south, with a deliberate pit and a flat patch."""
    n = 80
    y, x = np.mgrid[0:n, 0:n].astype("float32")
    dem = 1000 - 2.0 * y + 3.0 * np.abs(x - n / 2)
    dem[30:33, 20:23] -= 20      # pit
    dem[60:66, 5:12] = dem[60, 5]  # flat
    p = tmp_path / "dem.tif"
    with rasterio.open(p, "w", driver="GTiff", height=n, width=n, count=1, dtype="float32",
                       crs="EPSG:32643", transform=from_origin(500000, 1500000, 30, 30), nodata=-9999) as d:
        d.write(dem, 1)
    return p


@pytest.mark.parametrize("routing", ["d8", "dinf"])
def test_process_dem_end_to_end(valley_dem, routing):
    t = process_dem(valley_dem, routing=routing)
    assert t.twi.shape == (80, 80) and np.isfinite(t.twi).sum() > 0.95 * t.twi.size
    assert t.flowacc.max() > 500                          # a channel collects a large area
    ch = t.flowacc[:, 40].max()
    assert ch > 10 * np.median(t.flowacc)
    # channel cells (high accumulation) must have higher TWI than steep ridge cells
    assert np.nanmean(t.twi[60:75, 38:42]) > np.nanmean(t.twi[10:20, 2:6])


def test_geographic_dem_is_reprojected(tmp_path):
    src = tmp_path / "geo.tif"
    n = 60
    dem = np.random.default_rng(0).normal(500, 1, (n, n)).astype("float32")
    with rasterio.open(src, "w", driver="GTiff", height=n, width=n, count=1, dtype="float32", crs="EPSG:4326",
                       transform=from_origin(77.0, 13.0, 1 / 3600, 1 / 3600), nodata=-9999) as d:
        d.write(dem, 1)
    with pytest.raises(ValueError):
        process_dem(src)
    out = to_projected(src, tmp_path / "utm.tif")
    with rasterio.open(out) as r:
        assert r.crs.to_epsg() == 32643 and abs(r.transform.a - 30) < 1e-6


def test_catchment_contains_upstream(valley_dem):
    m = catchment_of(valley_dem, 500000 + 40 * 30, 1500000 - 78 * 30)
    assert m.sum() > 1000 and m[0:10, 40].any()
