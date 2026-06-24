"""
Script para agregar tablas faltantes necesarias para el generador de informes
"""

import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': int(os.getenv('DB_PORT', 5432)),
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', ''),
    'database': os.getenv('DB_NAME', 'agrifarm_db'),
}

def main():
    print("\n[Agregando tablas faltantes...]")

    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()

    try:
        # Tabla actividades_cultivo
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS actividades_cultivo (
                id SERIAL PRIMARY KEY,
                cultivo_id INTEGER NOT NULL REFERENCES cultivos(id) ON DELETE CASCADE,
                tipo_actividad VARCHAR(50) NOT NULL,
                descripcion TEXT,
                fecha_actividad DATE NOT NULL,
                costo DECIMAL(10,2) DEFAULT 0,
                fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("   [OK] Tabla actividades_cultivo")

        # Tabla insumos
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS insumos (
                id SERIAL PRIMARY KEY,
                cultivo_id INTEGER NOT NULL REFERENCES cultivos(id) ON DELETE CASCADE,
                tipo_insumo VARCHAR(50) NOT NULL,
                cantidad DECIMAL(10,2) NOT NULL,
                unidad VARCHAR(20) NOT NULL,
                costo_unitario DECIMAL(10,2),
                costo_total DECIMAL(10,2),
                fecha_aplicacion DATE,
                proveedor VARCHAR(100),
                notas TEXT,
                fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("   [OK] Tabla insumos")

        # Tabla predicciones_cosecha
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS predicciones_cosecha (
                id SERIAL PRIMARY KEY,
                cultivo_id INTEGER NOT NULL REFERENCES cultivos(id) ON DELETE CASCADE,
                rendimiento_estimado DECIMAL(10,2),
                unidad VARCHAR(20),
                precio_mercado DECIMAL(10,2),
                ingreso_estimado DECIMAL(12,2),
                confianza_prediccion DECIMAL(5,2),
                factores_considerados TEXT,
                fecha_prediccion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("   [OK] Tabla predicciones_cosecha")

        # Crear índices
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_actividades_cultivo ON actividades_cultivo(cultivo_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_insumos_cultivo ON insumos(cultivo_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_predicciones_cultivo ON predicciones_cosecha(cultivo_id)")
        print("   [OK] Índices creados")

        # Insertar datos de ejemplo para el cultivo existente
        cursor.execute("""
            INSERT INTO insumos (cultivo_id, tipo_insumo, cantidad, unidad, costo_unitario, costo_total, fecha_aplicacion)
            VALUES
                (1, 'Fertilizante NPK', 50, 'kg', 2.50, 125.00, CURRENT_DATE - INTERVAL '30 days'),
                (1, 'Agua', 5000, 'litros', 0.01, 50.00, CURRENT_DATE - INTERVAL '25 days'),
                (1, 'Pesticida', 5, 'litros', 25.00, 125.00, CURRENT_DATE - INTERVAL '20 days')
            ON CONFLICT DO NOTHING
        """)
        print("   [OK] Insumos de ejemplo insertados")

        cursor.execute("""
            INSERT INTO actividades_cultivo (cultivo_id, tipo_actividad, descripcion, fecha_actividad, costo)
            VALUES
                (1, 'Riego', 'Riego por aspersion - Zona Norte', CURRENT_DATE - INTERVAL '5 days', 15.00),
                (1, 'Fertilización', 'Aplicacion de NPK 15-15-15', CURRENT_DATE - INTERVAL '15 days', 125.00),
                (1, 'Control de Plagas', 'Fumigacion preventiva', CURRENT_DATE - INTERVAL '10 days', 80.00)
            ON CONFLICT DO NOTHING
        """)
        print("   [OK] Actividades de ejemplo insertadas")

        cursor.execute("""
            INSERT INTO predicciones_cosecha (cultivo_id, rendimiento_estimado, unidad, precio_mercado, ingreso_estimado, confianza_prediccion, factores_considerados)
            VALUES
                (1, 25000, 'kg', 1.20, 30000.00, 85.50, 'Condiciones climaticas favorables, buen manejo de riego, control de plagas efectivo')
            ON CONFLICT DO NOTHING
        """)
        print("   [OK] Prediccion de ejemplo insertada")

        conn.commit()
        print("\n[OK] Tablas faltantes agregadas correctamente\n")

    except Exception as e:
        conn.rollback()
        print(f"\n[ERROR] {str(e)}\n")
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    main()
