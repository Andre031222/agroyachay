-- Índices de rendimiento adicionales.
-- El esquema base (scripts/setup_postgres.py) ya indexa email, usuario_id,
-- esp32_id, sensor_id, timestamp, etc. Aquí solo se añaden índices compuestos
-- que el esquema base no cubre y que aceleran patrones de consulta reales.

-- "Últimas N lecturas de un sensor" (ORDER BY timestamp DESC WHERE sensor_id = ?)
CREATE INDEX IF NOT EXISTS idx_lecturas_sensor_timestamp
    ON lecturas_sensores (sensor_id, timestamp DESC);

-- Alertas no resueltas por sensor (filtro frecuente en el dashboard de sensores)
CREATE INDEX IF NOT EXISTS idx_alertas_sensor_resuelta
    ON alertas_sensores (sensor_id, resuelta);
