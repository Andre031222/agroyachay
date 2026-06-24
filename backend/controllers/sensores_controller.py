from flask import Blueprint, request, jsonify
from datetime import datetime
from db import get_db_connection

sensores_bp = Blueprint('sensores', __name__)


@sensores_bp.route('/lectura', methods=['POST'])
def recibir_lectura():
    try:
        data = request.get_json()

        if not data:
            return jsonify({
                'success': False,
                'message': 'No se recibieron datos'
            }), 400

        esp32_id = data.get('esp32_id')
        sensor_id = data.get('sensor_id', 0)

        if not esp32_id:
            return jsonify({
                'success': False,
                'message': 'Falta campo requerido: esp32_id'
            }), 400

        connection = get_db_connection()
        cursor = connection.cursor()

        try:
            cursor.execute(
                "SELECT id, estado FROM sensores WHERE esp32_id = %s AND estado IN ('activo', 'pendiente')",
                (esp32_id,)
            )
            result = cursor.fetchone()
            if result:
                sensor_id = result['id']
            else:
                cursor.execute("""
                    INSERT INTO sensores (cultivo_id, nombre, tipo, modelo, esp32_id, ubicacion, estado, fecha_instalacion)
                    VALUES (NULL, %s, 'DHT11', 'Auto-detectado', %s, 'Sin asignar', 'pendiente', CURRENT_DATE)
                    RETURNING id
                """, (f'Sensor {esp32_id}', esp32_id))
                sensor_id = cursor.fetchone()['id']
                connection.commit()

            lecturas_insertadas = 0
            errores = []

            if 'timestamp' in data and data['timestamp']:
                try:
                    timestamp_actual = datetime.fromtimestamp(data['timestamp'])
                except:
                    timestamp_actual = datetime.now()
            else:
                timestamp_actual = datetime.now()

            if 'temperatura' in data or 'humedad_aire' in data or 'humedad_suelo' in data:
                if 'temperatura' in data and data['temperatura'] is not None:
                    try:
                        cursor.execute("""
                            INSERT INTO lecturas_sensores (sensor_id, tipo_lectura, valor, unidad, timestamp, calidad_dato)
                            VALUES (%s, 'temperatura_aire', %s, 'Celsius', %s, 'bueno')
                        """, (sensor_id, data['temperatura'], timestamp_actual))
                        lecturas_insertadas += 1
                    except Exception as e:
                        errores.append("Error guardando temperatura")

                if 'humedad_aire' in data and data['humedad_aire'] is not None:
                    try:
                        cursor.execute("""
                            INSERT INTO lecturas_sensores (sensor_id, tipo_lectura, valor, unidad, timestamp, calidad_dato)
                            VALUES (%s, 'humedad_aire', %s, '%%', %s, 'bueno')
                        """, (sensor_id, data['humedad_aire'], timestamp_actual))
                        lecturas_insertadas += 1
                    except Exception as e:
                        errores.append("Error guardando humedad aire")

                if 'humedad_suelo' in data and data['humedad_suelo'] is not None:
                    try:
                        cursor.execute("""
                            INSERT INTO lecturas_sensores (sensor_id, tipo_lectura, valor, unidad, timestamp, calidad_dato)
                            VALUES (%s, 'humedad_suelo', %s, '%%', %s, 'bueno')
                        """, (sensor_id, data['humedad_suelo'], timestamp_actual))
                        lecturas_insertadas += 1
                    except Exception as e:
                        errores.append("Error guardando humedad suelo")

            elif 'lecturas' in data:
                for lectura in data['lecturas']:
                    try:
                        tipo = lectura.get('tipo')
                        valor = lectura.get('valor')
                        unidad = lectura.get('unidad', '')

                        if tipo and valor is not None:
                            cursor.execute("""
                                INSERT INTO lecturas_sensores (sensor_id, tipo_lectura, valor, unidad, timestamp, calidad_dato)
                                VALUES (%s, %s, %s, %s, %s, 'bueno')
                            """, (sensor_id, tipo, valor, unidad, timestamp_actual))
                            lecturas_insertadas += 1
                    except Exception as e:
                        errores.append("Error guardando lectura")

            if lecturas_insertadas == 0:
                return jsonify({
                    'success': False,
                    'message': 'No se recibieron lecturas válidas',
                    'errores': errores if errores else None
                }), 400

            cursor.execute(
                "UPDATE sensores SET fecha_ultima_lectura = %s WHERE id = %s",
                (timestamp_actual, sensor_id)
            )

            connection.commit()

            valores_lectura = {
                k: data[k] for k in ('temperatura', 'humedad_aire', 'humedad_suelo')
                if k in data and data[k] is not None
            }
            if 'temperatura' in valores_lectura:
                valores_lectura['temperatura_aire'] = valores_lectura.pop('temperatura')
            alertas = verificar_umbrales(sensor_id, valores_lectura)

            response = {
                'success': True,
                'message': f'{lecturas_insertadas} lecturas guardadas correctamente',
                'sensor_id': sensor_id,
                'esp32_id': esp32_id,
                'lecturas_procesadas': lecturas_insertadas,
                'timestamp': timestamp_actual.isoformat()
            }

            if errores:
                response['errores'] = errores
            if alertas:
                response['alertas'] = alertas

            return jsonify(response), 201

        finally:
            cursor.close()
            connection.close()

    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error procesando lectura'
        }), 500


