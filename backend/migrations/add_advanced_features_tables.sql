-- ========================================
-- MIGRACIÓN: Features Avanzadas AgroYachay
-- Base de datos: PostgreSQL
-- Descripción: Crea tablas para:
--   1. Predicción de Cosecha con IA
--   2. Asesoría Especializada
--   3. Marketplace de Productos
--   4. Generación de Informes PDF
--   5. Datos Climáticos Históricos
--   6. Actividades de Cultivo
--   7. Insumos
-- ========================================

-- ========================================
-- 1. TABLA: predicciones_cosecha
-- ========================================

CREATE TABLE IF NOT EXISTS predicciones_cosecha (
    id                    SERIAL PRIMARY KEY,
    cultivo_id            INTEGER NOT NULL REFERENCES cultivos(id) ON DELETE CASCADE,
    rendimiento_estimado  DECIMAL(10,2),
    unidad                VARCHAR(20) DEFAULT 'toneladas',
    precio_mercado        DECIMAL(10,2),
    ingreso_estimado      DECIMAL(12,2),
    confianza_prediccion  DECIMAL(5,2),
    factores_considerados TEXT,
    fecha_prediccion      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_predicciones_cultivo ON predicciones_cosecha(cultivo_id);
CREATE INDEX IF NOT EXISTS idx_predicciones_fecha   ON predicciones_cosecha(fecha_prediccion);

-- ========================================
-- 2. TABLA: asesorias
-- ========================================

CREATE TABLE IF NOT EXISTS asesorias (
    id                  SERIAL PRIMARY KEY,
    usuario_id          INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo_asesoria       VARCHAR(50) NOT NULL
                            CHECK (tipo_asesoria IN (
                                'Nutrición Vegetal', 'Manejo Hídrico', 'Manejo de Suelos',
                                'Control Fitosanitario', 'Análisis de Productividad',
                                'Agricultura Sostenible', 'Otro'
                            )),
    descripcion_problema TEXT NOT NULL,
    prioridad           VARCHAR(10) DEFAULT 'Media'
                            CHECK (prioridad IN ('Baja','Media','Alta','Crítica')),
    estado              VARCHAR(15) DEFAULT 'Pendiente'
                            CHECK (estado IN ('Pendiente','En Proceso','Resuelta','Cancelada')),
    respuesta           TEXT,
    asesor_asignado     VARCHAR(100),
    fecha_solicitud     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_respuesta     TIMESTAMP,
    fecha_resolucion    TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_asesorias_usuario       ON asesorias(usuario_id);
CREATE INDEX IF NOT EXISTS idx_asesorias_estado        ON asesorias(estado);
CREATE INDEX IF NOT EXISTS idx_asesorias_fecha         ON asesorias(fecha_solicitud);
CREATE INDEX IF NOT EXISTS idx_asesorias_tipo          ON asesorias(tipo_asesoria);

-- ========================================
-- 3. TABLA: productos_marketplace
-- ========================================

CREATE TABLE IF NOT EXISTS productos_marketplace (
    id                  SERIAL PRIMARY KEY,
    nombre              VARCHAR(255) NOT NULL,
    descripcion         TEXT,
    categoria           VARCHAR(20) NOT NULL
                            CHECK (categoria IN (
                                'Semillas','Fertilizantes','Herbicidas','Pesticidas',
                                'Equipos','Herramientas','Bioinsumos','Otro'
                            )),
    precio              DECIMAL(10,2) NOT NULL,
    imagen_url          VARCHAR(500),
    url_compra          VARCHAR(500),
    plataforma          VARCHAR(20) DEFAULT 'Otro'
                            CHECK (plataforma IN ('MercadoLibre','Amazon','Otro')),
    calificacion        DECIMAL(3,1) DEFAULT 0.0,
    numero_ventas       INTEGER DEFAULT 0,
    envio_gratis        BOOLEAN DEFAULT FALSE,
    stock_disponible    INTEGER DEFAULT 0,
    proveedor           VARCHAR(200),
    fecha_agregado      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo              BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_marketplace_nombre      ON productos_marketplace(nombre);
CREATE INDEX IF NOT EXISTS idx_marketplace_categoria   ON productos_marketplace(categoria);
CREATE INDEX IF NOT EXISTS idx_marketplace_precio      ON productos_marketplace(precio);
CREATE INDEX IF NOT EXISTS idx_marketplace_calificacion ON productos_marketplace(calificacion);
CREATE INDEX IF NOT EXISTS idx_marketplace_activo      ON productos_marketplace(activo);
-- Índice para búsqueda de texto completo en español
CREATE INDEX IF NOT EXISTS idx_marketplace_busqueda
    ON productos_marketplace
    USING GIN (to_tsvector('spanish', nombre || ' ' || COALESCE(descripcion, '')));

-- Trigger para actualizar fecha_actualizacion automáticamente
CREATE OR REPLACE FUNCTION update_fecha_actualizacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'trg_marketplace_updated_at'
    ) THEN
        CREATE TRIGGER trg_marketplace_updated_at
        BEFORE UPDATE ON productos_marketplace
        FOR EACH ROW EXECUTE FUNCTION update_fecha_actualizacion();
    END IF;
END;
$$;

-- ========================================
-- 4. TABLA: informes
-- ========================================

CREATE TABLE IF NOT EXISTS informes (
    id               SERIAL PRIMARY KEY,
    usuario_id       INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo_informe     VARCHAR(30) NOT NULL
                         CHECK (tipo_informe IN (
                             'Dashboard Ejecutivo','Estado de Cultivos',
                             'Análisis Financiero','Impacto Climático','Otro'
                         )),
    formato          VARCHAR(10) DEFAULT 'PDF'
                         CHECK (formato IN ('PDF','Excel','CSV')),
    archivo_url      VARCHAR(500),
    parametros       TEXT,
    estado           VARCHAR(15) DEFAULT 'Completado'
                         CHECK (estado IN ('Generando','Completado','Error')),
    fecha_generacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_descarga   TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_informes_usuario ON informes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_informes_tipo    ON informes(tipo_informe);
CREATE INDEX IF NOT EXISTS idx_informes_estado  ON informes(estado);
CREATE INDEX IF NOT EXISTS idx_informes_fecha   ON informes(fecha_generacion);

-- ========================================
-- 5. TABLA: datos_climaticos
-- ========================================

CREATE TABLE IF NOT EXISTS datos_climaticos (
    id               SERIAL PRIMARY KEY,
    latitud          DECIMAL(10,8),
    longitud         DECIMAL(11,8),
    temperatura      DECIMAL(5,2),
    humedad          DECIMAL(5,2),
    presion          DECIMAL(7,2),
    velocidad_viento DECIMAL(5,2),
    direccion_viento DECIMAL(5,2),
    precipitacion    DECIMAL(6,2),
    nubosidad        INTEGER,
    condicion        VARCHAR(50),
    icono            VARCHAR(10),
    fecha_hora       TIMESTAMP NOT NULL,
    fuente           VARCHAR(50) DEFAULT 'OpenWeather'
);

CREATE INDEX IF NOT EXISTS idx_climaticos_fecha     ON datos_climaticos(fecha_hora);
CREATE INDEX IF NOT EXISTS idx_climaticos_ubicacion ON datos_climaticos(latitud, longitud);

-- ========================================
-- 6. TABLA: actividades_cultivo
-- ========================================

CREATE TABLE IF NOT EXISTS actividades_cultivo (
    id               SERIAL PRIMARY KEY,
    cultivo_id       INTEGER NOT NULL REFERENCES cultivos(id) ON DELETE CASCADE,
    tipo_actividad   VARCHAR(30) NOT NULL
                         CHECK (tipo_actividad IN (
                             'Riego','Fertilización','Control de Plagas','Cosecha','Otro'
                         )),
    descripcion      TEXT,
    fecha_actividad  DATE NOT NULL,
    costo            DECIMAL(10,2) DEFAULT 0,
    fecha_registro   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_actividades_cultivo ON actividades_cultivo(cultivo_id);
CREATE INDEX IF NOT EXISTS idx_actividades_fecha   ON actividades_cultivo(fecha_actividad);
CREATE INDEX IF NOT EXISTS idx_actividades_tipo    ON actividades_cultivo(tipo_actividad);

-- ========================================
-- 7. TABLA: insumos
-- ========================================

CREATE TABLE IF NOT EXISTS insumos (
    id               SERIAL PRIMARY KEY,
    cultivo_id       INTEGER NOT NULL REFERENCES cultivos(id) ON DELETE CASCADE,
    tipo_insumo      VARCHAR(30) NOT NULL
                         CHECK (tipo_insumo IN (
                             'Fertilizante NPK','Agua','Pesticida',
                             'Herbicida','Semillas','Otro'
                         )),
    cantidad         DECIMAL(10,2) NOT NULL,
    unidad           VARCHAR(20) NOT NULL,
    costo_unitario   DECIMAL(10,2),
    costo_total      DECIMAL(10,2),
    fecha_aplicacion DATE,
    proveedor        VARCHAR(100),
    notas            TEXT,
    fecha_registro   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_insumos_cultivo ON insumos(cultivo_id);
CREATE INDEX IF NOT EXISTS idx_insumos_tipo    ON insumos(tipo_insumo);
CREATE INDEX IF NOT EXISTS idx_insumos_fecha   ON insumos(fecha_aplicacion);

-- ========================================
-- DATOS DE EJEMPLO: Marketplace
-- ========================================

INSERT INTO productos_marketplace
    (nombre, descripcion, categoria, precio, imagen_url, url_compra,
     plataforma, calificacion, numero_ventas, envio_gratis, proveedor, activo)
SELECT * FROM (VALUES
    ('Semillas de Papa Yungay Certificadas 1kg',
     'Semillas certificadas de papa variedad Yungay, resistente a heladas y adaptada a altura',
     'Semillas', 48.50,
     'https://http2.mlstatic.com/D_NQ_NP_2X_886119-MPE52566308852_112022-F.webp',
     'https://articulo.mercadolibre.com.pe/MPE-637382958',
     'MercadoLibre', 4.7, 856, TRUE, 'AgroSeeds Perú', TRUE),

    ('Fertilizante Triple 15 (NPK 15-15-15) - Saco 50kg',
     'Fertilizante completo balanceado para todo tipo de cultivos. Aporta N-P-K en partes iguales',
     'Fertilizantes', 145.00,
     'https://http2.mlstatic.com/D_NQ_NP_2X_761836-MPE48974645728_012022-F.webp',
     'https://www.mercadolibre.com.pe/fertilizante-triple-15',
     'MercadoLibre', 4.5, 1243, FALSE, 'FertiAg', TRUE),

    ('Sistema de Riego por Goteo Automatizado 100m',
     'Kit completo de riego por goteo con temporizador digital y sensores de humedad',
     'Equipos', 385.00,
     'https://m.media-amazon.com/images/I/71HMFJmJ5nL._AC_SL1500_.jpg',
     'https://www.amazon.com/-/es/dp/B08L3YQ9MX',
     'Amazon', 4.6, 432, TRUE, 'RiegoTech', TRUE),

    ('Abono Orgánico Compost 20kg',
     'Abono orgánico 100% natural, ideal para mejorar la estructura del suelo',
     'Bioinsumos', 35.00,
     'https://http2.mlstatic.com/D_NQ_NP_2X_945123-MPE51234567890_082022-F.webp',
     'https://www.mercadolibre.com.pe/abono-organico',
     'MercadoLibre', 4.8, 2156, TRUE, 'EcoAgro', TRUE),

    ('Fungicida Sistémico para Control de Hongos 1L',
     'Fungicida de amplio espectro para prevención y control de enfermedades fúngicas',
     'Pesticidas', 68.00,
     'https://http2.mlstatic.com/D_NQ_NP_2X_123456-MPE49876543210_052022-F.webp',
     'https://www.mercadolibre.com.pe/fungicida-sistemico',
     'MercadoLibre', 4.4, 687, FALSE, 'AgroProtect', TRUE)
) AS nuevos(nombre, descripcion, categoria, precio, imagen_url, url_compra,
            plataforma, calificacion, numero_ventas, envio_gratis, proveedor, activo)
WHERE NOT EXISTS (
    SELECT 1 FROM productos_marketplace
    WHERE productos_marketplace.nombre = nuevos.nombre
);

-- ========================================
-- VERIFICACIÓN FINAL
-- ========================================

SELECT
    table_name,
    'creada' AS estado
FROM information_schema.tables
WHERE table_catalog = current_database()
  AND table_schema = 'public'
  AND table_name IN (
      'predicciones_cosecha', 'asesorias', 'productos_marketplace',
      'informes', 'datos_climaticos', 'actividades_cultivo', 'insumos'
  )
ORDER BY table_name;

-- ========================================
-- FIN DE LA MIGRACIÓN
-- ========================================
