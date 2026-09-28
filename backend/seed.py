"""Seed the database with realistic dummy data for frontend/heatmap development and testing.

Generates 500-1000 springs spread across several Uttarakhand districts (Pithoragarh, Almora,
Bageshwar, Champawat, Chamoli, Nainital, ...), each with:
  - discharge_readings: ~6-12 monthly readings over the last year, with a randomly-assigned trend
    (declining / stable / improving) so the dashboard's decline/priority logic has real variation
    to show.
  - hydromet_readings: monthly rainfall per village.
  - recharge_zones + interventions for a subset, so the map, Spring Twin and Budget Planner all
    have something to render.

DESTRUCTIVE: truncates springs/discharge_readings/hydromet_readings/recharge_zones/interventions/
review_queue before inserting (dev/test convenience, not for a populated environment). Run with
--no-truncate to append instead.

Usage:
    python3 seed.py [--n-springs 600] [--seed 42] [--no-truncate]
"""
from __future__ import annotations

import argparse
import asyncio
import math
import random
from datetime import datetime, timedelta, timezone

import asyncpg

from db.connection import dsn
from hydrology.recharge_assessment import assess_fallback_buffer

# Approximate district centres (lon, lat) - illustrative, not survey-grade.
DISTRICTS: dict[str, tuple[float, float, list[str]]] = {
    "Pithoragarh":   (80.22, 29.58, ["Munsyari", "Dharchula", "Didihat", "Gangolihat", "Berinag"]),
    "Almora":        (79.66, 29.60, ["Dwarahat", "Someshwar", "Bhikiyasain", "Tarikhet", "Bhaisiyachhana"]),
    "Bageshwar":     (79.77, 29.84, ["Kapkot", "Garur", "Dungri Paini"]),
    "Champawat":     (80.09, 29.33, ["Lohaghat", "Pati", "Barakot"]),
    "Chamoli":       (79.50, 30.40, ["Joshimath", "Ghat", "Dasholi", "Pokhri"]),
    "Nainital":      (79.45, 29.38, ["Bhimtal", "Ramgarh", "Okhalkanda", "Betalghat"]),
    "Tehri Garhwal": (78.48, 30.39, ["Pratapnagar", "Jakhnidhar", "Bhilangana"]),
    "Uttarkashi":    (78.45, 30.73, ["Bhatwari", "Dunda", "Chinyalisaur"]),
}
STATE, STATE_CODE = "Uttarakhand", "UK"
LITHOLOGIES = ["weathered gneiss", "weathered granite", "fractured quartzite", "phyllite", "limestone (karst)"]
TYPOLOGIES = ["contact_spring", "depression_spring", "fracture_spring"]
TREND_KINDS = ["declining_sharp", "declining_mild", "stable", "improving"]
TREND_WEIGHTS = [0.15, 0.25, 0.45, 0.15]


def jittered_point(lon0: float, lat0: float, spread_km: float, rng: random.Random) -> tuple[float, float]:
    r_km = spread_km * math.sqrt(rng.random())
    theta = rng.uniform(0, 2 * math.pi)
    dlat = (r_km * math.cos(theta)) / 111.0
    dlon = (r_km * math.sin(theta)) / (111.0 * math.cos(math.radians(lat0)))
    return lon0 + dlon, lat0 + dlat


def discharge_series(base_lps: float, trend: str, n_months: int, rng: random.Random) -> list[tuple[float, datetime]]:
    now = datetime.now(timezone.utc)
    slope_frac_per_month = {"declining_sharp": -0.10, "declining_mild": -0.03, "stable": 0.0, "improving": 0.04}[trend]
    out = []
    for m in range(n_months, -1, -1):
        t = now - timedelta(days=30 * m)
        expected = base_lps * max((1 + slope_frac_per_month) ** (n_months - m), 0.02)
        noisy = max(expected * rng.uniform(0.85, 1.15), 0.0)
        out.append((round(noisy, 3), t))
    return out


