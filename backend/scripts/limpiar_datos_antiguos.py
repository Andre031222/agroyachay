"""
Script para limpiar datos antiguos de sensores.
Elimina lecturas con timestamps anteriores a N días.
Usa PostgreSQL (psycopg2) y lee credenciales desde .env
"""

import os
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': int(os.getenv('DB_PORT', 5432)),
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', ''),
    'dbname': os.getenv('DB_NAME', 'agrifarm_db'),
}

# Antigüedad máxima de lecturas (configurable)
DIAS_LIMITE = int(os.getenv('LIMPIEZA_DIAS', 7))


def limpiar_datos_antiguos(dias: int = DIAS_LIMITE) -> None:
    """Eliminar lecturas con timestamps más antiguos que `dias` días."""
    fecha_limite = datetime.now() - timedelta(days=dias)
    print(f"Limpiando lecturas anteriores a: {fecha_limite.isoformat()} ({dias} días)")

    connection = psycopg2.connect(**DB_CONFIG, cursor_factory=RealDictCursor)
    try:
        with connection:
            with connection.cursor() as cursor:
                # Contar antes de borrar
                cursor.execute(
                    "SELECT COUNT(*) AS total FROM lecturas_sensores WHERE timestamp < %s",
                    (fecha_limite,),
                )
                total_antiguas = cursor.fetchone()['total']
                print(f"Lecturas a eliminar: {total_antiguas}")

                if total_antiguas > 0:
                    cursor.execute(
                        "DELETE FROM lecturas_sensores WHERE timestamp < %s",
                        (fecha_limite,),
                    )
                    print(f"✅ {total_antiguas} lecturas eliminadas exitosamente")
                else:
                    print("✅ No hay lecturas antiguas para eliminar")

                # Estado actual
                cursor.execute("SELECT COUNT(*) AS total FROM lecturas_sensores")
                total_actual = cursor.fetchone()['total']
                print(f"\n📊 Total de lecturas en la base de datos: {total_actual}")

                cursor.execute("SELECT MAX(timestamp) AS ultima FROM lecturas_sensores")
                ultima = cursor.fetchone()['ultima']
                if ultima:
                    print(f"📅 Última lectura registrada: {ultima.isoformat()}")
    finally:
        connection.close()


if __name__ == '__main__':
    print("\n========================================")
    print("  LIMPIEZA DE DATOS ANTIGUOS")
    print("========================================\n")

    limpiar_datos_antiguos()

    print("\n========================================")
    print("  ✅ LIMPIEZA COMPLETADA")
    print("========================================\n")
