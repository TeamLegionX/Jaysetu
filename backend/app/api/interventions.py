"""Interventions budget aggregation for the dashboard's Budget Planner."""
from __future__ import annotations

from fastapi import APIRouter

from db.connection import acquire

router = APIRouter(prefix="/api/v1/interventions", tags=["interventions"])


@router.get("/budget")
async def budget_summary() -> dict:
    async with acquire() as conn:
        totals = await conn.fetchrow(
            """SELECT count(*) AS n_interventions,
                      coalesce(sum(total_cost_inr), 0)    AS total_cost_inr,
                      coalesce(sum(annual_recharge_l), 0) AS total_annual_recharge_l
               FROM interventions""")
        by_type = await conn.fetch(
            """SELECT structure_type,
                      count(*) AS n,
                      coalesce(sum(total_cost_inr), 0)    AS total_cost_inr,
                      coalesce(sum(annual_recharge_l), 0) AS annual_recharge_l
               FROM interventions
               GROUP BY structure_type
               ORDER BY total_cost_inr DESC""")

    total_cost = totals["total_cost_inr"]
    total_recharge = totals["total_annual_recharge_l"]
    return {
        "n_interventions": totals["n_interventions"],
        "total_cost_inr": total_cost,
        "total_annual_recharge_l": total_recharge,
        "cost_per_litre_inr": (total_cost / total_recharge) if total_recharge > 0 else None,
        "by_structure_type": [dict(r) for r in by_type],
    }