async def seed(n_springs: int, seed: int, truncate: bool) -> None:
    rng = random.Random(seed)
    pool = await asyncpg.create_pool(dsn(), min_size=1, max_size=10)
    async with pool.acquire() as conn:
        if truncate:
            await conn.execute(
                "TRUNCATE interventions, recharge_zones, discharge_readings, hydromet_readings, "
                "review_queue, springs RESTART IDENTITY CASCADE")

        village_codes: dict[str, tuple[str, str]] = {}   # village_code -> (district, block)
        spring_ids: list[int] = []

        async with conn.transaction():
            for i in range(n_springs):
                district = rng.choice(list(DISTRICTS))
                lon0, lat0, blocks = DISTRICTS[district]
                block = rng.choice(blocks)
                village_code = f"{STATE_CODE}-{district[:3].upper()}-{rng.randint(1, 40):03d}"
                village_codes[village_code] = (district, block)
                lon, lat = jittered_point(lon0, lat0, spread_km=18, rng=rng)

                trend = rng.choices(TREND_KINDS, weights=TREND_WEIGHTS, k=1)[0]
                dependency = rng.choice([0, 0, 20, 50, 80, 120, 200, 300])

                row = await conn.fetchrow(
                    """INSERT INTO springs
                        (village_code, state, state_code, district, block, spring_typology, status, geom,
                         dip_deg, strike_deg, lithology, fracture_notes, land_use, nearby_pumps, nearby_streams,
                         community_dependency, photos, created_at)
                       VALUES ($1,$2,$3,$4,$5,$6,'active', ST_SetSRID(ST_MakePoint($7,$8),4326),
                               $9,$10,$11,$12,$13,$14,$15,$16,$17::jsonb,$18)
                       RETURNING id""",
                    village_code, STATE, STATE_CODE, district, block, rng.choice(TYPOLOGIES), lon, lat,
                    round(rng.uniform(5, 45), 1), round(rng.uniform(0, 359), 1), rng.choice(LITHOLOGIES),
                    "field-observed fracture set" if rng.random() < 0.4 else None,
                    rng.choice(["forest", "agriculture", "settlement", "grazing land"]),
                    rng.choice([0, 0, 1, 2]), rng.random() < 0.3, dependency,
                    '{"emergence_point_url": "seed://e.jpg", "landscape_context_url": "seed://l.jpg"}',
                    datetime.now(timezone.utc) - timedelta(days=rng.randint(0, 400)))
                sid = row["id"]
                spring_ids.append(sid)

                base_lps = rng.uniform(0.3, 6.0)
                readings = discharge_series(base_lps, trend, n_months=rng.randint(6, 12), rng=rng)
                await conn.executemany(
                    "INSERT INTO discharge_readings (spring_id, reading_lps, recorded_at) VALUES ($1,$2,$3)",
                    [(sid, v, t) for v, t in readings])

            for village_code, (district, block) in village_codes.items():
                now = datetime.now(timezone.utc)
                season_base = 250 if district in ("Pithoragarh", "Chamoli") else 180
                monthly = []
                for m in range(11, -1, -1):
                    t = now - timedelta(days=30 * m)
                    monsoon = 2.5 if t.month in (6, 7, 8, 9) else 1.0
                    monthly.append((max(rng.gauss(season_base * monsoon, 40), 0), t))
                await conn.executemany(
                    "INSERT INTO hydromet_readings (village_code, rainfall_mm, recorded_at) VALUES ($1,$2,$3)",
                    [(village_code, round(mm, 1), t) for mm, t in monthly])

            sample = rng.sample(spring_ids, k=max(1, int(len(spring_ids) * 0.35)))
            for sid in sample:
                r = await conn.fetchrow("SELECT ST_X(geom) AS lon, ST_Y(geom) AS lat FROM springs WHERE id=$1", sid)
                buf = assess_fallback_buffer(r["lon"], r["lat"], radius_m=rng.uniform(200, 800))
                await conn.execute(
                    """INSERT INTO recharge_zones (spring_id, zone_rank, mean_score, area_m2, reasons, geom)
                       VALUES ($1,1,$2,$3,$4::jsonb, ST_Multi(ST_SetSRID(ST_GeomFromText($5),4326)))""",
                    sid, round(rng.uniform(0.5, 0.95), 2), buf.area_m2,
                    f'{{"method": "{buf.method}", "detail": {buf.detail!r}}}'.replace("'", '"'), buf.geometry.wkt)

            intervention_sample = rng.sample(sample, k=max(1, int(len(sample) * 0.6)))
            structure_types = ["staggered_contour_trench", "recharge_pit", "check_dam", "vegetative_stabilisation"]
            for sid in intervention_sample:
                zone_id = await conn.fetchval("SELECT id FROM recharge_zones WHERE spring_id=$1 LIMIT 1", sid)
                cost = round(rng.uniform(25_000, 180_000), 2)
                recharge_l = round(rng.uniform(50_000, 600_000), 1)
                await conn.execute(
                    """INSERT INTO interventions
                        (zone_id, structure_type, total_cost_inr, annual_recharge_l, cost_per_litre_inr, boq)
                       VALUES ($1,$2,$3,$4,$5,$6::jsonb)""",
                    zone_id, rng.choice(structure_types), cost, recharge_l, round(cost / recharge_l, 4),
                    '{"note": "seed data - illustrative BOQ, not a real MGNREGA schedule costing"}')

    await pool.close()
    print(f"Seeded {len(spring_ids)} springs across {len(village_codes)} villages in {len(DISTRICTS)} districts "
          f"({len(sample)} recharge zones, {len(intervention_sample)} interventions).")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--n-springs", type=int, default=600)
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--no-truncate", action="store_true")
    args = ap.parse_args()
    asyncio.run(seed(args.n_springs, args.seed, truncate=not args.no_truncate))
