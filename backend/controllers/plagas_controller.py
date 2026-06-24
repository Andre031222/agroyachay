import os
from flask import Blueprint, request, jsonify, make_response
from werkzeug.utils import secure_filename
from datetime import datetime
from app.services.plantid_service import PlantIDService
from app.services.groq_service import consejo_plaga, detectar_plaga_vision
from db import get_db_connection

plagas_bp = Blueprint('plagas', __name__)

UPLOAD_FOLDER = 'uploads/plagas'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@plagas_bp.route('/detectar', methods=['POST'])
def detectar_plaga():
    connection = None
    try:
        if 'imagen' not in request.files:
            return jsonify({'success': False, 'message': 'No se proporcionó imagen'}), 400

        file = request.files['imagen']
        _cid = request.form.get('cultivo_id')
        cultivo_id = int(_cid) if _cid and _cid.strip() else None

        if file.filename == '':
            return jsonify({'success': False, 'message': 'Nombre de archivo vacío'}), 400

        if file and allowed_file(file.filename):
            os.makedirs(UPLOAD_FOLDER, exist_ok=True)
            filename = secure_filename(f"{datetime.utcnow().timestamp()}_{file.filename}")
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            file.save(filepath)

            resultado = PlantIDService.identify_disease(filepath)

            if not resultado:
                return jsonify({'success': False, 'message': 'No se pudo analizar la imagen'}), 500

            connection = get_db_connection()
            cursor = connection.cursor()

            try:
                nombre_plaga = resultado['nombre']
                confianza = round(resultado['confianza'], 2)
                tratamiento = resultado.get('tratamiento', '')
                descripcion = resultado.get('descripcion', '')
                causas = resultado.get('causas', '')
                prevencion = resultado.get('prevencion', '')
                is_healthy = resultado.get('is_healthy', False)

                if is_healthy:
                    severidad = 'leve'
                elif confianza >= 70:
                    severidad = 'severa'
                elif confianza >= 40:
                    severidad = 'moderada'
                else:
                    severidad = 'leve'

                recomendaciones = f"{descripcion}\n\nCausas: {causas}\n\nTratamiento: {tratamiento}\n\nPrevención: {prevencion}"

                cursor.execute("""
                    INSERT INTO detecciones_plagas
                    (cultivo_id, tipo_plaga, confianza, severidad, recomendaciones, imagen_path, tratamiento_aplicado)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    RETURNING id, fecha_deteccion
                """, (cultivo_id, nombre_plaga, confianza, severidad, recomendaciones,
                      f'uploads/plagas/{filename}', False))

                result = cursor.fetchone()
                deteccion_id = result['id']
                fecha_deteccion = result['fecha_deteccion']
                connection.commit()

            finally:
                cursor.close()

            return jsonify({
                'success': True,
                'message': 'Detección completada y guardada',
                'data': {
                    'id': deteccion_id,
                    'cultivo_id': cultivo_id,
                    'nombre_plaga': nombre_plaga,
                    'confianza': confianza,
                    'severidad': severidad,
                    'is_healthy': is_healthy,
                    'descripcion': descripcion,
                    'causas': causas,
                    'tratamiento': tratamiento,
                    'prevencion': prevencion,
                    'imagen_url': f'/uploads/plagas/{filename}',
                    'fecha_deteccion': fecha_deteccion.isoformat()
                }
            }), 201

        return jsonify({'success': False, 'message': 'Tipo de archivo no permitido'}), 400

    except Exception as e:
        if connection:
            connection.rollback()
        return jsonify({'success': False, 'message': 'Error interno del servidor'}), 500

    finally:
        if connection:
            connection.close()


@plagas_bp.route('/detectar-groq', methods=['POST'])
def detectar_con_groq():
    connection = None
    try:
        if 'imagen' not in request.files:
            return jsonify({'success': False, 'message': 'No se proporcionó imagen'}), 400

        file = request.files['imagen']
        _cid = request.form.get('cultivo_id')
        cultivo_id     = int(_cid) if _cid and _cid.strip() else None
        cultivo_nombre = request.form.get('cultivo_nombre', '')

        if not file.filename:
            return jsonify({'success': False, 'message': 'Archivo vacío'}), 400

        if file and allowed_file(file.filename):
            os.makedirs(UPLOAD_FOLDER, exist_ok=True)
            filename = secure_filename(f"{datetime.utcnow().timestamp()}_{file.filename}")
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            file.save(filepath)

            vision_result = detectar_plaga_vision(filepath, cultivo_nombre)

            if not vision_result['success']:
                return jsonify({'success': False, 'message': f"Error de IA: {vision_result['error']}"}), 503

            r = vision_result['resultado']
            nombre_plaga = r.get('nombre', 'Desconocido')
            confianza    = float(r.get('confianza', 70))
            is_healthy   = bool(r.get('is_healthy', False))
            descripcion  = r.get('descripcion', '')
            causas       = r.get('causas', '')
            tratamiento  = r.get('tratamiento', '')
            prevencion   = r.get('prevencion', '')

            if is_healthy:
                severidad = 'leve'
            elif confianza >= 70:
                severidad = 'severa'
            elif confianza >= 40:
                severidad = 'moderada'
            else:
                severidad = 'leve'

            recomendaciones = f"{descripcion}\n\nCausas: {causas}\n\nTratamiento: {tratamiento}\n\nPrevención: {prevencion}"

            connection = get_db_connection()
            cursor     = connection.cursor()
            cursor.execute("""
                INSERT INTO detecciones_plagas
                    (cultivo_id, tipo_plaga, confianza, severidad, recomendaciones, imagen_path, tratamiento_aplicado)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id, fecha_deteccion
            """, (cultivo_id, nombre_plaga, confianza, severidad, recomendaciones,
                  f'uploads/plagas/{filename}', False))
            row = cursor.fetchone()
            connection.commit()
            cursor.close()

            return jsonify({
                'success': True,
                'message': 'Detección completada con Groq Vision',
                'data': {
                    'id':           row['id'],
                    'cultivo_id':   cultivo_id,
                    'nombre_plaga': nombre_plaga,
                    'confianza':    round(confianza, 1),
                    'severidad':    severidad,
                    'is_healthy':   is_healthy,
                    'descripcion':  descripcion,
                    'causas':       causas,
                    'tratamiento':  tratamiento,
                    'prevencion':   prevencion,
                    'imagen_url':   f'/uploads/plagas/{filename}',
                    'fecha_deteccion': row['fecha_deteccion'].isoformat(),
                    'fuente':       'groq_vision',
                }
            }), 201

        return jsonify({'success': False, 'message': 'Tipo de archivo no permitido'}), 400

    except Exception as e:
        if connection:
            connection.rollback()
        return jsonify({'success': False, 'message': 'Error interno del servidor'}), 500
    finally:
        if connection:
            connection.close()


