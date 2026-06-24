"""
Script para verificar y configurar la base de datos PostgreSQL para AgroYachay
Ejecutar: python setup_postgres.py
"""

import os
import secrets
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import bcrypt
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': int(os.getenv('DB_PORT', 5432)),
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', ''),
    'database': os.getenv('DB_NAME', 'as_terrasense'),
}

def conectar_postgres():
    """Conectar a PostgreSQL (base de datos postgres)"""
    return psycopg2.connect(
        host=DB_CONFIG['host'],
        port=DB_CONFIG['port'],
        user=DB_CONFIG['user'],
        password=DB_CONFIG['password'],
        database='postgres'  # Conectar a la BD default
    )

def conectar_agrifarm():
    """Conectar a la base de datos as_terrasense"""
    return psycopg2.connect(
        host=DB_CONFIG['host'],
        port=DB_CONFIG['port'],
        user=DB_CONFIG['user'],
        password=DB_CONFIG['password'],
        database=DB_CONFIG['database']
    )

def crear_base_datos():
    """Crear la base de datos as_terrasense si no existe"""
    print("\n[1/5] Verificando base de datos...")

    conn = conectar_postgres()
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cursor = conn.cursor()

    try:
        # Verificar si la BD existe
        cursor.execute("SELECT 1 FROM pg_database WHERE datname = 'as_terrasense'")
        existe = cursor.fetchone()

        if not existe:
            print("[CREAR] Creando base de datos as_terrasense...")
            cursor.execute("CREATE DATABASE as_terrasense WITH ENCODING 'UTF8'")
            print("[OK] Base de datos creada")
        else:
            print("[OK] Base de datos ya existe")

    finally:
        cursor.close()
        conn.close()