@sensores_bp.route('/registrar', methods=['POST'])
def registrar_sensor():
    try:
        data = request.get_json()

        cultivo_id = data.get('cultivo_id')
        nombre = data.get('nombre')
        tipo = data.get('tipo')
        modelo = data.get('modelo', '')
        esp32_id = data.get('esp32_id')
        ubicacion = data.get('ubicacion', '')

        if not all([cultivo_id, nombre, tipo, esp32_id]):
            return jsonify({
                'success': False,
                'message': 'Faltan campos requeridos'
            }), 400

        connection = get_db_connection()
        cursor = connection.cursor()

        try:
            cursor.execute("SELECT id FROM sensores WHERE esp32_id = %s", (esp32_id,))
            if cursor.fetchone():
                return jsonify({
                    'success': False,
                    'message': f'Ya existe un sensor con ESP32_ID: {esp32_id}'
                }), 409

            cursor.execute("""
                INSERT INTO sensores (cultivo_id, nombre, tipo, modelo, esp32_id, ubicacion, estado, fecha_instalacion)
                VALUES (%s, %s, %s, %s, %s, %s, 'activo', CURRENT_DATE)
                RETURNING id
            """, (cultivo_id, nombre, tipo, modelo, esp32_id, ubicacion))

            sensor_id = cursor.fetchone()['id']
            connection.commit()

            return jsonify({
                'success': True,
                'message': 'Sensor registrado exitosamente',
                'sensor_id': sensor_id,
                'esp32_id': esp32_id
            }), 201

        finally:
            cursor.close()
            connection.close()

    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error registrando sensor'
        }), 500


@sensores_bp.route('/listado', methods=['GET'])
def listar_sensores():
    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        try:
            cursor.execute("""
                SELECT id, cultivo_id, nombre, tipo, modelo, esp32_id, ubicacion,
                       estado, fecha_instalacion, fecha_ultima_lectura
                FROM sensores
                ORDER BY id
            """)
            sensores = cursor.fetchall()

            for sensor in sensores:
                if sensor['fecha_instalacion']:
                    sensor['fecha_instalacion'] = sensor['fecha_instalacion'].isoformat()
                if sensor['fecha_ultima_lectura']:
                    sensor['fecha_ultima_lectura'] = sensor['fecha_ultima_lectura'].isoformat()

            return jsonify({
                'success': True,
                'sensores': sensores,
                'total': len(sensores)
            }), 200

        finally:
            cursor.close()
            connection.close()

    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error obteniendo sensores'
        }), 500


