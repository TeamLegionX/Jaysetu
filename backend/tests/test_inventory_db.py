import pytest
from tests.conftest import requires_pg, fetch

pytestmark = requires_pg

GOOD = dict(
    village_code="ALM-014", state="Uttarakhand", state_code="UK", district="Almora", block="Dwarahat",
    location={"lat": 29.6, "lon": 79.5}, typology="fracture_spring",
    discharge_readings=[{"reading_lps": 1.0}, {"reading_lps": 1.05}, {"reading_lps": 0.98}],
    geology={"dip_deg": 30, "strike_deg": 120, "lithology": "weathered gneiss"},
    land_use={"nearby_pumps": 1, "nearby_streams": True, "land_use": "forest"},
    hydromet={"rain_mm_last_event": 12.5},
    photos={"emergence_point_url": "s3://x/e.jpg", "landscape_context_url": "s3://x/l.jpg"},
    community_dependency=150,
)


def test_accepted_record_persists_to_springs_and_discharge_readings(client, clean_tables):
    r = client.post("/api/v1/inventory/springs", json=GOOD)
    assert r.status_code == 200
    body = r.json()
    assert body["passed"] is True and body["spring_id"] is not None
    assert body["display_code"] == "SPR-UK-001"

    rows = fetch("SELECT village_code, state, district, block, dip_deg, lithology FROM springs WHERE id=$1",
                body["spring_id"])
    assert len(rows) == 1
    assert rows[0]["village_code"] == "ALM-014" and rows[0]["lithology"] == "weathered gneiss"

    readings = fetch("SELECT reading_lps FROM discharge_readings WHERE spring_id=$1", body["spring_id"])
    assert len(readings) == 3

    hydromet = fetch("SELECT rainfall_mm FROM hydromet_readings WHERE village_code=$1", "ALM-014")
    assert len(hydromet) == 1 and hydromet[0]["rainfall_mm"] == pytest.approx(12.5)


def test_high_variance_goes_to_review_queue_not_springs(client, clean_tables):
    bad = {**GOOD, "discharge_readings": [{"reading_lps": 0.1}, {"reading_lps": 5.0}, {"reading_lps": 0.05}]}
    r = client.post("/api/v1/inventory/springs", json=bad)
    body = r.json()
    assert body["passed"] is False and body["review_queue_id"] is not None
    assert fetch("SELECT count(*) AS n FROM springs")[0]["n"] == 0
    assert fetch("SELECT count(*) AS n FROM review_queue")[0]["n"] == 1


def test_missing_photos_rejected(client, clean_tables):
    bad = {**GOOD, "photos": {"emergence_point_url": "s3://x/e.jpg"}}
    r = client.post("/api/v1/inventory/springs", json=bad)
    assert r.json()["passed"] is False


def test_fewer_than_three_readings_rejected_at_validation(client, clean_tables):
    bad = {**GOOD, "discharge_readings": [{"reading_lps": 1.0}, {"reading_lps": 1.1}]}
    r = client.post("/api/v1/inventory/springs", json=bad)
    assert r.status_code == 422


def test_display_code_increments_and_is_unique(client, clean_tables):
    ids = []
    for i in range(3):
        r = client.post("/api/v1/inventory/springs", json={**GOOD, "village_code": f"ALM-0{i}"})
        ids.append(r.json()["display_code"])
    assert ids == ["SPR-UK-001", "SPR-UK-002", "SPR-UK-003"]


def test_locations_endpoint_reflects_inserted_records(client, clean_tables):
    client.post("/api/v1/inventory/springs", json=GOOD)
    r = client.get("/api/v1/inventory/locations").json()
    assert r["states"] == ["Uttarakhand"]
    assert {"state": "Uttarakhand", "district": "Almora"} in r["districts"]
    assert {"state": "Uttarakhand", "district": "Almora", "block": "Dwarahat"} in r["blocks"]


def test_review_queue_and_accepted_listing(client, clean_tables):
    client.post("/api/v1/inventory/springs", json=GOOD)
    bad = {**GOOD, "photos": {}}
    client.post("/api/v1/inventory/springs", json=bad)
    accepted = client.get("/api/v1/inventory/springs/accepted").json()
    review = client.get("/api/v1/inventory/springs/review-queue").json()
    assert len(accepted) == 1 and len(review) == 1
    assert review[0]["reasons"]
