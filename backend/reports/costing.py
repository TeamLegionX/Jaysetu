"""MGNREGA Schedule-of-Rates costing and the cost-per-litre-recharged metric.

MGNREGA Master SoRs are set per state (and revised periodically) by the respective state Rural
Development Department; there is no single national CSV. Rates must be supplied by the caller
(loaded from the relevant state's current SoR) - nothing here hardcodes a rate.
"""
from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class SoRItem:
    """One Schedule-of-Rate line item. unit_cost is per `unit` (e.g. INR per m3 of earthwork)."""
    code: str
    description: str
    unit: str
    unit_cost_inr: float
    labour_material_split: tuple[float, float] = (0.6, 0.4)  # MGNREGA wage:material norm; state-specific

    def __post_init__(self):
        if self.unit_cost_inr < 0:
            raise ValueError("unit_cost_inr must be >= 0")
        if abs(sum(self.labour_material_split) - 1.0) > 1e-6:
            raise ValueError("labour_material_split must sum to 1")


@dataclass
class BOQLine:
    item: SoRItem
    quantity: float
    note: str = ""

    @property
    def cost_inr(self) -> float:
        return self.item.unit_cost_inr * self.quantity

    @property
    def labour_cost_inr(self) -> float:
        return self.cost_inr * self.item.labour_material_split[0]

    @property
    def material_cost_inr(self) -> float:
        return self.cost_inr * self.item.labour_material_split[1]


@dataclass
class BOQ:
    village: str
    structure_type: str
    lines: list[BOQLine] = field(default_factory=list)
    contingency_pct: float = 5.0   # typical MGNREGA works contingency; state SoR may differ

    @property
    def base_cost_inr(self) -> float:
        return sum(l.cost_inr for l in self.lines)

    @property
    def contingency_inr(self) -> float:
        return self.base_cost_inr * self.contingency_pct / 100.0

    @property
    def total_cost_inr(self) -> float:
        return self.base_cost_inr + self.contingency_inr

    @property
    def labour_share_pct(self) -> float:
        lab = sum(l.labour_cost_inr for l in self.lines)
        return 100.0 * lab / self.base_cost_inr if self.base_cost_inr else 0.0

    def as_rows(self) -> list[dict]:
        return [{"code": l.item.code, "description": l.item.description, "unit": l.item.unit,
                 "quantity": l.quantity, "unit_cost_inr": l.item.unit_cost_inr, "cost_inr": l.cost_inr,
                 "note": l.note} for l in self.lines]


def cost_per_litre_recharged(total_cost_inr: float, annual_recharge_increase_litres: float) -> float:
    """INR per litre/year of projected additional recharge. inf if the intervention adds no recharge
    (never divide silently by zero)."""
    if total_cost_inr < 0:
        raise ValueError("total_cost_inr must be >= 0")
    if annual_recharge_increase_litres <= 0:
        return float("inf")
    return total_cost_inr / annual_recharge_increase_litres


def trench_boq(village: str, excavation_m3: float, excavation_rate: SoRItem,
              stone_pitching_m2: float | None = None, pitching_rate: SoRItem | None = None,
              site_clearance_m2: float | None = None, clearance_rate: SoRItem | None = None) -> BOQ:
    lines = [BOQLine(excavation_rate, excavation_m3, "earthwork excavation, staggered contour trenches")]
    if stone_pitching_m2 and pitching_rate:
        lines.append(BOQLine(pitching_rate, stone_pitching_m2, "outlet/toe stone pitching"))
    if site_clearance_m2 and clearance_rate:
        lines.append(BOQLine(clearance_rate, site_clearance_m2, "site clearance and dressing"))
    return BOQ(village, "staggered_contour_trench", lines)