@sensores_bp.route('/lecturas-recientes', methods=['GET'])
def lecturas_recientes():
    esp32_id = request.args.get('esp32_id', '').strip()
    if not esp32_id:
        return jsonify({'success': False, 'message': 'Falta esp32_id'}), 400
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id FROM sensores WHERE esp32_id = %s LIMIT 1", (esp32_id,))
        row = cursor.fetchone()
        if not row:
            return jsonify({'success': False, 'message': 'Sensor no encontrado', 'lecturas': []}), 404
        sensor_id = row['id']
        cursor.execute("""
            SELECT tipo_lectura, valor, unidad, timestamp
            FROM lecturas_sensores
            WHERE sensor_id = %s
            ORDER BY timestamp DESC LIMIT 9
        """, (sensor_id,))
        lecturas = cursor.fetchall()
        conn.close()
        for l in lecturas:
            if l['timestamp']:
                l['timestamp'] = l['timestamp'].isoformat()
            l['valor'] = float(l['valor'])
        return jsonify({'success': True, 'esp32_id': esp32_id, 'lecturas': lecturas})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@sensores_bp.route('/<int:sensor_id>/lecturas', methods=['GET'])
def obtener_lecturas(sensor_id):
    try:
        limite = request.args.get('limite', 100, type=int)
        tipo = request.args.get('tipo', None)

        connection = get_db_connection()
        cursor = connection.cursor()

        try:
            if tipo:
                cursor.execute("""
                    SELECT id, sensor_id, tipo_lectura, valor, unidad, timestamp, calidad_dato
                    FROM lecturas_sensores
                    WHERE sensor_id = %s AND tipo_lectura = %s
                    ORDER BY timestamp DESC
                    LIMIT %s
                """, (sensor_id, tipo, limite))
            else:
                cursor.execute("""
                    SELECT id, sensor_id, tipo_lectura, valor, unidad, timestamp, calidad_dato
                    FROM lecturas_sensores
                    WHERE sensor_id = %s
                    ORDER BY timestamp DESC
                    LIMIT %s
                """, (sensor_id, limite))

            lecturas = cursor.fetchall()

            for lectura in lecturas:
                if lectura['timestamp']:
                    lectura['timestamp'] = lectura['timestamp'].isoformat()
                lectura['valor'] = float(lectura['valor'])

            return jsonify({
                'success': True,
                'sensor_id': sensor_id,
                'lecturas': lecturas,
                'total': len(lecturas)
            }), 200

        finally:
            cursor.close()
            connection.close()

    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error obteniendo lecturas'
        }), 500


@sensores_bp.route('/esp32/<esp32_id>/estado', methods=['GET'])
def estado_sensor_por_esp32(esp32_id):
    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        try:
            cursor.execute("""
                SELECT id, cultivo_id, nombre, tipo, modelo, esp32_id, ubicacion,
                       estado, fecha_instalacion, fecha_ultima_lectura
                FROM sensores WHERE esp32_id = %s
            """, (esp32_id,))
            sensor = cursor.fetchone()

            if not sensor:
                return jsonify({
                    'success': False,
                    'message': 'Sensor no encontrado'
                }), 404

            sensor_id = sensor['id']

            if sensor['fecha_instalacion']:
                sensor['fecha_instalacion'] = sensor['fecha_instalacion'].isoformat()
            if sensor['fecha_ultima_lectura']:
                sensor['fecha_ultima_lectura'] = sensor['fecha_ultima_lectura'].isoformat()

            cursor.execute("""
                SELECT tipo_lectura, valor, unidad, timestamp
                FROM lecturas_sensores ls1
                WHERE sensor_id = %s
                AND timestamp = (
                    SELECT MAX(timestamp)
                    FROM lecturas_sensores ls2
                    WHERE ls2.sensor_id = ls1.sensor_id
                    AND ls2.tipo_lectura = ls1.tipo_lectura
                )
            """, (sensor_id,))

            ultimas_lecturas = []
            for lectura in cursor.fetchall():
                ultimas_lecturas.append({
                    'tipo_lectura': lectura['tipo_lectura'],
                    'valor': float(lectura['valor']),
                    'unidad': lectura['unidad'],
                    'timestamp': lectura['timestamp'].isoformat() if lectura['timestamp'] else None
                })

            ahora = datetime.now()
            conectado = False
            if ultimas_lecturas:
                ts_str = max(l['timestamp'] for l in ultimas_lecturas if l['timestamp'])
                if ts_str:
                    ultima = datetime.fromisoformat(ts_str)
                    conectado = (ahora - ultima).total_seconds() < 30

            return jsonify({
                'success': True,
                'sensor': sensor,
                'ultimas_lecturas': ultimas_lecturas,
                'conectado': conectado,
            }), 200

        finally:
            cursor.close()
            connection.close()

    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error obteniendo estado'
        }), 500


