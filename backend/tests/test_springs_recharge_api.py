from datetime import datetime, timedelta, timezone

from tests.conftest import requires_pg, fetch, execute

pytestmark = requires_pg


def _insert_spring():
    row = fetch(
        """INSERT INTO springs (village_code, status, geom, dip_deg, strike_deg, lithology)
           VALUES ('ALM-001','active', ST_SetSRID(ST_MakePoint(79.5,29.6),4326), 22.5, 140, 'weathered gneiss')
           RETURNING id""")
    return row[0]["id"]


def test_analytics_404_for_missing_spring(client, clean_tables):
    assert client.get("/api/v1/springs/999999/analytics").status_code == 404


def test_analytics_returns_series_and_geology(client, clean_tables):
    sid = _insert_spring()
    now = datetime.now(timezone.utc)
    for i, v in enumerate([5.0, 4.0, 3.2, 2.5]):
        execute("INSERT INTO discharge_readings (spring_id, reading_lps, recorded_at) VALUES ($1,$2,$3)",
               sid, v, now - timedelta(days=30 * (3 - i)))
    execute("INSERT INTO hydromet_readings (village_code, rainfall_mm, recorded_at) VALUES ($1,$2,$3)",
           "ALM-001", 120.0, now)

    r = client.get(f"/api/v1/springs/{sid}/analytics")
    assert r.status_code == 200
    body = r.json()
    assert len(body["discharge_series"]) == 4
    assert len(body["rainfall_series"]) == 1
    assert body["geology"]["lithology"] == "weathered gneiss"
    assert body["recession"] is not None
    assert body["recession"]["alpha_per_day"] > 0   # genuinely declining series


def test_analytics_recession_none_with_fewer_than_three_readings(client, clean_tables):
    sid = _insert_spring()
    now = datetime.now(timezone.utc)
    execute("INSERT INTO discharge_readings (spring_id, reading_lps, recorded_at) VALUES ($1,$2,$3)", sid, 3.0, now)
    r = client.get(f"/api/v1/springs/{sid}/analytics").json()
    assert r["recession"] is None


def test_recharge_assessment_fallback_and_persist(client, clean_tables):
    sid = _insert_spring()
    r = client.post(f"/api/v1/recharge-assessment/{sid}")
    assert r.status_code == 200
    body = r.json()
    assert body["method"] == "buffer_fallback" and body["area_m2"] > 0

    stored = client.get(f"/api/v1/recharge-assessment/{sid}").json()
    assert len(stored) == 1
    assert stored[0]["geojson"]["type"] == "MultiPolygon"


def test_recharge_assessment_404_for_missing_spring(client, clean_tables):
    assert client.post("/api/v1/recharge-assessment/999999").status_code == 404


def test_recharge_assessment_custom_radius_changes_area(client, clean_tables):
    sid = _insert_spring()
    small = client.post(f"/api/v1/recharge-assessment/{sid}?fallback_radius_m=100").json()
    big = client.post(f"/api/v1/recharge-assessment/{sid}?fallback_radius_m=1000").json()
    assert big["area_m2"] > small["area_m2"]