def crear_tablas():
    """Crear todas las tablas necesarias"""
    print("\n[2/5] Creando tablas...")

    conn = conectar_agrifarm()
    cursor = conn.cursor()

    try:
        # Tabla usuarios
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS usuarios (
                id SERIAL PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                email VARCHAR(150) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                telefono VARCHAR(20),
                rol VARCHAR(20) NOT NULL DEFAULT 'usuario'
                    CHECK (rol IN ('superadmin', 'admin', 'agricultor', 'usuario')),
                activo BOOLEAN NOT NULL DEFAULT TRUE,
                google_id VARCHAR(255) UNIQUE,
                avatar TEXT,
                google_avatar TEXT,
                fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                ultimo_acceso TIMESTAMP
            )
        """)
        print("   [OK] Tabla usuarios")

        # Tabla cultivos
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS cultivos (
                id SERIAL PRIMARY KEY,
                usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
                nombre VARCHAR(100) NOT NULL,
                tipo_cultivo VARCHAR(100) NOT NULL,
                variedad VARCHAR(100),
                area_hectareas DECIMAL(10,2),
                ubicacion VARCHAR(255),
                fecha_siembra DATE,
                fecha_cosecha_estimada DATE,
                estado VARCHAR(20) DEFAULT 'planificado' CHECK (estado IN ('planificado', 'sembrado', 'crecimiento', 'cosechado', 'inactivo')),
                descripcion TEXT,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("   [OK] Tabla cultivos")

        # Tabla sensores
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sensores (
                id SERIAL PRIMARY KEY,
                cultivo_id INTEGER NOT NULL REFERENCES cultivos(id) ON DELETE CASCADE,
                nombre VARCHAR(100) NOT NULL,
                tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('DHT11', 'DHT22', 'humedad_suelo', 'luminosidad', 'ph', 'otro')),
                modelo VARCHAR(50),
                esp32_id VARCHAR(50) UNIQUE NOT NULL,
                ubicacion VARCHAR(255),
                estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'mantenimiento', 'error')),
                fecha_instalacion DATE,
                fecha_ultima_lectura TIMESTAMP NULL,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("   [OK] Tabla sensores")

        # Tabla lecturas_sensores
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS lecturas_sensores (
                id BIGSERIAL PRIMARY KEY,
                sensor_id INTEGER NOT NULL REFERENCES sensores(id) ON DELETE CASCADE,
                tipo_lectura VARCHAR(50) NOT NULL,
                valor DECIMAL(10,2) NOT NULL,
                unidad VARCHAR(20) NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                calidad_dato VARCHAR(20) DEFAULT 'bueno' CHECK (calidad_dato IN ('bueno', 'aceptable', 'malo'))
            )
        """)
        print("   [OK] Tabla lecturas_sensores")

        # Tabla alertas_sensores
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS alertas_sensores (
                id SERIAL PRIMARY KEY,
                sensor_id INTEGER NOT NULL REFERENCES sensores(id) ON DELETE CASCADE,
                tipo_alerta VARCHAR(50) NOT NULL CHECK (tipo_alerta IN ('temperatura_alta', 'temperatura_baja', 'humedad_alta', 'humedad_baja', 'sensor_offline', 'otro')),
                mensaje TEXT NOT NULL,
                severidad VARCHAR(20) DEFAULT 'warning' CHECK (severidad IN ('info', 'warning', 'critical')),
                valor_actual DECIMAL(10,2),
                umbral_configurado DECIMAL(10,2),
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                resuelta BOOLEAN DEFAULT FALSE,
                fecha_resolucion TIMESTAMP NULL
            )
        """)
        print("   [OK] Tabla alertas_sensores")

        # Tabla umbrales_sensores
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS umbrales_sensores (
                id SERIAL PRIMARY KEY,
                sensor_id INTEGER NOT NULL REFERENCES sensores(id) ON DELETE CASCADE,
                parametro VARCHAR(50) NOT NULL,
                min_valor DECIMAL(10,2),
                max_valor DECIMAL(10,2),
                min_critico DECIMAL(10,2),
                max_critico DECIMAL(10,2),
                activo BOOLEAN DEFAULT TRUE,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("   [OK] Tabla umbrales_sensores")

        # Tabla detecciones_plagas
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS detecciones_plagas (
                id SERIAL PRIMARY KEY,
                cultivo_id INTEGER REFERENCES cultivos(id) ON DELETE SET NULL,
                imagen_path VARCHAR(500),
                tipo_plaga VARCHAR(100),
                confianza DECIMAL(5,2),
                severidad VARCHAR(20) CHECK (severidad IN ('leve', 'moderada', 'severa')),
                recomendaciones TEXT,
                fecha_deteccion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                tratamiento_aplicado BOOLEAN DEFAULT FALSE
            )
        """)
        print("   [OK] Tabla detecciones_plagas")

        # Tabla asesorias
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS asesorias (
                id SERIAL PRIMARY KEY,
                usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
                tipo_asesoria VARCHAR(100) NOT NULL,
                descripcion_problema TEXT NOT NULL,
                prioridad VARCHAR(20) DEFAULT 'Media' CHECK (prioridad IN ('Baja', 'Media', 'Alta', 'Urgente', 'Critica')),
                estado VARCHAR(20) DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'En Proceso', 'En Revision', 'Resuelta', 'Respondida', 'Cancelada')),
                respuesta TEXT,
                asesor_asignado VARCHAR(100),
                fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_respuesta TIMESTAMP,
                fecha_resolucion TIMESTAMP
            )
        """)
        print("   [OK] Tabla asesorias")

        # Tabla productos_marketplace
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS productos_marketplace (
                id SERIAL PRIMARY KEY,
                nombre VARCHAR(255) NOT NULL,
                descripcion TEXT,
                categoria VARCHAR(50) NOT NULL,
                precio DECIMAL(10,2) NOT NULL,
                imagen_url VARCHAR(500),
                url_compra VARCHAR(500),
                plataforma VARCHAR(50) DEFAULT 'Otro',
                calificacion DECIMAL(3,1) DEFAULT 0,
                numero_ventas INTEGER DEFAULT 0,
                envio_gratis BOOLEAN DEFAULT FALSE,
                stock_disponible INTEGER DEFAULT 0,
                proveedor VARCHAR(200),
                fecha_agregado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                activo BOOLEAN DEFAULT TRUE
            )
        """)
        print("   [OK] Tabla productos_marketplace")

        # Tabla informes
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS informes (
                id SERIAL PRIMARY KEY,
                usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
                tipo_informe VARCHAR(100) NOT NULL,
                formato VARCHAR(20) DEFAULT 'PDF' CHECK (formato IN ('PDF', 'Excel', 'CSV')),
                archivo_url VARCHAR(500),
                parametros TEXT,
                estado VARCHAR(20) DEFAULT 'Completado' CHECK (estado IN ('Generando', 'Completado', 'Error')),
                fecha_generacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_descarga TIMESTAMP
            )
        """)
        print("   [OK] Tabla informes")

        # Tabla datos_climaticos
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS datos_climaticos (
                id SERIAL PRIMARY KEY,
                latitud DECIMAL(10,8),
                longitud DECIMAL(11,8),
                temperatura DECIMAL(5,2),
                humedad DECIMAL(5,2),
                presion DECIMAL(7,2),
                velocidad_viento DECIMAL(5,2),
                direccion_viento DECIMAL(5,2),
                precipitacion DECIMAL(6,2),
                nubosidad INTEGER,
                condicion VARCHAR(50),
                icono VARCHAR(10),
                fecha_hora TIMESTAMP NOT NULL,
                fuente VARCHAR(50) DEFAULT 'OpenWeather'
            )
        """)
        print("   [OK] Tabla datos_climaticos")

        conn.commit()
        print("\n[OK] [OK] Todas las tablas creadas correctamente")

    finally:
        cursor.close()
        conn.close()