@sensores_bp.route('/<int:sensor_id>/estado', methods=['GET'])
def estado_sensor(sensor_id):
    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        try:
            cursor.execute("""
                SELECT id, cultivo_id, nombre, tipo, modelo, esp32_id, ubicacion,
                       estado, fecha_instalacion, fecha_ultima_lectura
                FROM sensores WHERE id = %s
            """, (sensor_id,))
            sensor = cursor.fetchone()

            if not sensor:
                return jsonify({
                    'success': False,
                    'message': 'Sensor no encontrado'
                }), 404

            if sensor['fecha_instalacion']:
                sensor['fecha_instalacion'] = sensor['fecha_instalacion'].isoformat()
            if sensor['fecha_ultima_lectura']:
                sensor['fecha_ultima_lectura'] = sensor['fecha_ultima_lectura'].isoformat()

            cursor.execute("""
                SELECT tipo_lectura, valor, unidad, timestamp
                FROM lecturas_sensores ls1
                WHERE sensor_id = %s
                AND timestamp = (
                    SELECT MAX(timestamp)
                    FROM lecturas_sensores ls2
                    WHERE ls2.sensor_id = ls1.sensor_id
                    AND ls2.tipo_lectura = ls1.tipo_lectura
                )
            """, (sensor_id,))

            ultimas_lecturas = []
            for lectura in cursor.fetchall():
                ultimas_lecturas.append({
                    'tipo_lectura': lectura['tipo_lectura'],
                    'valor': float(lectura['valor']),
                    'unidad': lectura['unidad'],
                    'timestamp': lectura['timestamp'].isoformat() if lectura['timestamp'] else None
                })

            return jsonify({
                'success': True,
                'sensor': sensor,
                'ultimas_lecturas': ultimas_lecturas
            }), 200

        finally:
            cursor.close()
            connection.close()

    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error obteniendo estado'
        }), 500


def verificar_umbrales(sensor_id, lecturas: dict) -> list:
    UMBRALES = {
        'temperatura_aire': {'min': 5.0,  'max': 38.0,  'unidad': '°C'},
        'humedad_aire':     {'min': 30.0, 'max': 95.0,  'unidad': '%'},
        'humedad_suelo':    {'min': 20.0, 'max': 90.0,  'unidad': '%'},
    }

    alertas = []
    for tipo, valor in lecturas.items():
        if tipo not in UMBRALES or valor is None:
            continue
        umbral = UMBRALES[tipo]
        nivel = None
        if valor < umbral['min']:
            nivel = 'bajo'
        elif valor > umbral['max']:
            nivel = 'alto'

        if nivel:
            alertas.append({
                'sensor_id': sensor_id,
                'tipo': tipo,
                'valor': valor,
                'nivel': nivel,
                'umbral': umbral,
                'timestamp': datetime.now().isoformat(),
            })

    return alertas


