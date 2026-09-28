-- Core schema for the AI-Based Spring Revival and Recharge Planning System.
-- All geometry in EPSG:4326 (stored) ; MVT tiles are reprojected to EPSG:3857 on the fly.

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS springs (
    id              BIGSERIAL PRIMARY KEY,
    village_code    TEXT NOT NULL,
    spring_typology TEXT,
    status          TEXT NOT NULL DEFAULT 'active',      -- active | seasonal | dry | unverified
    geom            geometry(Point, 4326) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS springs_gix ON springs USING GIST (geom);

CREATE TABLE IF NOT EXISTS discharge_readings (
    id          BIGSERIAL PRIMARY KEY,
    spring_id   BIGINT NOT NULL REFERENCES springs(id) ON DELETE CASCADE,
    reading_lps DOUBLE PRECISION NOT NULL CHECK (reading_lps >= 0),
    method      TEXT NOT NULL DEFAULT 'bucket_stopwatch',
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS discharge_spring_idx ON discharge_readings (spring_id, recorded_at);

CREATE TABLE IF NOT EXISTS recharge_zones (
    id              BIGSERIAL PRIMARY KEY,
    spring_id       BIGINT REFERENCES springs(id) ON DELETE SET NULL,
    zone_rank       INT,
    mean_score      DOUBLE PRECISION,
    area_m2         DOUBLE PRECISION,
    reasons         JSONB,
    geom            geometry(MultiPolygon, 4326) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS zones_gix ON recharge_zones USING GIST (geom);

CREATE TABLE IF NOT EXISTS interventions (
    id                  BIGSERIAL PRIMARY KEY,
    zone_id             BIGINT REFERENCES recharge_zones(id) ON DELETE SET NULL,
    structure_type      TEXT NOT NULL,                -- staggered_contour_trench | vegetative | ...
    total_cost_inr      DOUBLE PRECISION,
    annual_recharge_l   DOUBLE PRECISION,
    cost_per_litre_inr  DOUBLE PRECISION,
    boq                 JSONB,
    geom                geometry(MultiPolygon, 4326),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS interventions_gix ON interventions USING GIST (geom);

-- Generic MVT tile function: parameterised by table + a WHERE fragment, so one function serves
-- springs / recharge_zones / interventions without duplicating the ST_AsMVT boilerplate.
CREATE OR REPLACE FUNCTION mvt_tile(
    tbl        REGCLASS,
    z          INT,
    x          INT,
    y          INT,
    geom_col   TEXT DEFAULT 'geom',
    attr_cols  TEXT DEFAULT '*',
    layer_name TEXT DEFAULT NULL
) RETURNS BYTEA AS $$
DECLARE
    tile   BYTEA;
    layer  TEXT := COALESCE(layer_name, tbl::text);
BEGIN
    EXECUTE format(
        'SELECT ST_AsMVT(q, %L, 4096, %L) FROM (
            SELECT %s, ST_AsMVTGeom(ST_Transform(%I, 3857), ST_TileEnvelope(%s, %s, %s), 4096, 64, true) AS %I
            FROM %s
            WHERE %I && ST_Transform(ST_TileEnvelope(%s, %s, %s), 4326)
        ) q WHERE %I IS NOT NULL',
        layer, geom_col, attr_cols, geom_col, z, x, y, geom_col, tbl, geom_col, z, x, y, geom_col
    ) INTO tile;
    RETURN tile;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- Additions for Jal Sethu dashboard / analytics / filter requirements.
-- ============================================================================

ALTER TABLE springs
    ADD COLUMN IF NOT EXISTS state             TEXT,
    ADD COLUMN IF NOT EXISTS state_code        CHAR(2),
    ADD COLUMN IF NOT EXISTS district          TEXT,
    ADD COLUMN IF NOT EXISTS block             TEXT,
    ADD COLUMN IF NOT EXISTS dip_deg           DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS strike_deg        DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS lithology         TEXT,
    ADD COLUMN IF NOT EXISTS fracture_notes    TEXT,
    ADD COLUMN IF NOT EXISTS land_use          TEXT,
    ADD COLUMN IF NOT EXISTS nearby_pumps      INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS nearby_streams    BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS community_dependency INT DEFAULT 0,  -- households relying on this spring
    ADD COLUMN IF NOT EXISTS photos             JSONB,
    ADD COLUMN IF NOT EXISTS display_code      TEXT;

CREATE INDEX IF NOT EXISTS springs_state_idx    ON springs (state);
CREATE INDEX IF NOT EXISTS springs_district_idx ON springs (district);
CREATE INDEX IF NOT EXISTS springs_block_idx    ON springs (block);
CREATE UNIQUE INDEX IF NOT EXISTS springs_display_code_uq ON springs (display_code) WHERE display_code IS NOT NULL;

-- Auto-generate a human-readable display code (SPR-<STATE_CODE>-<id>) on insert, unless supplied.
CREATE OR REPLACE FUNCTION set_spring_display_code() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.display_code IS NULL THEN
        NEW.display_code := 'SPR-' || COALESCE(NEW.state_code, 'XX') || '-' || lpad(NEW.id::text, 3, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_spring_display_code ON springs;
CREATE TRIGGER trg_spring_display_code
    BEFORE INSERT ON springs
    FOR EACH ROW EXECUTE FUNCTION set_spring_display_code();

-- Rainfall / hydro-met tracking, per village, time series (correlated against discharge on the Spring Twin page).
CREATE TABLE IF NOT EXISTS hydromet_readings (
    id           BIGSERIAL PRIMARY KEY,
    village_code TEXT NOT NULL,
    rainfall_mm  DOUBLE PRECISION CHECK (rainfall_mm >= 0),
    recorded_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS hydromet_village_idx ON hydromet_readings (village_code, recorded_at);

-- Field-review queue for records that fail the inventory quality gate (replaces the in-memory _REVIEW_QUEUE).
CREATE TABLE IF NOT EXISTS review_queue (
    id           BIGSERIAL PRIMARY KEY,
    payload      JSONB NOT NULL,
    reasons      JSONB NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved     BOOLEAN NOT NULL DEFAULT FALSE
);
