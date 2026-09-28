import numpy as np
import pytest
from hydrology.green_ampt import soil_params
from hydrology.trench import (TrenchGeometry, SlopePolicy, plan_trenches, vertical_interval, drain_time_h)
from hydrology.water_budget import (simulate_bucket, trench_uplift, annual_water_yield_m3, BucketParams)
from hydrology.recession import (fit_maillet, extract_recession_segments, master_recession_alpha,
                                 flag_recharge_impairment)


def test_geometry_defaults_match_brief():
    g = TrenchGeometry()
    assert g.section_m2 == pytest.approx(0.25)
    assert g.volume_m3 == pytest.approx(1.0)


@pytest.mark.parametrize("kw", [dict(length_m=2), dict(length_m=6), dict(depth_m=0.6), dict(berm_gap_m=1.5)])
def test_geometry_rejects_out_of_spec(kw):
    with pytest.raises(ValueError):
        TrenchGeometry(**kw)


def test_slope_gate_bypass():
    plan = plan_trenches(40, 1.0, soil_params("loam"))
    assert plan.action == "vegetative_only" and plan.geometry is None and plan.total_trenches == 0


def test_slope_gate_restricted_caps_depth():
    plan = plan_trenches(20, 1.0, soil_params("loam"))
    assert plan.action == "excavate_restricted" and plan.requires_engineer_review
    assert plan.geometry.depth_m <= 0.30


def test_slope_gate_custom_policy():
    plan = plan_trenches(20, 1.0, soil_params("loam"), policy=SlopePolicy(review_above_pct=25, bypass_above_pct=33))
    assert plan.action == "excavate"


def test_vi_and_spacing_behaviour():
    g = TrenchGeometry()
    # heavier runoff -> rows never further apart
    assert vertical_interval(10, g, 100, 0.5)[0] <= vertical_interval(10, g, 100, 0.2)[0]
    # VI stays inside the practical clamp
    for s in (2, 5, 10, 20, 30):
        vi, _ = vertical_interval(s, g, 100, 0.3)
        assert 0.5 <= vi <= 3.0
    # horizontal spacing never increases as slope steepens
    hds = [vertical_interval(s, g, 100, 0.3)[1] for s in (2, 4, 8, 12, 20, 30)]
    assert all(a >= b - 1e-9 for a, b in zip(hds, hds[1:]))
    # VI never decreases as slope steepens
    vis = [vertical_interval(s, g, 100, 0.3)[0] for s in (2, 4, 8, 12, 20, 30)]
    assert all(a <= b + 1e-9 for a, b in zip(vis, vis[1:]))


def test_drain_time_orders_by_soil():
    g = TrenchGeometry()
    assert drain_time_h(g, soil_params("sandy loam")) < drain_time_h(g, soil_params("clay"))


def test_plan_counts_consistent():
    plan = plan_trenches(8, 1.0, soil_params("sandy loam"))
    assert plan.total_trenches == plan.rows * plan.trenches_per_row > 0
    assert plan.total_excavation_m3 == pytest.approx(plan.total_trenches * plan.geometry.volume_m3)


def test_bucket_closes_mass_balance():
    rng = np.random.default_rng(0)
    rain = rng.gamma(0.3, 12, 365)
    pet = np.full(365, 4.0)
    p = BucketParams()
    o = simulate_bucket(rain, pet, p)
    s0 = p.s0_frac * p.s_max_mm
    assert rain.sum() + s0 - o["runoff"].sum() - o["et"].sum() - o["recharge"].sum() == pytest.approx(o["storage"][-1], abs=1e-6)
    assert (o["storage"] >= -1e-9).all() and (o["storage"] <= p.s_max_mm + 1e-9).all()


def test_bucket_rejects_nan():
    with pytest.raises(ValueError):
        simulate_bucket([1, np.nan], [1, 1])


def test_trench_mass_balance_and_monotone_capacity():
    runoff = np.array([0, 30, 0, 0, 60, 10, 0], dtype=float)
    a = trench_uplift(runoff, 5000, 20.0, 5.0)
    total_in = runoff.sum() / 1000 * 5000
    assert a["captured_m3"].sum() + a["bypass_m3"].sum() == pytest.approx(total_in)
    assert a["annual_increase_m3"] == pytest.approx(a["captured_m3"].sum())
    b = trench_uplift(runoff, 5000, 60.0, 5.0)
    assert b["annual_increase_m3"] >= a["annual_increase_m3"]


def test_annual_yield_formula():
    assert annual_water_yield_m3(1000, 10_000, 0.2, 500, 300) == pytest.approx(1000 / 1000 * 10_000 * 0.2 - 800)


def test_maillet_recovers_alpha():
    t = np.arange(30)
    q = 5.0 * np.exp(-0.05 * t)
    r = fit_maillet(t, q)
    assert r.alpha_per_day == pytest.approx(0.05, rel=1e-6) and r.q0 == pytest.approx(5.0)
    assert r.half_life_days == pytest.approx(np.log(2) / 0.05)


def test_segments_and_master_alpha():
    t = np.arange(40)
    q = np.concatenate([3 * np.exp(-0.04 * np.arange(20)), 6 * np.exp(-0.04 * np.arange(20))])
    assert len(extract_recession_segments(q)) == 2
    assert master_recession_alpha(q).alpha_per_day == pytest.approx(0.04, rel=1e-6)


def test_impairment_detected_only_when_rain_does_not_explain():
    yrs = np.arange(2005, 2020)
    rng = np.random.default_rng(1)
    rain = 1200 + rng.normal(0, 150, len(yrs))
    healthy = 0.002 * rain + rng.normal(0, 0.05, len(yrs))
    impaired = 0.002 * rain - 0.06 * (yrs - yrs[0]) + rng.normal(0, 0.02, len(yrs))
    assert not flag_recharge_impairment(yrs, rain, healthy).impaired
    assert flag_recharge_impairment(yrs, rain, impaired).impaired
    # drought-driven decline (discharge follows rain, no extra trend) must NOT flag
    rain_dec = 1500 - 60 * (yrs - yrs[0])
    drought = 0.002 * rain_dec
    assert not flag_recharge_impairment(yrs, rain_dec, drought + rng.normal(0, 0.005, len(yrs))).impaired


def test_short_record_not_assessed():
    r = flag_recharge_impairment([2020, 2021], [1, 2], [1, 2])
    assert not r.impaired and r.p_value is None
