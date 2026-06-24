-- =====================================================
-- MIGRACIÓN: Tabla system_config (White-label config)
-- Base de datos: PostgreSQL
-- =====================================================

CREATE TABLE IF NOT EXISTS system_config (
    id             SERIAL PRIMARY KEY,
    config_key     VARCHAR(100) NOT NULL UNIQUE,
    config_value   TEXT         DEFAULT '',
    descripcion    TEXT,
    tipo           VARCHAR(20)  DEFAULT 'text',
    es_imagen      BOOLEAN      DEFAULT FALSE,
    actualizado_en TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    actualizado_por INTEGER     REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_config(config_key);

-- ── Insertar claves por defecto (idempotente) ──────────────────
INSERT INTO system_config (config_key, config_value, descripcion, tipo, es_imagen) VALUES
  ('site_name',              'AgroYachay',                                           'Nombre del sitio',                   'text',    FALSE),
  ('site_tagline',           'Agricultura inteligente para el futuro',               'Tagline del sitio',                  'text',    FALSE),
  ('hero_title',             'Agro',                                                 'Título principal del hero (máx 7)',   'text',    FALSE),
  ('hero_description',       'Plataforma de gestión agrícola con IoT y IA predictiva','Descripción del hero',              'text',    FALSE),
  ('hero_cta',               'Comenzar ahora',                                       'Texto del botón CTA del hero',       'text',    FALSE),
  ('ecosystem_title',        'Ecosistema Agrícola Inteligente',                      'Título sección ecosistema',          'text',    FALSE),
  ('ecosystem_description',  'Conectamos tecnología e innovación para transformar tu campo', 'Descripción ecosistema',    'text',    FALSE),
  ('announcement_enabled',   'false',                                                'Mostrar banner de anuncio',          'boolean', FALSE),
  ('announcement_text',      '',                                                     'Texto del banner de anuncio',        'text',    FALSE),
  ('announcement_color',     '#10b981',                                              'Color del banner de anuncio',        'color',   FALSE),
  ('nav_items',              '[]',                                                   'Items de navegación (JSON)',          'json',    FALSE),
  ('footer_description',     'Sistema de gestión agrícola con tecnología IoT e IA', 'Descripción del pie de página',      'text',    FALSE),
  ('footer_institution',     '',                                                     'Institución en el pie de página',    'text',    FALSE),
  ('footer_contact',         '',                                                     'Email de contacto en el footer',     'email',   FALSE),
  ('footer_copyright',       '',                                                     'Texto de copyright',                 'text',    FALSE),
  ('social_twitter',         '',                                                     'URL Twitter/X',                      'url',     FALSE),
  ('social_facebook',        '',                                                     'URL Facebook',                       'url',     FALSE),
  ('social_instagram',       '',                                                     'URL Instagram',                      'url',     FALSE),
  ('social_linkedin',        '',                                                     'URL LinkedIn',                       'url',     FALSE),
  ('maintenance_mode',       'false',                                                'Modo mantenimiento activo',          'boolean', FALSE),
  ('maintenance_message',    'El sistema está en mantenimiento. Por favor intente más tarde.', 'Mensaje de mantenimiento','text',    FALSE),
  ('ga4_id',                 '',                                                     'Google Analytics GA4 ID',            'text',    FALSE),
  ('logo',                   '',                                                     'Logo principal (ruta archivo)',      'image',   TRUE),
  ('favicon',                '',                                                     'Favicon (ruta archivo)',             'image',   TRUE),
  ('institution_logo',       '',                                                     'Logo de institución (ruta archivo)', 'image',   TRUE),
  ('cover_image',            '',                                                     'Imagen de portada hero (ruta)',      'image',   TRUE)
ON CONFLICT (config_key) DO NOTHING;

-- ── Verificación ──────────────────────────────────────────────
SELECT config_key, config_value, tipo
FROM system_config
ORDER BY config_key;
