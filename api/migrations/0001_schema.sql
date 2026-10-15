CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    name            TEXT NOT NULL,
    email           TEXT NOT NULL,
    password_hash   TEXT,
    google_sub      TEXT UNIQUE,
    avatar_url      TEXT,
    role            TEXT NOT NULL DEFAULT 'farmer' CHECK (role IN ('farmer', 'admin', 'superadmin')),
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    locale          TEXT NOT NULL DEFAULT 'es' CHECK (locale IN ('es', 'en', 'qu', 'ay')),
    latitude        DOUBLE PRECISION,
    longitude       DOUBLE PRECISION,
    place_name      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_login_at   TIMESTAMPTZ
);
CREATE UNIQUE INDEX users_email_lower_key ON users (lower(email));

CREATE TABLE crops (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    species         TEXT NOT NULL,
    variety         TEXT,
    area_ha         NUMERIC(10, 2) NOT NULL DEFAULT 1,
    latitude        DOUBLE PRECISION,
    longitude       DOUBLE PRECISION,
    location_name   TEXT,
    sowing_date     DATE,
    harvest_date    DATE,
    status          TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'sown', 'growing', 'harvested', 'inactive')),
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX crops_user_idx ON crops (user_id);

CREATE TABLE devices (
    id              BIGSERIAL PRIMARY KEY,
    esp32_id        TEXT NOT NULL UNIQUE,
    name            TEXT NOT NULL,
    user_id         BIGINT REFERENCES users (id) ON DELETE SET NULL,
    crop_id         BIGINT REFERENCES crops (id) ON DELETE SET NULL,
    status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
    last_seen_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX devices_user_idx ON devices (user_id);

CREATE TABLE readings (
    id              BIGSERIAL PRIMARY KEY,
    device_id       BIGINT NOT NULL REFERENCES devices (id) ON DELETE CASCADE,
    metric          TEXT NOT NULL CHECK (metric IN ('air_temperature', 'air_humidity', 'soil_moisture')),
    value           DOUBLE PRECISION NOT NULL,
    recorded_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX readings_device_metric_time_idx ON readings (device_id, metric, recorded_at DESC);
CREATE INDEX readings_device_time_idx ON readings (device_id, recorded_at DESC);

CREATE TABLE thresholds (
    device_id       BIGINT NOT NULL REFERENCES devices (id) ON DELETE CASCADE,
    metric          TEXT NOT NULL CHECK (metric IN ('air_temperature', 'air_humidity', 'soil_moisture')),
    min_value       DOUBLE PRECISION NOT NULL,
    max_value       DOUBLE PRECISION NOT NULL,
    PRIMARY KEY (device_id, metric),
    CHECK (min_value < max_value)
);

CREATE TABLE alerts (
    id              BIGSERIAL PRIMARY KEY,
    device_id       BIGINT NOT NULL REFERENCES devices (id) ON DELETE CASCADE,
    metric          TEXT NOT NULL,
    kind            TEXT NOT NULL CHECK (kind IN ('low', 'high', 'offline')),
    value           DOUBLE PRECISION,
    threshold       DOUBLE PRECISION,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at     TIMESTAMPTZ
);
CREATE INDEX alerts_device_idx ON alerts (device_id, created_at DESC);
CREATE UNIQUE INDEX alerts_one_open_per_kind ON alerts (device_id, metric, kind) WHERE resolved_at IS NULL;

CREATE TABLE pest_diagnoses (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    crop_id         BIGINT REFERENCES crops (id) ON DELETE SET NULL,
    crop_label      TEXT,
    image_path      TEXT NOT NULL,
    engine          TEXT NOT NULL,
    model           TEXT NOT NULL,
    healthy         BOOLEAN NOT NULL,
    disease         TEXT,
    confidence      DOUBLE PRECISION NOT NULL,
    severity        TEXT NOT NULL,
    result          JSONB NOT NULL,
    plan            JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX pest_diagnoses_user_idx ON pest_diagnoses (user_id, created_at DESC);

CREATE TABLE yield_estimates (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    crop_id         BIGINT REFERENCES crops (id) ON DELETE SET NULL,
    inputs          JSONB NOT NULL,
    yield_t_ha      DOUBLE PRECISION NOT NULL,
    total_t         DOUBLE PRECISION NOT NULL,
    revenue_pen     DOUBLE PRECISION NOT NULL,
    confidence      DOUBLE PRECISION NOT NULL,
    factors         JSONB NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX yield_estimates_user_idx ON yield_estimates (user_id, created_at DESC);

CREATE TABLE products (
    id              BIGSERIAL PRIMARY KEY,
    sku             TEXT UNIQUE,
    name            TEXT NOT NULL,
    category        TEXT NOT NULL CHECK (category IN ('fertilizer', 'seed', 'agrochemical', 'amendment', 'equipment')),
    unit            TEXT NOT NULL,
    price_pen       NUMERIC(12, 2) NOT NULL CHECK (price_pen >= 0),
    supplier        TEXT,
    url             TEXT,
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE advisory_requests (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    crop_id         BIGINT REFERENCES crops (id) ON DELETE SET NULL,
    topic           TEXT NOT NULL,
    priority        TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    description     TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'answered', 'closed')),
    ai_draft        TEXT,
    answer          TEXT,
    answered_by     BIGINT REFERENCES users (id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    answered_at     TIMESTAMPTZ
);
CREATE INDEX advisory_requests_user_idx ON advisory_requests (user_id, created_at DESC);

CREATE TABLE audit_log (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT REFERENCES users (id) ON DELETE SET NULL,
    action          TEXT NOT NULL,
    target          TEXT,
    ip              TEXT,
    user_agent      TEXT,
    meta            JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX audit_log_created_idx ON audit_log (created_at DESC);
CREATE INDEX audit_log_action_idx ON audit_log (action, created_at DESC);

CREATE TABLE settings (
    key             TEXT PRIMARY KEY,
    value           JSONB NOT NULL,
    updated_by      BIGINT REFERENCES users (id) ON DELETE SET NULL,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
