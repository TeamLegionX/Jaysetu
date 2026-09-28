import math
import random

from seed import discharge_series, jittered_point, DISTRICTS


def test_jittered_point_within_spread_radius():
    rng = random.Random(0)
    lon0, lat0 = 79.66, 29.60
    for _ in range(200):
        lon, lat = jittered_point(lon0, lat0, spread_km=18, rng=rng)
        d_km = math.hypot((lon - lon0) * 111 * math.cos(math.radians(lat0)), (lat - lat0) * 111)
        assert d_km <= 18 + 1e-6


def test_discharge_series_declining_trend_actually_declines():
    rng = random.Random(1)
    series = discharge_series(base_lps=5.0, trend="declining_sharp", n_months=12, rng=rng)
    assert len(series) == 13
    assert series[-1][0] < series[0][0]


def test_discharge_series_improving_trend_increases():
    rng = random.Random(2)
    series = discharge_series(base_lps=1.0, trend="improving", n_months=12, rng=rng)
    assert series[-1][0] > series[0][0]


def test_discharge_series_never_negative():
    rng = random.Random(3)
    series = discharge_series(base_lps=0.5, trend="declining_sharp", n_months=12, rng=rng)
    assert all(v >= 0 for v, _ in series)


def test_districts_table_well_formed():
    for name, (lon, lat, blocks) in DISTRICTS.items():
        assert 77 < lon < 82 and 28 < lat < 32   # roughly within Uttarakhand
        assert len(blocks) >= 2
