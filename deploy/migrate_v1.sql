-- AgroYachay: one-off copy of AgroYachay v1 data (database as_terrasense) into the AgroYachay database.
--
-- Prerequisites
--   1. The AgroYachay API has started at least once against the target database, so the SQLx
--      migrations in api/migrations have created the schema.
--   2. Both databases live on the same PostgreSQL server, or the v1 server is reachable
--      through the libpq connection string passed as v1_conn.
--   3. The role running this script may create the dblink extension (or it already exists).
--
-- Usage (run once; the script is transactional and safe to re-run, already copied rows are skipped)
--   psql -h 127.0.0.1 -U postgres -d agroyachay -v ON_ERROR_STOP=1 -f deploy/migrate_v1.sql
--   psql -d agroyachay -v v1_conn="'host=127.0.0.1 dbname=as_terrasense user=postgres password=...'" -f deploy/migrate_v1.sql
--
-- Mapping
--   usuarios          -> users     (matched by lower(email); bcrypt hashes are reused as is;
--                                   rol usuario/agricultor -> farmer, admin -> admin, superadmin -> superadmin)
--   cultivos          -> crops     (tipo_cultivo -> species code, estado -> status)
--   sensores          -> devices   (matched by esp32_id; owner taken from the linked crop;
--                                   activo -> active, pendiente -> pending, others -> inactive)
--   lecturas_sensores -> readings  (tipo_lectura temperatura/temperatura_aire -> air_temperature,
--                                   humedad_aire -> air_humidity, humedad_suelo -> soil_moisture;
--                                   other kinds and implausible values are skipped)
--   v1 stored local time without zone (America/Lima); it is converted to timestamptz.

\if :{?v1_conn}
\else
\set v1_conn 'dbname=as_terrasense'
\endif

BEGIN;

CREATE EXTENSION IF NOT EXISTS dblink;

CREATE TEMP TABLE v1_users ON COMMIT DROP AS
SELECT *
FROM dblink(:'v1_conn', $$
    SELECT id, nombre, email, password_hash, rol, activo, google_id, google_avatar,
           fecha_registro, ultimo_acceso
    FROM usuarios
$$) AS t(id integer, nombre text, email text, password_hash text, rol text, activo boolean,
         google_id text, google_avatar text, fecha_registro timestamp, ultimo_acceso timestamp);

INSERT INTO users (name, email, password_hash, google_sub, avatar_url, role, active, locale,
                   created_at, last_login_at)
SELECT DISTINCT ON (lower(v.email))
       v.nombre,
       lower(trim(v.email)),
       CASE WHEN v.password_hash LIKE '$2%' THEN v.password_hash END,
       NULLIF(trim(v.google_id), ''),
       CASE WHEN v.google_avatar LIKE 'http%' THEN v.google_avatar END,
       CASE v.rol WHEN 'superadmin' THEN 'superadmin' WHEN 'admin' THEN 'admin' ELSE 'farmer' END,
       v.activo,
       'es',
       COALESCE(v.fecha_registro AT TIME ZONE 'America/Lima', now()),
       v.ultimo_acceso AT TIME ZONE 'America/Lima'
FROM v1_users v
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE lower(u.email) = lower(trim(v.email)))
  AND (v.google_id IS NULL OR NOT EXISTS (SELECT 1 FROM users u WHERE u.google_sub = v.google_id))
ORDER BY lower(v.email), v.id;

CREATE TEMP TABLE user_map ON COMMIT DROP AS
SELECT v.id AS v1_id, u.id AS v2_id
FROM v1_users v
JOIN users u ON lower(u.email) = lower(trim(v.email));

CREATE TEMP TABLE v1_crops ON COMMIT DROP AS
SELECT nextval('crops_id_seq') AS new_id, t.*
FROM dblink(:'v1_conn', $$
    SELECT id, usuario_id, nombre, tipo_cultivo, variedad, area_hectareas::float8, ubicacion,
           fecha_siembra, fecha_cosecha_estimada, estado, descripcion, fecha_creacion,
           fecha_actualizacion
    FROM cultivos
$$) AS t(id integer, usuario_id integer, nombre text, tipo_cultivo text, variedad text,
         area_hectareas double precision, ubicacion text, fecha_siembra date,
         fecha_cosecha_estimada date, estado text, descripcion text, fecha_creacion timestamp,
         fecha_actualizacion timestamp);

CREATE TEMP TABLE crop_map ON COMMIT DROP AS
SELECT c.id AS v1_id, c.new_id AS v2_id, m.v2_id AS user_id
FROM v1_crops c
JOIN user_map m ON m.v1_id = c.usuario_id
WHERE NOT EXISTS (
    SELECT 1 FROM crops existing
    WHERE existing.user_id = m.v2_id
      AND existing.name = c.nombre
      AND existing.created_at = COALESCE(c.fecha_creacion AT TIME ZONE 'America/Lima', existing.created_at)
);

INSERT INTO crops (id, user_id, name, species, variety, area_ha, location_name, sowing_date,
                   harvest_date, status, notes, created_at, updated_at)