@sensores_bp.route('/simular-datos', methods=['POST'])
def simular_datos():
    import random
    from datetime import timedelta
    from flask_jwt_extended import verify_jwt_in_request

    try:
        verify_jwt_in_request()
    except Exception:
        return jsonify({'success': False, 'message': 'Token inválido o expirado'}), 401

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        try:
            cursor.execute("SELECT id FROM sensores WHERE estado = 'activo' ORDER BY id LIMIT 1")
            result = cursor.fetchone()

            if not result:
                return jsonify({'success': False, 'message': 'No hay sensores activos para simular datos'}), 404

            sensor_id = result['id']

            lecturas_generadas = 0
            base_time = datetime.now()

            for i in range(30):
                timestamp = base_time - timedelta(seconds=30 * (29 - i))

                temp = round(18 + random.uniform(-3, 5), 1)
                cursor.execute("""
                    INSERT INTO lecturas_sensores (sensor_id, tipo_lectura, valor, unidad, timestamp, calidad_dato)
                    VALUES (%s, 'temperatura_aire', %s, 'Celsius', %s, 'bueno')
                """, (sensor_id, temp, timestamp))
                lecturas_generadas += 1

                hum_aire = round(65 + random.uniform(-10, 10), 1)
                cursor.execute("""
                    INSERT INTO lecturas_sensores (sensor_id, tipo_lectura, valor, unidad, timestamp, calidad_dato)
                    VALUES (%s, 'humedad_aire', %s, '%%', %s, 'bueno')
                """, (sensor_id, hum_aire, timestamp))
                lecturas_generadas += 1

                hum_suelo = round(70 + random.uniform(-10, 10), 0)
                cursor.execute("""
                    INSERT INTO lecturas_sensores (sensor_id, tipo_lectura, valor, unidad, timestamp, calidad_dato)
                    VALUES (%s, 'humedad_suelo', %s, '%%', %s, 'bueno')
                """, (sensor_id, hum_suelo, timestamp))
                lecturas_generadas += 1

            cursor.execute(
                "UPDATE sensores SET fecha_ultima_lectura = %s WHERE id = %s",
                (base_time, sensor_id)
            )

            connection.commit()

            return jsonify({
                'success': True,
                'message': 'Datos de simulacion generados exitosamente',
                'sensor_id': sensor_id,
                'lecturas_generadas': lecturas_generadas,
                'timestamp': base_time.isoformat()
            }), 201

        finally:
            cursor.close()
            connection.close()

    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error generando datos de simulacion'
        }), 500


@sensores_bp.route('/pendientes', methods=['GET'])
def listar_pendientes():
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        try:
            cursor.execute("""
                SELECT id, nombre, tipo, modelo, esp32_id, ubicacion,
                       estado, fecha_instalacion, fecha_ultima_lectura
                FROM sensores
                WHERE cultivo_id IS NULL AND estado = 'pendiente'
                ORDER BY fecha_ultima_lectura DESC NULLS LAST
            """)
            pendientes = cursor.fetchall()
            for s in pendientes:
                if s['fecha_instalacion']:
                    s['fecha_instalacion'] = s['fecha_instalacion'].isoformat()
                if s['fecha_ultima_lectura']:
                    s['fecha_ultima_lectura'] = s['fecha_ultima_lectura'].isoformat()

            return jsonify({
                'success': True,
                'pendientes': pendientes,
                'total': len(pendientes)
            }), 200
        finally:
            cursor.close()
            connection.close()
    except Exception as e:
        return jsonify({'success': False, 'message': 'Error interno del servidor'}), 500