def crear_indices():
    """Crear índices para mejor rendimiento"""
    print("\n[3/5] Creando índices...")

    conn = conectar_agrifarm()
    cursor = conn.cursor()

    try:
        indices = [
            "CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email)",
            "CREATE INDEX IF NOT EXISTS idx_cultivos_usuario ON cultivos(usuario_id)",
            "CREATE INDEX IF NOT EXISTS idx_sensores_cultivo ON sensores(cultivo_id)",
            "CREATE INDEX IF NOT EXISTS idx_sensores_esp32 ON sensores(esp32_id)",
            "CREATE INDEX IF NOT EXISTS idx_lecturas_sensor ON lecturas_sensores(sensor_id)",
            "CREATE INDEX IF NOT EXISTS idx_lecturas_timestamp ON lecturas_sensores(timestamp)",
            "CREATE INDEX IF NOT EXISTS idx_detecciones_cultivo ON detecciones_plagas(cultivo_id)",
            "CREATE INDEX IF NOT EXISTS idx_asesorias_usuario ON asesorias(usuario_id)",
            "CREATE INDEX IF NOT EXISTS idx_asesorias_estado ON asesorias(estado)",
            "CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos_marketplace(categoria)",
            "CREATE INDEX IF NOT EXISTS idx_informes_usuario ON informes(usuario_id)",
            "CREATE INDEX IF NOT EXISTS idx_datos_climaticos_fecha ON datos_climaticos(fecha_hora)",
        ]

        for indice in indices:
            cursor.execute(indice)

        conn.commit()
        print("[OK] [OK] Índices creados")

    finally:
        cursor.close()
        conn.close()

def crear_usuario_admin():
    """Crear usuario administrador"""
    print("\n[4/5] Configurando usuario administrador...")

    conn = conectar_agrifarm()
    cursor = conn.cursor()

    try:
        # Verificar si el usuario ya existe
        cursor.execute("SELECT id FROM usuarios WHERE email = 'andrevilcasolorzano@gmail.com'")
        existe = cursor.fetchone()

        if not existe:
            # Password del superadmin desde ADMIN_PASSWORD; si no se define, se genera
            # uno aleatorio (nunca se hardcodea un secreto en el repositorio).
            password = os.getenv('ADMIN_PASSWORD') or secrets.token_urlsafe(12)
            password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

            cursor.execute("""
                INSERT INTO usuarios (nombre, email, password_hash, telefono, rol)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id
            """, ('Andre Vilca Solorzano', 'andrevilcasolorzano@gmail.com', password_hash,
                  '999999999', 'superadmin'))

            usuario_id = cursor.fetchone()[0]
            conn.commit()
            print(f"[CREAR] [OK] Usuario admin creado con ID: {usuario_id}")
            print(f"   Email: andrevilcasolorzano@gmail.com")
            print(f"   Password: {password}")
            return usuario_id
        else:
            usuario_id = existe[0]
            print(f"[OK] [OK] Usuario admin ya existe con ID: {usuario_id}")
            return usuario_id

    finally:
        cursor.close()
        conn.close()

