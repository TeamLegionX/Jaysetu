from tests.conftest import requires_pg, fetch

pytestmark = requires_pg


def _insert_spring_at(lon, lat):
    row = fetch(
        """INSERT INTO springs (village_code, status, geom) VALUES ('V', 'active', ST_SetSRID(ST_MakePoint($1,$2),4326))
           RETURNING id""", lon, lat)
    return row[0]["id"]


def test_tile_with_point_returns_bytes_pbf_and_mvt(client, clean_tables):
    _insert_spring_at(76.9558, 11.4064)   # z12 tile (2923, 1917)
    for ext in ("pbf", "mvt"):
        r = client.get(f"/api/v1/tiles/springs/12/2923/1917.{ext}")
        assert r.status_code == 200
        assert len(r.content) > 0
        assert r.headers["content-type"] == "application/x-protobuf"


def test_empty_tile_204(client, clean_tables):
    r = client.get("/api/v1/tiles/springs/12/0/0.pbf")
    assert r.status_code == 204


def test_unknown_layer_404(client, clean_tables):
    assert client.get("/api/v1/tiles/nonsense/1/0/0.pbf").status_code == 404


def test_out_of_range_xy_400(client, clean_tables):
    assert client.get("/api/v1/tiles/springs/2/99/99.pbf").status_code == 400


def test_recharge_zones_and_interventions_layers_reachable(client, clean_tables):
    sid = _insert_spring_at(79.5, 29.6)
    fetch("""INSERT INTO recharge_zones (spring_id, zone_rank, area_m2, geom)
             VALUES ($1, 1, 1000, ST_Multi(ST_SetSRID(ST_Buffer(ST_MakePoint(79.5,29.6)::geography, 300)::geometry, 4326)))""",
         sid)
    for layer in ("recharge_zones", "interventions"):
        r = client.get(f"/api/v1/tiles/{layer}/5/17/12.pbf")
        assert r.status_code in (200, 204)   # both are valid MVT responses; just must not 404/500