@sensores_bp.route('/mis-dispositivos', methods=['GET'])
def mis_dispositivos():
    try:
        from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
        usuario_id = None
        try:
            verify_jwt_in_request(optional=True)
            identity = get_jwt_identity()
            usuario_id = int(identity) if identity else None
        except Exception:
            pass

        connection = get_db_connection()
        cursor = connection.cursor()
        try:
            if usuario_id:
                cursor.execute("""
                    SELECT s.id, s.cultivo_id, s.nombre, s.tipo, s.modelo,
                           s.esp32_id, s.ubicacion, s.estado,
                           s.fecha_instalacion, s.fecha_ultima_lectura,
                           c.nombre AS cultivo_nombre
                    FROM sensores s
                    JOIN cultivos c ON s.cultivo_id = c.id
                    WHERE c.usuario_id = %s AND s.estado != 'pendiente'
                    ORDER BY s.fecha_ultima_lectura DESC NULLS LAST
                """, (usuario_id,))
            else:
                cursor.execute("""
                    SELECT s.id, s.cultivo_id, s.nombre, s.tipo, s.modelo,
                           s.esp32_id, s.ubicacion, s.estado,
                           s.fecha_instalacion, s.fecha_ultima_lectura,
                           c.nombre AS cultivo_nombre
                    FROM sensores s
                    JOIN cultivos c ON s.cultivo_id = c.id
                    WHERE s.estado = 'activo'
                    ORDER BY s.fecha_ultima_lectura DESC NULLS LAST
                """)

            sensores = cursor.fetchall()
            ahora = datetime.now()
            for s in sensores:
                if s['fecha_instalacion']:
                    s['fecha_instalacion'] = s['fecha_instalacion'].isoformat()
                ult = s['fecha_ultima_lectura']
                if ult:
                    s['fecha_ultima_lectura'] = ult.isoformat()
                    s['conectado'] = (ahora - ult).total_seconds() < 60
                else:
                    s['conectado'] = False

            return jsonify({
                'success': True,
                'dispositivos': sensores,
                'total': len(sensores)
            }), 200
        finally:
            cursor.close()
            connection.close()
    except Exception as e:
        return jsonify({'success': False, 'message': 'Error interno del servidor'}), 500


@sensores_bp.route('/<int:sensor_id>/vincular', methods=['POST'])
def vincular_sensor(sensor_id):
    try:
        data = request.get_json() or {}
        cultivo_id = data.get('cultivo_id')
        nombre = data.get('nombre')
        ubicacion = data.get('ubicacion')

        if not cultivo_id:
            return jsonify({'success': False, 'message': 'cultivo_id es requerido'}), 400

        connection = get_db_connection()
        cursor = connection.cursor()
        try:
            cursor.execute("SELECT id, nombre, esp32_id FROM sensores WHERE id = %s", (sensor_id,))
            sensor = cursor.fetchone()
            if not sensor:
                return jsonify({'success': False, 'message': 'Sensor no encontrado'}), 404

            cursor.execute("SELECT id, nombre FROM cultivos WHERE id = %s", (cultivo_id,))
            cultivo = cursor.fetchone()
            if not cultivo:
                return jsonify({'success': False, 'message': 'Cultivo no encontrado'}), 404

            nuevo_nombre = nombre or sensor['nombre']
            nueva_ubicacion = ubicacion or 'Campo principal'

            cursor.execute("""
                UPDATE sensores
                SET cultivo_id = %s,
                    nombre = %s,
                    ubicacion = %s,
                    estado = 'activo'
                WHERE id = %s
            """, (cultivo_id, nuevo_nombre, nueva_ubicacion, sensor_id))
            connection.commit()

            return jsonify({
                'success': True,
                'message': f'Dispositivo {sensor["esp32_id"]} vinculado al cultivo "{cultivo["nombre"]}"',
                'sensor_id': sensor_id,
                'cultivo_id': cultivo_id
            }), 200
        finally:
            cursor.close()
            connection.close()
    except Exception as e:
        return jsonify({'success': False, 'message': 'Error interno del servidor'}), 500


@sensores_bp.route('/<int:sensor_id>/configurar', methods=['PUT'])
def configurar_sensor(sensor_id):
    try:
        data = request.get_json() or {}
        connection = get_db_connection()
        cursor = connection.cursor()
        try:
            cursor.execute("SELECT id FROM sensores WHERE id = %s", (sensor_id,))
            if not cursor.fetchone():
                return jsonify({'success': False, 'message': 'Sensor no encontrado'}), 404

            campos = []
            valores = []
            if 'nombre' in data:
                campos.append("nombre = %s")
                valores.append(data['nombre'])
            if 'ubicacion' in data:
                campos.append("ubicacion = %s")
                valores.append(data['ubicacion'])
            if 'estado' in data and data['estado'] in ('activo', 'inactivo', 'mantenimiento'):
                campos.append("estado = %s")
                valores.append(data['estado'])

            if not campos:
                return jsonify({'success': False, 'message': 'No hay campos para actualizar'}), 400

            valores.append(sensor_id)
            cursor.execute(f"UPDATE sensores SET {', '.join(campos)} WHERE id = %s", valores)
            connection.commit()

            return jsonify({'success': True, 'message': 'Dispositivo actualizado correctamente'}), 200
        finally:
            cursor.close()
            connection.close()
    except Exception as e:
        return jsonify({'success': False, 'message': 'Error interno del servidor'}), 500


