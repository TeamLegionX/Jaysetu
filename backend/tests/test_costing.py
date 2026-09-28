import pytest
from reports.costing import SoRItem, BOQLine, BOQ, cost_per_litre_recharged, trench_boq


def test_sor_item_validates():
    with pytest.raises(ValueError):
        SoRItem("E1", "excavation", "m3", -5)
    with pytest.raises(ValueError):
        SoRItem("E1", "excavation", "m3", 100, labour_material_split=(0.5, 0.6))


def test_boq_line_costs():
    item = SoRItem("E1", "earthwork", "m3", 250.0, labour_material_split=(0.7, 0.3))
    line = BOQLine(item, 40.0)
    assert line.cost_inr == pytest.approx(10_000)
    assert line.labour_cost_inr == pytest.approx(7_000)
    assert line.material_cost_inr == pytest.approx(3_000)


def test_boq_totals_and_contingency():
    e = SoRItem("E1", "earthwork", "m3", 250.0)
    p = SoRItem("P1", "pitching", "m2", 400.0)
    boq = BOQ("Kotagiri", "SCT", [BOQLine(e, 40), BOQLine(p, 10)], contingency_pct=5.0)
    assert boq.base_cost_inr == pytest.approx(10_000 + 4_000)
    assert boq.contingency_inr == pytest.approx(0.05 * 14_000)
    assert boq.total_cost_inr == pytest.approx(14_000 * 1.05)


def test_cost_per_litre_zero_and_positive():
    assert cost_per_litre_recharged(50_000, 0) == float("inf")
    assert cost_per_litre_recharged(50_000, 100_000) == pytest.approx(0.5)
    with pytest.raises(ValueError):
        cost_per_litre_recharged(-1, 100)


def test_trench_boq_builder_and_rows():
    e = SoRItem("E1", "earthwork", "m3", 250.0)
    p = SoRItem("P1", "pitching", "m2", 400.0)
    boq = trench_boq("Kotagiri", 40, e, stone_pitching_m2=5, pitching_rate=p)
    assert len(boq.lines) == 2
    rows = boq.as_rows()
    assert rows[0]["code"] == "E1" and rows[1]["cost_inr"] == pytest.approx(2000)


def test_labour_share():
    e = SoRItem("E1", "earthwork", "m3", 100.0, labour_material_split=(0.6, 0.4))
    boq = BOQ("V", "SCT", [BOQLine(e, 10)])
    assert boq.labour_share_pct == pytest.approx(60.0)
