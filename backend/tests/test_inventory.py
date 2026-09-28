import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.api.inventory import SpringRecordIn, run_quality_gate, MAX_DISCHARGE_CV

client = TestClient(app)

GOOD = dict(
    village_code="KTG-001",
    location={"lat": 11.4, "lon": 76.95},
    typology="contact_spring",
    discharge_readings=[{"reading_lps": 1.0}, {"reading_lps": 1.05}, {"reading_lps": 0.98}],
    photos={"emergence_point_url": "s3://x/e.jpg", "landscape_context_url": "s3://x/l.jpg"},
)


def test_requires_at_least_three_readings():
    with pytest.raises(Exception):
        SpringRecordIn(**{**GOOD, "discharge_readings": [{"reading_lps": 1.0}, {"reading_lps": 1.1}]})


def test_rejects_bad_lat_lon():
    with pytest.raises(Exception):
        SpringRecordIn(**{**GOOD, "location": {"lat": 999, "lon": 0}})


def test_quality_gate_passes_low_variance_with_photos():
    rec = SpringRecordIn(**GOOD)
    g = run_quality_gate(rec)
    assert g.passed and not g.needs_hydrogeologist_review
    assert g.mean_discharge_lps == pytest.approx((1.0 + 1.05 + 0.98) / 3)


def test_quality_gate_fails_high_variance():
    rec = SpringRecordIn(**{**GOOD, "discharge_readings": [{"reading_lps": 0.2}, {"reading_lps": 3.0}, {"reading_lps": 0.1}]})
    g = run_quality_gate(rec)
    assert not g.passed and g.needs_hydrogeologist_review
    assert any("variable" in r for r in g.reasons)


def test_quality_gate_fails_missing_photos():
    rec = SpringRecordIn(**{**GOOD, "photos": {"emergence_point_url": "s3://x/e.jpg"}})
    g = run_quality_gate(rec)
    assert not g.passed and any("photo" in r for r in g.reasons)


def test_zero_discharge_all_zero_is_not_flagged_as_infinite_cv():
    rec = SpringRecordIn(**{**GOOD, "discharge_readings": [{"reading_lps": 0}, {"reading_lps": 0}, {"reading_lps": 0}]})
    g = run_quality_gate(rec)
    assert g.cv_discharge == 0.0


def test_api_accept_and_reject_routes():
    r_ok = client.post("/api/v1/inventory/springs", json=GOOD)
    assert r_ok.status_code == 200 and r_ok.json()["passed"] is True

    bad = {**GOOD, "discharge_readings": [{"reading_lps": 0.1}, {"reading_lps": 5.0}, {"reading_lps": 0.05}],
          "village_code": "KTG-002"}
    r_bad = client.post("/api/v1/inventory/springs", json=bad)
    assert r_bad.status_code == 200 and r_bad.json()["passed"] is False

    accepted = client.get("/api/v1/inventory/springs/accepted").json()
    review = client.get("/api/v1/inventory/springs/review-queue").json()
    assert any(a["village_code"] == "KTG-001" for a in accepted)
    assert any(r["village_code"] == "KTG-002" for r in review)


def test_health():
    assert client.get("/health").json() == {"status": "ok"}
