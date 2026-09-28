"""Dashboard analytics APIs: aggregated stats + top priority springs.

Trend/decline detection uses Postgres's built-in `regr_slope` aggregate (linear regression slope of
reading_lps vs time) computed directly in SQL - no per-row Python loop, and it scales with an index
on (spring_id, recorded_at) rather than a materialized view, which keeps the numbers always current.
A materialized view is a reasonable later optimisation once query volume warrants it; the view
definition would wrap the same `spring_trend` CTE used below.
"""
from __future__ import annotations

from fastapi import APIRouter

from db.connection import acquire

router = APIRouter(prefix="/api/v1/dashboard", tags=["dashboard"])

# Decline % = (first reading in window - last reading in window) / first reading in window * 100
# Priority thresholds are a policy choice, kept explicit and named so they're easy to tune.
DECLINE_HIGH_PCT = 20.0
DECLINE_MEDIUM_PCT = 5.0
HIGH_DEPENDENCY_HOUSEHOLDS = 100

TREND_WINDOW_SQL = """
WITH windowed AS (
    SELECT spring_id, reading_lps, recorded_at,
           first_value(reading_lps) OVER w AS first_reading,
           last_value(reading_lps)  OVER w AS last_reading
    FROM discharge_readings
    WHERE recorded_at > now() - interval '180 days'
    WINDOW w AS (PARTITION BY spring_id ORDER BY recorded_at
                 ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)
),
spring_trend AS (
    SELECT spring_id,
           regr_slope(reading_lps, extract(epoch FROM recorded_at)) AS slope_lps_per_sec,
           count(*) AS n_readings,
           max(first_reading) AS first_reading,
           max(last_reading)  AS last_reading,
           CASE WHEN max(first_reading) > 0
                THEN (max(first_reading) - max(last_reading)) / max(first_reading) * 100.0
                ELSE 0 END AS decline_pct
    FROM windowed
    GROUP BY spring_id
    HAVING count(*) >= 2
)
"""


def _priority(decline_pct: float | None, community_dependency: int) -> str:
    d = decline_pct or 0.0
    if d > DECLINE_HIGH_PCT or community_dependency >= HIGH_DEPENDENCY_HOUSEHOLDS:
        return "High"
    if d > DECLINE_MEDIUM_PCT:
        return "Medium"
    return "Low"


def _pct_change(current: int, previous: int) -> float | None:
    if previous == 0:
        return None if current == 0 else 100.0
    return round((current - previous) / previous * 100.0, 1)


@router.get("/stats")
async def dashboard_stats() -> dict:
    async with acquire() as conn:
        total_springs = await conn.fetchval("SELECT count(*) FROM springs")
        total_springs_30d_ago = await conn.fetchval(
            "SELECT count(*) FROM springs WHERE created_at <= now() - interval '30 days'")
        villages_covered = await conn.fetchval("SELECT count(DISTINCT village_code) FROM springs")
        villages_30d_ago = await conn.fetchval(
            "SELECT count(DISTINCT village_code) FROM springs WHERE created_at <= now() - interval '30 days'")

        declining_now = await conn.fetchval(
            TREND_WINDOW_SQL + "SELECT count(*) FROM spring_trend WHERE decline_pct > $1", DECLINE_MEDIUM_PCT)
        declining_30d_ago = await conn.fetchval(
            TREND_WINDOW_SQL.replace("now() - interval '180 days'", "now() - interval '30 days' - interval '180 days'")
            + "SELECT count(*) FROM spring_trend WHERE decline_pct > $1", DECLINE_MEDIUM_PCT)

        priority_rows = await conn.fetch(
            TREND_WINDOW_SQL + """
            SELECT s.id, st.decline_pct, s.community_dependency
            FROM springs s JOIN spring_trend st ON st.spring_id = s.id""")
        priority_now = sum(1 for r in priority_rows if _priority(r["decline_pct"], r["community_dependency"]) == "High")

    return {
        "total_springs": {"value": total_springs, "change_pct_30d": _pct_change(total_springs, total_springs_30d_ago)},
        "declining_springs": {"value": declining_now, "change_pct_30d": _pct_change(declining_now, declining_30d_ago)},
        "priority_springs": {"value": priority_now},
        "villages_covered": {"value": villages_covered, "change_pct_30d": _pct_change(villages_covered, villages_30d_ago)},
    }


@router.get("/priority_springs")
async def priority_springs(limit: int = 5) -> list[dict]:
    async with acquire() as conn:
        rows = await conn.fetch(
            TREND_WINDOW_SQL + """
            SELECT s.id, s.display_code, s.village_code, s.block, s.district, s.state,
                   st.decline_pct, s.community_dependency
            FROM springs s
            JOIN spring_trend st ON st.spring_id = s.id
            ORDER BY st.decline_pct DESC NULLS LAST
            LIMIT $1""", limit)
    out = []
    for r in rows:
        out.append({
            "id": r["display_code"] or f"SPR-{r['id']}",
            "location": f"{r['village_code']}, {r['block'] or r['district'] or r['state'] or ''}".rstrip(", "),
            "priority": _priority(r["decline_pct"], r["community_dependency"]),
            "decline_pct": round(r["decline_pct"], 1) if r["decline_pct"] is not None else None,
        })
    return out