SELECT c.new_id,
       m.user_id,
       c.nombre,
       CASE lower(trim(c.tipo_cultivo))
           WHEN 'papa' THEN 'potato'
           WHEN 'quinua' THEN 'quinoa'
           WHEN 'quinoa' THEN 'quinoa'
           WHEN 'maíz' THEN 'maize'
           WHEN 'maiz' THEN 'maize'
           WHEN 'haba' THEN 'faba_bean'
           WHEN 'habas' THEN 'faba_bean'
           WHEN 'oca' THEN 'oca'
           WHEN 'cañihua' THEN 'canihua'
           WHEN 'canihua' THEN 'canihua'
           WHEN 'kañiwa' THEN 'canihua'
           WHEN 'cebada' THEN 'barley'
           WHEN 'trigo' THEN 'wheat'
           ELSE 'other'
       END,
       c.variedad,
       CASE WHEN c.area_hectareas > 0 THEN c.area_hectareas ELSE 1 END,
       c.ubicacion,
       c.fecha_siembra,
       CASE WHEN c.fecha_cosecha_estimada >= c.fecha_siembra OR c.fecha_siembra IS NULL
            THEN c.fecha_cosecha_estimada END,
       CASE c.estado
           WHEN 'planificado' THEN 'planned'
           WHEN 'sembrado' THEN 'sown'
           WHEN 'crecimiento' THEN 'growing'
           WHEN 'cosechado' THEN 'harvested'
           WHEN 'inactivo' THEN 'inactive'
           ELSE 'planned'
       END,
       c.descripcion,
       COALESCE(c.fecha_creacion AT TIME ZONE 'America/Lima', now()),
       COALESCE(c.fecha_actualizacion AT TIME ZONE 'America/Lima', now())
FROM v1_crops c
JOIN crop_map m ON m.v1_id = c.id;

CREATE TEMP TABLE v1_devices ON COMMIT DROP AS
SELECT *
FROM dblink(:'v1_conn', $$
    SELECT s.id, s.cultivo_id, s.nombre, trim(s.esp32_id), s.estado, s.fecha_ultima_lectura,
           s.fecha_creacion
    FROM sensores s
$$) AS t(id integer, cultivo_id integer, nombre text, esp32_id text, estado text,
         fecha_ultima_lectura timestamp, fecha_creacion timestamp);

CREATE TEMP TABLE new_devices (v1_id integer, v2_id bigint, user_id bigint) ON COMMIT DROP;

WITH inserted AS (
    INSERT INTO devices (esp32_id, name, user_id, crop_id, status, last_seen_at, created_at)
    SELECT DISTINCT ON (d.esp32_id)
           d.esp32_id,
           COALESCE(NULLIF(trim(d.nombre), ''), 'Sensor ' || d.esp32_id),
           cm.user_id,
           cm.v2_id,
           CASE
               WHEN cm.user_id IS NULL THEN 'pending'
               WHEN d.estado = 'activo' THEN 'active'
               WHEN d.estado = 'pendiente' THEN 'pending'
               ELSE 'inactive'
           END,
           d.fecha_ultima_lectura AT TIME ZONE 'America/Lima',
           COALESCE(d.fecha_creacion AT TIME ZONE 'America/Lima', now())
    FROM v1_devices d
    LEFT JOIN crop_map cm ON cm.v1_id = d.cultivo_id
    WHERE d.esp32_id <> ''
    ORDER BY d.esp32_id, d.id
    ON CONFLICT (esp32_id) DO NOTHING
    RETURNING id, esp32_id, user_id
)
INSERT INTO new_devices (v1_id, v2_id, user_id)
SELECT d.id, i.id, i.user_id
FROM inserted i
JOIN v1_devices d ON d.esp32_id = i.esp32_id;

INSERT INTO thresholds (device_id, metric, min_value, max_value)
SELECT DISTINCT n.v2_id, defaults.metric, defaults.min_value, defaults.max_value
FROM new_devices n
CROSS JOIN (VALUES ('air_temperature', 2.0, 28.0),
                   ('air_humidity', 40.0, 85.0),
                   ('soil_moisture', 30.0, 80.0)) AS defaults(metric, min_value, max_value)
WHERE n.user_id IS NOT NULL
ON CONFLICT (device_id, metric) DO NOTHING;

INSERT INTO readings (device_id, metric, value, recorded_at)
SELECT n.v2_id, r.metric, r.valor, r.recorded_at
FROM (
    SELECT t.sensor_id,
           CASE lower(t.tipo_lectura)
               WHEN 'temperatura' THEN 'air_temperature'
               WHEN 'temperatura_aire' THEN 'air_temperature'
               WHEN 'humedad_aire' THEN 'air_humidity'
               WHEN 'humedad_suelo' THEN 'soil_moisture'
           END AS metric,
           t.valor,
           COALESCE(t.ts AT TIME ZONE 'America/Lima', now()) AS recorded_at
    FROM dblink(:'v1_conn', $$
        SELECT sensor_id, tipo_lectura, valor::float8, "timestamp" FROM lecturas_sensores
    $$) AS t(sensor_id integer, tipo_lectura text, valor double precision, ts timestamp)
) AS r
JOIN new_devices n ON n.v1_id = r.sensor_id
WHERE (r.metric = 'air_temperature' AND r.valor BETWEEN -40 AND 80)
   OR (r.metric IN ('air_humidity', 'soil_moisture') AND r.valor BETWEEN 0 AND 100);

INSERT INTO audit_log (action, target, meta)
SELECT 'v1_import', 'database:as_terrasense',
       jsonb_build_object(
           'users_in_v1', (SELECT count(*) FROM v1_users),
           'crops_copied', (SELECT count(*) FROM crop_map),
           'devices_copied', (SELECT count(*) FROM new_devices)
       );

SELECT (SELECT count(*) FROM v1_users) AS v1_users,
       (SELECT count(*) FROM user_map) AS users_mapped,
       (SELECT count(*) FROM crop_map) AS crops_copied,
       (SELECT count(*) FROM new_devices) AS devices_copied;

COMMIT;