@plagas_bp.route('/biblioteca', methods=['GET'])
def biblioteca_plagas():
    try:
        plagas_comunes = [
            {
                'nombre': 'Gorgojo de los Andes',
                'nombre_cientifico': 'Premnotrypes spp.',
                'cultivos_afectados': ['Papa', 'Oca'],
                'sintomas': 'Galerías en tubérculos, larvas blancas',
                'tratamiento': 'Control cultural y químico',
                'prevencion': 'Rotación de cultivos, eliminación de residuos'
            },
            {
                'nombre': 'Rancha o Tizón Tardío',
                'nombre_cientifico': 'Phytophthora infestans',
                'cultivos_afectados': ['Papa', 'Tomate'],
                'sintomas': 'Manchas necróticas en hojas, pudrición de tubérculos',
                'tratamiento': 'Fungicidas específicos',
                'prevencion': 'Variedades resistentes, manejo de humedad'
            },
            {
                'nombre': 'Polilla de la Papa',
                'nombre_cientifico': 'Phthorimaea operculella',
                'cultivos_afectados': ['Papa'],
                'sintomas': 'Minas en hojas, galerías en tubérculos',
                'tratamiento': 'Trampas de feromonas, control biológico',
                'prevencion': 'Aporque alto, cosecha oportuna'
            },
            {
                'nombre': 'Cogollero del Maíz',
                'nombre_cientifico': 'Spodoptera frugiperda',
                'cultivos_afectados': ['Maíz'],
                'sintomas': 'Daño en cogollo, defoliación',
                'tratamiento': 'Insecticidas selectivos, control biológico',
                'prevencion': 'Monitoreo constante, enemigos naturales'
            }
        ]
        resp = make_response(jsonify({'success': True, 'data': plagas_comunes}), 200)
        resp.headers['Cache-Control'] = 'public, max-age=3600'
        return resp
    except Exception as e:
        return jsonify({'success': False, 'message': 'Error interno del servidor'}), 500


@plagas_bp.route('/detecciones', methods=['GET'])
def get_detecciones():
    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        try:
            cursor.execute("""
                SELECT id, cultivo_id, tipo_plaga, confianza, severidad,
                       recomendaciones, imagen_path, tratamiento_aplicado, fecha_deteccion
                FROM detecciones_plagas
                ORDER BY fecha_deteccion DESC
                LIMIT 50
            """)

            detecciones = cursor.fetchall()

            for det in detecciones:
                if det['fecha_deteccion']:
                    det['fecha_deteccion'] = det['fecha_deteccion'].isoformat()
                if det['confianza']:
                    det['confianza'] = float(det['confianza'])

            return jsonify({'success': True, 'data': detecciones}), 200

        finally:
            cursor.close()
            connection.close()

    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error obteniendo detecciones'
        }), 500


@plagas_bp.route('/cultivo/<int:cultivo_id>', methods=['GET'])
def get_detecciones_cultivo(cultivo_id):
    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        try:
            cursor.execute("""
                SELECT id, cultivo_id, tipo_plaga, confianza, severidad,
                       recomendaciones, imagen_path, tratamiento_aplicado, fecha_deteccion
                FROM detecciones_plagas
                WHERE cultivo_id = %s
                ORDER BY fecha_deteccion DESC
            """, (cultivo_id,))

            detecciones = cursor.fetchall()

            for det in detecciones:
                if det['fecha_deteccion']:
                    det['fecha_deteccion'] = det['fecha_deteccion'].isoformat()
                if det['confianza']:
                    det['confianza'] = float(det['confianza'])

            return jsonify({'success': True, 'data': detecciones}), 200

        finally:
            cursor.close()
            connection.close()

    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error obteniendo detecciones'
        }), 500


@plagas_bp.route('/consejo-ia', methods=['POST'])
def consejo_ia():
    try:
        data = request.get_json()
        if not data or not data.get('nombre_plaga'):
            return jsonify({'success': False, 'message': 'El campo "nombre_plaga" es requerido'}), 400

        resultado = consejo_plaga(data)

        if not resultado['success']:
            return jsonify({'success': False, 'message': resultado['error']}), 503

        return jsonify({
            'success': True,
            'data': resultado['consejo'],
            'modelo': 'llama-3.3-70b-versatile'
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'message': 'Error interno del servidor'}), 500