@sensores_bp.route('/<int:sensor_id>/desvincular', methods=['POST'])
def desvincular_sensor(sensor_id):
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        try:
            cursor.execute("SELECT id, nombre, esp32_id FROM sensores WHERE id = %s", (sensor_id,))
            sensor = cursor.fetchone()
            if not sensor:
                return jsonify({'success': False, 'message': 'Sensor no encontrado'}), 404

            cursor.execute("""
                UPDATE sensores
                SET cultivo_id = NULL,
                    estado = 'pendiente',
                    ubicacion = 'Sin asignar'
                WHERE id = %s
            """, (sensor_id,))
            connection.commit()

            return jsonify({
                'success': True,
                'message': f'Dispositivo {sensor["esp32_id"]} desvinculado correctamente. '
                           f'Aparecera como pendiente hasta ser asignado de nuevo.',
                'sensor_id': sensor_id,
                'esp32_id': sensor['esp32_id']
            }), 200
        finally:
            cursor.close()
            connection.close()
    except Exception as e:
        return jsonify({'success': False, 'message': 'Error interno del servidor'}), 500


@sensores_bp.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'success': True,
        'message': 'Servicio de sensores operativo',
        'timestamp': datetime.now().isoformat()
    }), 200


@sensores_bp.route('/<int:sensor_id>/estadisticas', methods=['GET'])
def obtener_estadisticas_sensor(sensor_id):
    try:
        periodo = request.args.get('periodo', 'last_day')

        if periodo == 'last_hour':
            tiempo_sql = "timestamp >= NOW() - INTERVAL '1 hour'"
        elif periodo == 'last_week':
            tiempo_sql = "timestamp >= NOW() - INTERVAL '1 week'"
        elif periodo == 'last_month':
            tiempo_sql = "timestamp >= NOW() - INTERVAL '1 month'"
        else:
            tiempo_sql = "timestamp >= NOW() - INTERVAL '1 day'"

        connection = get_db_connection()
        cursor = connection.cursor()

        try:
            estadisticas = {}

            cursor.execute(f"""
                SELECT
                    tipo_lectura,
                    COUNT(*) as total_lecturas,
                    AVG(valor) as promedio,
                    MIN(valor) as minimo,
                    MAX(valor) as maximo,
                    STDDEV(valor) as desviacion_estandar
                FROM lecturas_sensores
                WHERE sensor_id = %s AND {tiempo_sql}
                GROUP BY tipo_lectura
            """, (sensor_id,))

            for row in cursor.fetchall():
                estadisticas[row['tipo_lectura']] = {
                    'total_lecturas': row['total_lecturas'],
                    'promedio': round(float(row['promedio']) if row['promedio'] else 0, 2),
                    'minimo': round(float(row['minimo']) if row['minimo'] else 0, 2),
                    'maximo': round(float(row['maximo']) if row['maximo'] else 0, 2),
                    'desviacion_estandar': round(float(row['desviacion_estandar']) if row['desviacion_estandar'] else 0, 2)
                }

            cursor.execute(f"""
                SELECT tipo_lectura, valor, timestamp
                FROM lecturas_sensores
                WHERE sensor_id = %s AND {tiempo_sql}
                ORDER BY timestamp DESC
                LIMIT 50
            """, (sensor_id,))

            tendencias = {}
            for row in cursor.fetchall():
                tipo = row['tipo_lectura']
                if tipo not in tendencias:
                    tendencias[tipo] = []
                tendencias[tipo].append({
                    'valor': float(row['valor']),
                    'timestamp': row['timestamp'].isoformat()
                })

            return jsonify({
                'success': True,
                'sensor_id': sensor_id,
                'periodo': periodo,
                'estadisticas': estadisticas,
                'tendencias': tendencias,
                'timestamp': datetime.now().isoformat()
            }), 200

        finally:
            cursor.close()
            connection.close()

    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error obteniendo estadísticas'
        }), 500


