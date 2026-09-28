# AI-Based Spring Revival and Recharge Planning — Backend

Backend for Ministry of Tribal Affairs Problem Statement 26240: springshed identification,
recharge-intervention sizing, and costed field plans.

## Layout

```
app/            FastAPI app (main.py) + routers (inventory SOP, MVT tiles)
pipeline/       DEM conditioning (pysheds), TWI, GSI Bhukosh vector dissolve, IMD climate ingestion
models/         AHP weighted overlay, XGBoost spring-potential model (spatial CV + SHAP)
hydrology/      Green-Ampt infiltration, staggered contour trench sizing, bucket water budget,
                spring-discharge recession / impairment analysis
reports/        MGNREGA-SoR costing, cost-per-litre-recharged, BOQ
db/             PostGIS schema + generic ST_AsMVT tile function
workers/        Celery tasks for async ingestion (DEM, Bhukosh, IMD)
tests/          88 tests; one module (test_tiles_integration.py) runs live against PostGIS
```

## Key design decisions (see the brief's constraints)

- **No MODFLOW / 3D flow simulation.** Recharge mapping = XGBoost; infiltration = Green-Ampt;
  water budget = deterministic daily bucket model (`hydrology/water_budget.py`).
- **No random pixel splits for validation.** `models/spring_model.py::spatial_cv` uses
  `GroupKFold` over square geographic blocks, with an optional buffer between train/test points.
  `random_cv` exists only as a diagnostic to show how much a leaky split would have inflated AUC —
  `test_random_cv_is_optimistic_vs_spatial_on_autocorrelated_data` demonstrates this on synthetic
  spatially-autocorrelated data.
- **MVT, not raw GeoJSON, to the frontend.** `GET /tiles/{layer}/{z}/{x}/{y}.mvt`, built on
  `ST_TileEnvelope` / `ST_AsMVTGeom` / `ST_AsMVT`; verified against a live PostGIS instance
  (see `tests/test_tiles_integration.py`).
- **TWI zero-slope patch**, exactly as specified: slopes `<= 0` are replaced with `0.001 rad`
  before `tan(beta)` (`pipeline/terrain.py::compute_twi`).
- **AHP weights**: the brief's six weights (aquifer/geology/soil/drainage/geomorphology/slope)
  sum to 69.82 %, not 100 % — they read like a subset of a longer published list. They're kept
  verbatim in `models/ahp.BRIEF_WEIGHTS_PCT`, renormalised to 1 for use, and gated on CR < 0.10
  (Saaty) before any baseline map is generated — see the docstring in `models/ahp.py`.
- **Hard-rock Green-Ampt parameters are explicit placeholders** (`hydrology.green_ampt.HARD_ROCK_TABLE_PLACEHOLDER`),
  kept separate from the real USDA table so they're never silently mistaken for calibrated values —
  replace with CGWB / GEC-2015 figures for the target district before relying on them.
- **XGBoost score is uncalibrated.** It's documented (`SpringModel.metadata["score_semantics"]`)
  as a *relative* spring-occurrence suitability score, not a probability — the class balance is
  set by the pseudo-absence sampling ratio, not the true prior.

## API surface (Jal Sethu backend)

