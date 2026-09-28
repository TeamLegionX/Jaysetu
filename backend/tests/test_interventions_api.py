from tests.conftest import requires_pg, fetch
import pytest

pytestmark = requires_pg


def test_budget_empty(client, clean_tables):
    r = client.get("/api/v1/interventions/budget").json()
    assert r["n_interventions"] == 0 and r["total_cost_inr"] == 0 and r["cost_per_litre_inr"] is None


def test_budget_aggregates_by_structure_type(client, clean_tables):
    fetch("INSERT INTO interventions (structure_type, total_cost_inr, annual_recharge_l) VALUES "
         "('staggered_contour_trench', 50000, 100000), ('staggered_contour_trench', 30000, 60000), "
         "('check_dam', 200000, 500000)")
    r = client.get("/api/v1/interventions/budget").json()
    assert r["n_interventions"] == 3
    assert r["total_cost_inr"] == 280000
    assert r["total_annual_recharge_l"] == 660000
    assert r["cost_per_litre_inr"] == pytest.approx(280000 / 660000, rel=1e-6)
    by_type = {row["structure_type"]: row for row in r["by_structure_type"]}
    assert by_type["staggered_contour_trench"]["n"] == 2
    assert by_type["staggered_contour_trench"]["total_cost_inr"] == 80000
    assert by_type["check_dam"]["total_cost_inr"] == 200000
