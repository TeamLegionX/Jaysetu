"""Field Inventory & Validation Service - the 6-step Springshed Management SOP.

Quality gate: a record only merges into `springs` / `discharge_readings` once discharge readings
pass a variance check and both required geotagged photos are present; otherwise the raw payload is
queued in `review_queue` for hydrogeologist review. All writes are single-transaction.
"""
from __future__ import annotations

import json
import statistics
from datetime import datetime, timezone
from enum import Enum

from fastapi import APIRouter
from pydantic import BaseModel, Field, field_validator

from db.connection import acquire

router = APIRouter(prefix="/api/v1/inventory", tags=["inventory"])


class SpringTypology(str, Enum):
    CONTACT = "contact_spring"
    DEPRESSION = "depression_spring"
    FRACTURE = "fracture_spring"
    UNKNOWN = "unknown"


class GeoPoint(BaseModel):
    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)


class DischargeReading(BaseModel):
    reading_lps: float = Field(ge=0)
    recorded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class GeologicalObservation(BaseModel):
    dip_deg: float | None = Field(default=None, ge=0, le=90)
    strike_deg: float | None = Field(default=None, ge=0, lt=360)
    lithology: str | None = None
    fracture_notes: str | None = None


class LandUseContext(BaseModel):
    nearby_pumps: int = Field(default=0, ge=0)
    nearby_streams: bool = False
    land_use: str | None = None


class HydroMetTracking(BaseModel):
    last_rain_days_ago: int | None = Field(default=None, ge=0)
    rain_mm_last_event: float | None = Field(default=None, ge=0)


class Photos(BaseModel):
    emergence_point_url: str | None = None
    landscape_context_url: str | None = None

    @property
    def complete(self) -> bool:
        return bool(self.emergence_point_url and self.landscape_context_url)


class SpringRecordIn(BaseModel):
    village_code: str
    state: str | None = None
    state_code: str | None = Field(default=None, min_length=2, max_length=2)
    district: str | None = None
    block: str | None = None
    location: GeoPoint
    typology: SpringTypology = SpringTypology.UNKNOWN
    discharge_readings: list[DischargeReading]
    geology: GeologicalObservation = GeologicalObservation()
    land_use: LandUseContext = LandUseContext()
    hydromet: HydroMetTracking = HydroMetTracking()
    photos: Photos = Photos()
    community_dependency: int = Field(default=0, ge=0)

    @field_validator("discharge_readings")
    @classmethod
    def _min_three(cls, v: list[DischargeReading]) -> list[DischargeReading]:
        if len(v) < 3:
            raise ValueError("at least 3 bucket-and-stopwatch discharge readings are required")
        return v


class QualityGateResult(BaseModel):
    passed: bool
    mean_discharge_lps: float
    cv_discharge: float          # coefficient of variation
    reasons: list[str]
    needs_hydrogeologist_review: bool
    spring_id: int | None = None
    display_code: str | None = None
    review_queue_id: int | None = None


MAX_DISCHARGE_CV = 0.35   # variance threshold; readings that scatter more than this need review


def run_quality_gate(record: SpringRecordIn, max_cv: float = MAX_DISCHARGE_CV) -> tuple[float, float, list[str]]:
    vals = [r.reading_lps for r in record.discharge_readings]
    mean = statistics.fmean(vals)
    cv = (statistics.pstdev(vals) / mean) if mean > 0 else (0.0 if all(v == 0 for v in vals) else float("inf"))
    reasons = []
    if cv > max_cv:
        reasons.append(f"discharge readings too variable (CV={cv:.2f} > {max_cv})")
    if not record.photos.complete:
        reasons.append("missing required geotagged photo(s) (emergence point and/or landscape context)")
    return mean, cv, reasons


