"""Spring Twin analytics: GET /api/v1/springs/{id}/analytics"""
from __future__ import annotations

import math

from fastapi import APIRouter, HTTPException

from db.connection import acquire
from hydrology.recession import fit_maillet

router = APIRouter(prefix="/api/v1/springs", tags=["springs"])


@router.get("/{spring_id}/analytics")
async def spring_analytics(spring_id: int) -> dict:
    async with acquire() as conn:
        spring = await conn.fetchrow(
            """SELECT id, display_code, village_code, state, district, block, spring_typology, status,
                      dip_deg, strike_deg, lithology, fracture_notes, ST_Y(geom) AS lat, ST_X(geom) AS lon
               FROM springs WHERE id = $1""", spring_id)
        if spring is None:
            raise HTTPException(404, f"spring {spring_id} not found")

        discharge = await conn.fetch(
            "SELECT reading_lps, recorded_at FROM discharge_readings "
            "WHERE spring_id = $1 ORDER BY recorded_at", spring_id)
        rainfall = await conn.fetch(
            "SELECT rainfall_mm, recorded_at FROM hydromet_readings "
            "WHERE village_code = $1 ORDER BY recorded_at", spring["village_code"])

    discharge_series = [{"date": r["recorded_at"].isoformat(), "reading_lps": r["reading_lps"]} for r in discharge]
    rainfall_series = [{"date": r["recorded_at"].isoformat(), "rainfall_mm": r["rainfall_mm"]} for r in rainfall]

    recession = None
    if len(discharge) >= 3:
        t0 = discharge[0]["recorded_at"]
        t_days = [(r["recorded_at"] - t0).total_seconds() / 86400.0 for r in discharge]
        q = [r["reading_lps"] for r in discharge]
        try:
            fit = fit_maillet(t_days, q)
            recession = {
                "alpha_per_day": fit.alpha_per_day,
                "q0_lps": fit.q0,
                "r2": fit.r2,
                "half_life_days": fit.half_life_days,
                "predicted_dry_in_days": (
                    None if fit.alpha_per_day <= 0 or q[-1] <= 0.05 else
                    max(0.0, math.log(q[-1] / 0.05) / fit.alpha_per_day)
                ),
                "note": "Maillet exponential fit Q(t)=Q0*exp(-alpha*t) over all submitted readings; "
                        "predicted_dry_in_days extrapolates to a 0.05 L/s cutoff and is only meaningful "
                        "once the fit is dominated by a true dry-season recession, not rain-driven noise.",
            }
        except ValueError:
            recession = None

    return {
        "spring": dict(spring),
        "discharge_series": discharge_series,
        "rainfall_series": rainfall_series,
        "recession": recession,
        "geology": {"dip_deg": spring["dip_deg"], "strike_deg": spring["strike_deg"],
                    "lithology": spring["lithology"], "fracture_notes": spring["fracture_notes"]},
    }