def crear_cultivo_sensores(usuario_id):
    """Crear cultivo de ejemplo y configurar sensor ESP32"""
    print("\n[5/5] Configurando cultivo y sensor ESP32...")

    conn = conectar_agrifarm()
    cursor = conn.cursor()

    try:
        # Verificar si ya existe el cultivo
        cursor.execute("SELECT id FROM cultivos WHERE usuario_id = %s LIMIT 1", (usuario_id,))
        cultivo_existe = cursor.fetchone()

        if not cultivo_existe:
            cursor.execute("""
                INSERT INTO cultivos (usuario_id, nombre, tipo_cultivo, area_hectareas,
                                     ubicacion, fecha_siembra, estado, descripcion)
                VALUES (%s, %s, %s, %s, %s, CURRENT_DATE, %s, %s)
                RETURNING id
            """, (usuario_id, 'Cultivo Principal IoT', 'Papa', 2.5,
                  'Parcela A - Puno', 'crecimiento',
                  'Cultivo monitoreado con sensores ESP32 - Temperatura, humedad de aire y suelo'))

            cultivo_id = cursor.fetchone()[0]
            print(f"[CREAR] [OK] Cultivo creado con ID: {cultivo_id}")
        else:
            cultivo_id = cultivo_existe[0]
            print(f"[OK] [OK] Cultivo ya existe con ID: {cultivo_id}")

        # Verificar si ya existe el sensor ESP32
        cursor.execute("SELECT id FROM sensores WHERE esp32_id = 'ESP32_AGRIFARM_01'")
        sensor_existe = cursor.fetchone()

        if not sensor_existe:
            cursor.execute("""
                INSERT INTO sensores (cultivo_id, nombre, tipo, modelo, esp32_id,
                                     ubicacion, estado, fecha_instalacion)
                VALUES (%s, %s, %s, %s, %s, %s, %s, CURRENT_DATE)
                RETURNING id
            """, (cultivo_id, 'Sensor Principal ESP32', 'DHT11', 'DHT11 + FC-28',
                  'ESP32_AGRIFARM_01', 'Centro del cultivo', 'activo'))

            sensor_id = cursor.fetchone()[0]
            print(f"[CREAR] [OK] Sensor ESP32 registrado con ID: {sensor_id}")

            # Crear umbrales de ejemplo
            cursor.execute("""
                INSERT INTO umbrales_sensores (sensor_id, parametro, min_valor, max_valor, min_critico, max_critico, activo)
                VALUES
                    (%s, 'temperatura_aire', 15.0, 28.0, 10.0, 35.0, TRUE),
                    (%s, 'humedad_aire', 40.0, 80.0, 30.0, 90.0, TRUE),
                    (%s, 'humedad_suelo', 30.0, 70.0, 20.0, 85.0, TRUE)
            """, (sensor_id, sensor_id, sensor_id))

            print(f"[CREAR] [OK] Umbrales configurados")
        else:
            sensor_id = sensor_existe[0]
            print(f"[OK] [OK] Sensor ESP32 ya existe con ID: {sensor_id}")

        conn.commit()

        print("\n" + "="*60)
        print("  [OK] CONFIGURACIÓN COMPLETADA")
        print("="*60)
        print(f"Usuario ID: {usuario_id} - andrevilcasolorzano@gmail.com")
        print(f"Cultivo ID: {cultivo_id} - Cultivo Principal IoT")
        print(f"Sensor ID: {sensor_id} - ESP32_AGRIFARM_01")
        print("\nEl sensor ESP32 ya puede enviar datos!")
        print("="*60)

    finally:
        cursor.close()
        conn.close()

def main():
    """Función principal"""
    print("\n" + "="*60)
    print("  SETUP DE BASE DE DATOS POSTGRESQL - AgroYachay")
    print("="*60)

    try:
        crear_base_datos()
        crear_tablas()
        crear_indices()
        usuario_id = crear_usuario_admin()
        crear_cultivo_sensores(usuario_id)

        print("\n[OK] PROCESO COMPLETADO EXITOSAMENTE!\n")

    except Exception as e:
        print(f"\n[ERROR] ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

    return True

if __name__ == "__main__":
    main()