@sensores_bp.route('/resumen', methods=['GET'])
def resumen_global():
    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        try:
            cursor.execute("SELECT COUNT(*) as total FROM sensores WHERE estado = 'activo'")
            total_sensores = cursor.fetchone()['total']

            cursor.execute("""
                SELECT COUNT(DISTINCT sensor_id) as activos
                FROM lecturas_sensores
                WHERE timestamp >= NOW() - INTERVAL '1 hour'
            """)
            sensores_activos = cursor.fetchone()['activos']

            cursor.execute("""
                SELECT COUNT(*) as total
                FROM lecturas_sensores
                WHERE DATE(timestamp) = CURRENT_DATE
            """)
            lecturas_hoy = cursor.fetchone()['total']

            cursor.execute("""
                SELECT s.id, s.nombre, s.esp32_id, s.tipo,
                       MAX(ls.timestamp) as ultima_lectura
                FROM sensores s
                LEFT JOIN lecturas_sensores ls ON s.id = ls.sensor_id
                WHERE s.estado = 'activo'
                GROUP BY s.id
                ORDER BY ultima_lectura DESC
            """)
            sensores_info = []
            for row in cursor.fetchall():
                sensores_info.append({
                    'id': row['id'],
                    'nombre': row['nombre'],
                    'esp32_id': row['esp32_id'],
                    'tipo': row['tipo'],
                    'ultima_lectura': row['ultima_lectura'].isoformat() if row['ultima_lectura'] else None,
                    'estado_conexion': 'online' if row['ultima_lectura'] and
                        (datetime.now() - row['ultima_lectura']).total_seconds() < 300 else 'offline'
                })

            return jsonify({
                'success': True,
                'resumen': {
                    'total_sensores': total_sensores,
                    'sensores_activos': sensores_activos,
                    'lecturas_hoy': lecturas_hoy
                },
                'sensores': sensores_info,
                'timestamp': datetime.now().isoformat()
            }), 200

        finally:
            cursor.close()
            connection.close()

    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error obteniendo resumen'
        }), 500


@sensores_bp.route('/<int:sensor_id>/grafica', methods=['GET'])
def datos_grafica(sensor_id):
    try:
        tipo = request.args.get('tipo', 'temperatura_aire')
        periodo = request.args.get('periodo', 'last_day')
        puntos = request.args.get('puntos', 100, type=int)

        if periodo == 'last_hour':
            tiempo_sql = "timestamp >= NOW() - INTERVAL '1 hour'"
        else:
            tiempo_sql = "timestamp >= NOW() - INTERVAL '1 day'"

        connection = get_db_connection()
        cursor = connection.cursor()

        try:
            cursor.execute(f"""
                SELECT valor, timestamp
                FROM lecturas_sensores
                WHERE sensor_id = %s AND tipo_lectura = %s AND {tiempo_sql}
                ORDER BY timestamp DESC
                LIMIT %s
            """, (sensor_id, tipo, puntos))

            datos = []
            for row in cursor.fetchall():
                datos.append({
                    'x': row['timestamp'].isoformat(),
                    'y': float(row['valor'])
                })

            datos.reverse()

            return jsonify({
                'success': True,
                'sensor_id': sensor_id,
                'tipo_lectura': tipo,
                'datos': datos,
                'total_puntos': len(datos)
            }), 200

        finally:
            cursor.close()
            connection.close()

    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error obteniendo datos de gráfica'
        }), 500
