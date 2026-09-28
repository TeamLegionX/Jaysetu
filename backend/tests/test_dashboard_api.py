from datetime import datetime, timedelta, timezone

import pytest
from tests.conftest import requires_pg, fetch, execute

pytestmark = requires_pg


def _insert_spring(state="Uttarakhand", state_code="UK", district="Almora", block="Dwarahat",
                   village="ALM-001", dependency=0, days_ago=0):
    row = fetch(
        """INSERT INTO springs (village_code, state, state_code, district, block, status, geom, community_dependency, created_at)
           VALUES ($1,$2,$3,$4,$5,'active', ST_SetSRID(ST_MakePoint(79.5,29.6),4326), $6, now() - ($7 || ' days')::interval)
           RETURNING id""",
        village, state, state_code, district, block, dependency, str(days_ago))
    return row[0]["id"]


def _insert_readings(spring_id, values_and_days_ago):
    now = datetime.now(timezone.utc)
    for v, d in values_and_days_ago:
        execute("INSERT INTO discharge_readings (spring_id, reading_lps, recorded_at) VALUES ($1,$2,$3)",
               spring_id, v, now - timedelta(days=d))


def test_stats_counts_and_villages(client, clean_tables):
    _insert_spring(village="A")
    _insert_spring(village="B")
    _insert_spring(village="A")  # same village -> distinct count stays at 2
    r = client.get("/api/v1/dashboard/stats").json()
    assert r["total_springs"]["value"] == 3
    assert r["villages_covered"]["value"] == 2


def test_declining_spring_detected_via_regr_slope(client, clean_tables):
    sid = _insert_spring()
    _insert_readings(sid, [(5.0, 150), (2.0, 10)])  # sharp decline within the 180-day window
    r = client.get("/api/v1/dashboard/stats").json()
    assert r["declining_springs"]["value"] == 1


def test_stable_spring_not_flagged_declining(client, clean_tables):
    sid = _insert_spring()
    _insert_readings(sid, [(3.0, 150), (3.05, 10)])
    r = client.get("/api/v1/dashboard/stats").json()
    assert r["declining_springs"]["value"] == 0


def test_priority_high_from_dependency_even_without_decline(client, clean_tables):
    sid = _insert_spring(dependency=200)
    _insert_readings(sid, [(3.0, 100), (3.0, 10)])
    r = client.get("/api/v1/dashboard/priority_springs").json()
    assert len(r) >= 1
    # dependency-driven priority: decline_pct ~0 but priority still High
    match = [p for p in r if p["id"].endswith("001")]
    assert match and match[0]["priority"] == "High"


def test_priority_springs_ordered_by_decline_desc(client, clean_tables):
    s1 = _insert_spring(village="A"); _insert_readings(s1, [(10.0, 150), (9.0, 10)])   # 10% decline
    s2 = _insert_spring(village="B"); _insert_readings(s2, [(10.0, 150), (2.0, 10)])   # 80% decline
    r = client.get("/api/v1/dashboard/priority_springs?limit=5").json()
    declines = [p["decline_pct"] for p in r]
    assert declines == sorted(declines, reverse=True)
    assert declines[0] == pytest.approx(80.0, abs=0.5)


def test_readings_outside_180_day_window_ignored(client, clean_tables):
    sid = _insert_spring()
    _insert_readings(sid, [(10.0, 400), (1.0, 350)])  # both older than 180 days
    r = client.get("/api/v1/dashboard/stats").json()
    assert r["declining_springs"]["value"] == 0