All new endpoints below are backed by real PostgreSQL/PostGIS transactions — the old in-memory
`_STORE`/`_REVIEW_QUEUE` in `inventory.py` has been replaced with `INSERT`/`SELECT` against
`springs`, `discharge_readings`, `hydromet_readings` and `review_queue`.

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/v1/inventory/springs` | Submit a field record; runs the quality gate, writes to `springs`/`discharge_readings`/`hydromet_readings` on pass, to `review_queue` on fail |
| GET | `/api/v1/inventory/springs/accepted` | List accepted spring records |
| GET | `/api/v1/inventory/springs/review-queue` | List records awaiting hydrogeologist review |
| GET | `/api/v1/inventory/locations` | Distinct State/District/Block, for frontend filter dropdowns |
| GET | `/api/v1/dashboard/stats` | Total springs, declining springs, priority springs, villages covered — each with a 30-day % change |
| GET | `/api/v1/dashboard/priority_springs?limit=5` | Top-N most critical springs (id, location, priority) |
| GET | `/api/v1/tiles/{layer}/{z}/{x}/{y}.pbf` (and `.mvt`) | MVT tiles for `springs`, `recharge_zones`, `interventions` |
| GET | `/api/v1/springs/{id}/analytics` | Discharge time-series, rainfall time-series, Maillet recession alpha / predicted dry-out, geology |
| POST | `/api/v1/recharge-assessment/{spring_id}` | Delineate + persist a springshed polygon into `recharge_zones` |
| GET | `/api/v1/recharge-assessment/{spring_id}` | List stored recharge zones (GeoJSON) for a spring |
| GET | `/api/v1/interventions/budget` | Aggregate cost / recharge, overall and by structure type |

### Dashboard trend logic

`dashboard.py` computes decline/trend with Postgres's built-in `regr_slope` aggregate over
`discharge_readings` in the last 180 days — no per-row Python loop and no separate materialized
view to keep in sync. Priority is `High` if decline > 20% **or** `community_dependency >= 100`
households, `Medium` if decline > 5%, else `Low` (see `DECLINE_HIGH_PCT` / `DECLINE_MEDIUM_PCT` /
`HIGH_DEPENDENCY_HOUSEHOLDS` in `app/api/dashboard.py` to retune). 30-day trend % compares the
current count against the same query restricted to rows that existed 30 days ago.

### Recharge assessment: DEM vs fallback

`hydrology/recharge_assessment.py` prefers a real DEM-derived catchment (reusing
`pipeline.terrain.catchment_of`, D8/D∞) when a conditioned, projected GeoTIFF is available at
`${DEM_DIR}/<STATE_CODE>.tif` (env var `DEM_DIR`, default `data/dem/`) or passed explicitly as
`?dem_path=`. **No CartoDEM tiles are bundled** (NRSC Bhuvan requires an authorised login), so out
of the box every zone falls back to a geodesic circular buffer — every such zone is tagged
`"method": "buffer_fallback"` in `recharge_zones.reasons` so it's never mistaken for a modelled
catchment. Drop a real conditioned DEM at that path to switch a state over to real delineation with
no code changes.

### Seed data

```bash
python3 seed.py --n-springs 600 --seed 42     # truncates + reseeds; --no-truncate to append
```

Generates springs spread across 8 Uttarakhand districts (Pithoragarh, Almora, Bageshwar,
Champawat, Chamoli, Nainital, Tehri Garhwal, Uttarkashi), each with a randomly-assigned discharge
trend (declining sharp/mild, stable, improving) over 6–12 months so the dashboard's decline/priority
logic and the map's heatmap have real variation, plus per-village monthly rainfall, and
recharge-zone + intervention rows for ~35%/~20% of springs respectively so the Budget Planner has
data too.

**Caveat:** the test suite's `clean_tables` fixture truncates these tables between tests — re-run
`seed.py` after `pytest` if you want the demo data back.

## Running

```bash
docker compose up --build         # api on :8000, worker, postgis, redis
# or locally:
pip install -r requirements.txt --break-system-packages
psql ... -f db/schema.sql
uvicorn app.main:app --reload
```

## Tests

```bash
pytest -q          # 107 tests. DB-backed suites (test_*_db.py, test_*_api.py) need a reachable
                    # PostGIS (DATABASE_URL / PG* env vars) and skip cleanly if none is found.
                    # They TRUNCATE the app tables between tests — reseed afterwards if you need
                    # the demo data back.
```

## Not yet built / next slices

1. ✅ Repo + PostGIS schema + docker-compose
2. ✅ CartoDEM + pysheds pipeline with the TWI zero-slope patch
3. ✅ PostGIS MVT endpoint generator
4. ✅ Green-Ampt module + USDA soil lookup table
5. ✅ Database integration (asyncpg, real transactions, quality-gate → review_queue)
6. ✅ Dashboard analytics (`/stats`, `/priority_springs`)
7. ✅ MVT tile routes wired to `mvt_tile()` for all three layers + location-filter dropdowns
8. ✅ Spring Twin analytics (discharge/rainfall series, recession alpha, geology)
9. ✅ Recharge assessment endpoint (DEM-based with a documented buffer fallback)
10. ✅ Interventions budget aggregation
11. ✅ Seed script (600 records across 8 Uttarakhand districts)
12. Still open: wiring `pipeline/*`/`models/*` (AHP + XGBoost spring-potential scoring) into the
    recharge-assessment flow so `recharge_zones.mean_score`/`reasons` come from the model instead
    of being left null for buffer-fallback zones; a `/reports` xlsx BOQ export route (the costing
    math is done and tested in `reports/costing.py`); real CartoDEM/GSI/IMD ingestion needs
    authorised NRSC Bhuvan / IMD Pune credentials this environment doesn't have.