@router.post("/springs", response_model=QualityGateResult)
async def submit_spring_record(record: SpringRecordIn) -> QualityGateResult:
    mean, cv, reasons = run_quality_gate(record)
    passed = not reasons

    async with acquire() as conn:
        async with conn.transaction():
            if not passed:
                rq_id = await conn.fetchval(
                    "INSERT INTO review_queue (payload, reasons) VALUES ($1::jsonb, $2::jsonb) RETURNING id",
                    record.model_dump_json(), json.dumps(reasons))
                return QualityGateResult(passed=False, mean_discharge_lps=mean, cv_discharge=cv, reasons=reasons,
                                         needs_hydrogeologist_review=True, review_queue_id=rq_id)

            row = await conn.fetchrow(
                """INSERT INTO springs
                    (village_code, state, state_code, district, block, spring_typology, status, geom,
                     dip_deg, strike_deg, lithology, fracture_notes, land_use, nearby_pumps, nearby_streams,
                     community_dependency, photos)
                   VALUES ($1,$2,$3,$4,$5,$6,'active',
                           ST_SetSRID(ST_MakePoint($7,$8), 4326),
                           $9,$10,$11,$12,$13,$14,$15,$16,$17::jsonb)
                   RETURNING id, display_code""",
                record.village_code, record.state, record.state_code, record.district, record.block,
                record.typology.value, record.location.lon, record.location.lat,
                record.geology.dip_deg, record.geology.strike_deg, record.geology.lithology,
                record.geology.fracture_notes, record.land_use.land_use, record.land_use.nearby_pumps,
                record.land_use.nearby_streams, record.community_dependency,
                record.photos.model_dump_json())
            spring_id, display_code = row["id"], row["display_code"]

            await conn.executemany(
                "INSERT INTO discharge_readings (spring_id, reading_lps, recorded_at) VALUES ($1,$2,$3)",
                [(spring_id, r.reading_lps, r.recorded_at) for r in record.discharge_readings])

            if record.hydromet.rain_mm_last_event is not None:
                await conn.execute(
                    "INSERT INTO hydromet_readings (village_code, rainfall_mm, recorded_at) VALUES ($1,$2,$3)",
                    record.village_code, record.hydromet.rain_mm_last_event, datetime.now(timezone.utc))

    return QualityGateResult(passed=True, mean_discharge_lps=mean, cv_discharge=cv, reasons=reasons,
                             needs_hydrogeologist_review=False, spring_id=spring_id, display_code=display_code)


@router.get("/springs/review-queue")
async def list_review_queue(limit: int = 50) -> list[dict]:
    async with acquire() as conn:
        rows = await conn.fetch(
            "SELECT id, payload, reasons, created_at, resolved FROM review_queue "
            "WHERE NOT resolved ORDER BY created_at DESC LIMIT $1", limit)
    return [dict(r) | {"payload": json.loads(r["payload"]), "reasons": json.loads(r["reasons"])} for r in rows]


@router.get("/springs/accepted")
async def list_accepted(limit: int = 100) -> list[dict]:
    async with acquire() as conn:
        rows = await conn.fetch(
            """SELECT id, display_code, village_code, state, district, block, spring_typology, status,
                      ST_Y(geom) AS lat, ST_X(geom) AS lon, created_at
               FROM springs ORDER BY created_at DESC LIMIT $1""", limit)
    return [dict(r) for r in rows]


@router.get("/locations")
async def list_locations() -> dict:
    """Distinct States / Districts / Blocks present in the database, for frontend filter dropdowns."""
    async with acquire() as conn:
        states = await conn.fetch("SELECT DISTINCT state FROM springs WHERE state IS NOT NULL ORDER BY state")
        districts = await conn.fetch(
            "SELECT DISTINCT state, district FROM springs WHERE district IS NOT NULL ORDER BY state, district")
        blocks = await conn.fetch(
            "SELECT DISTINCT state, district, block FROM springs WHERE block IS NOT NULL "
            "ORDER BY state, district, block")
    return {
        "states": [r["state"] for r in states],
        "districts": [{"state": r["state"], "district": r["district"]} for r in districts],
        "blocks": [{"state": r["state"], "district": r["district"], "block": r["block"]} for r in blocks],
    }
