import math
import pytest
from hydrology.green_ampt import (soil_params, cumulative_infiltration, infiltration_rate,
                                  infiltration_over_event, SoilParams, USDA_SOIL_TABLE)


def test_lookup_and_deficit():
    p = soil_params("Sandy Loam", initial_saturation=0.25)
    assert p.ks_cm_h == 2.59 and p.psi_cm == 11.01
    assert p.d_theta == pytest.approx(0.75 * 0.412)


def test_unknown_texture():
    with pytest.raises(KeyError):
        soil_params("moon dust")


def test_implicit_equation_satisfied():
    p = soil_params("loam", 0.3)
    t = 2.5
    F = cumulative_infiltration(t, p)
    S = p.psi_cm * p.d_theta
    assert F - S * math.log(1 + F / S) == pytest.approx(p.ks_cm_h * t, rel=1e-8)


def test_rate_decays_to_ks():
    p = soil_params("clay loam", 0.3)
    assert infiltration_rate(0.1, p) > infiltration_rate(5, p) > infiltration_rate(500, p)
    assert infiltration_rate(1e6, p) == pytest.approx(p.ks_cm_h, rel=1e-3)


def test_f_star_formula_matches_brief():
    p = SoilParams(ks_cm_h=1.0, psi_cm=10.0, d_theta=0.3)
    assert infiltration_rate(3.0, p) == pytest.approx(1.0 * (1 + 10 * 0.3 / 3.0))


def test_F_monotone_in_time():
    p = soil_params("silt loam")
    assert cumulative_infiltration(1, p) < cumulative_infiltration(2, p) < cumulative_infiltration(10, p)


def test_low_intensity_rain_all_infiltrates():
    p = soil_params("sandy loam")
    r = infiltration_over_event(0.5, 3.0, p)  # 0.5 cm/h << Ks 2.59
    assert r["runoff_cm"] == pytest.approx(0.0, abs=1e-9)
    assert r["time_to_ponding_h"] == float("inf")


def test_high_intensity_on_clay_produces_runoff():
    p = soil_params("clay")
    r = infiltration_over_event(5.0, 2.0, p)
    assert r["runoff_cm"] > 5.0 * 2.0 * 0.8
    assert r["time_to_ponding_h"] < 0.2


def test_all_table_rows_valid():
    for tex in USDA_SOIL_TABLE:
        assert cumulative_infiltration(1.0, soil_params(tex)) > 0
