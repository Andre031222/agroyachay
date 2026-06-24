from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from db import get_db_connection

cultivos_bp = Blueprint('cultivos', __name__)


def _user_id():
    try:
        verify_jwt_in_request()
        return int(get_jwt_identity())
    except Exception:
        return None


@cultivos_bp.route('', methods=['GET', 'OPTIONS'])
@cultivos_bp.route('/', methods=['GET', 'OPTIONS'])
@jwt_required()
def list_cultivos():
    if request.method == 'OPTIONS':
        return '', 200
    try:
        uid = int(get_jwt_identity())
        conn = get_db_connection()
        cur  = conn.cursor()
        cur.execute("""
            SELECT id, usuario_id, nombre, tipo_cultivo, variedad,
                   area_hectareas, ubicacion, fecha_siembra,
                   fecha_cosecha_estimada, estado, descripcion,
                   fecha_creacion, fecha_actualizacion
            FROM cultivos
            WHERE usuario_id = %s
            ORDER BY fecha_creacion DESC
        """, (uid,))
        rows = cur.fetchall()
        cur.close(); conn.close()

        cultivos = []
        for c in rows:
            row = dict(c)
            for f in ('fecha_siembra', 'fecha_cosecha_estimada', 'fecha_creacion', 'fecha_actualizacion'):
                if row.get(f):
                    row[f] = row[f].isoformat()
            if row.get('area_hectareas') is not None:
                row['area_hectareas'] = float(row['area_hectareas'])
                row['area'] = row['area_hectareas']
            cultivos.append(row)

        return jsonify({'success': True, 'data': cultivos}), 200
    except Exception:
        return jsonify({'success': False, 'message': 'Error obteniendo cultivos'}), 500


@cultivos_bp.route('', methods=['POST'])
@cultivos_bp.route('/', methods=['POST'])
@jwt_required()
def create_cultivo():
    try:
        uid  = int(get_jwt_identity())
        data = request.get_json()

        nombre       = (data.get('nombre') or '').strip()
        tipo_cultivo = (data.get('tipo_cultivo') or '').strip()
        variedad     = (data.get('variedad') or '').strip()
        area         = data.get('area_hectareas') or data.get('area')
        ubicacion    = (data.get('ubicacion') or '').strip()
        fecha_siembra           = data.get('fecha_siembra') or None
        fecha_cosecha_estimada  = data.get('fecha_cosecha_estimada') or None
        estado       = data.get('estado', 'planificado')
        descripcion  = (data.get('descripcion') or data.get('notas') or '').strip()

        if not nombre or not tipo_cultivo:
            return jsonify({'success': False, 'message': 'Nombre y tipo de cultivo son requeridos'}), 400

        conn = get_db_connection()
        cur  = conn.cursor()
        cur.execute("""
            INSERT INTO cultivos
                (usuario_id, nombre, tipo_cultivo, variedad, area_hectareas,
                 ubicacion, fecha_siembra, fecha_cosecha_estimada, estado, descripcion)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, fecha_creacion
        """, (uid, nombre, tipo_cultivo, variedad or None, area,
              ubicacion or None, fecha_siembra, fecha_cosecha_estimada,
              estado, descripcion or None))

        row = cur.fetchone()
        conn.commit()
        cur.close(); conn.close()

        return jsonify({
            'success': True,
            'message': 'Cultivo creado',
            'data': {
                'id':          row['id'],
                'usuario_id':  uid,
                'nombre':      nombre,
                'tipo_cultivo':tipo_cultivo,
                'variedad':    variedad,
                'area_hectareas': float(area) if area else None,
                'area':        float(area) if area else None,
                'ubicacion':   ubicacion,
                'fecha_siembra': fecha_siembra,
                'estado':      estado,
                'descripcion': descripcion,
                'fecha_creacion': row['fecha_creacion'].isoformat(),
            }
        }), 201
    except Exception:
        return jsonify({'success': False, 'message': 'Error creando cultivo'}), 500


@cultivos_bp.route('/<int:cultivo_id>', methods=['GET'])
@jwt_required()
def get_cultivo(cultivo_id):
    try:
        uid = int(get_jwt_identity())
        conn = get_db_connection()
        cur  = conn.cursor()
        cur.execute("""
            SELECT id, usuario_id, nombre, tipo_cultivo, variedad,
                   area_hectareas, ubicacion, fecha_siembra,
                   fecha_cosecha_estimada, estado, descripcion,
                   fecha_creacion
            FROM cultivos WHERE id = %s AND usuario_id = %s
        """, (cultivo_id, uid))
        row = cur.fetchone()
        cur.close(); conn.close()

        if not row:
            return jsonify({'success': False, 'message': 'Cultivo no encontrado'}), 404

        c = dict(row)
        for f in ('fecha_siembra', 'fecha_cosecha_estimada', 'fecha_creacion'):
            if c.get(f): c[f] = c[f].isoformat()
        if c.get('area_hectareas') is not None:
            c['area_hectareas'] = float(c['area_hectareas'])
            c['area'] = c['area_hectareas']
        return jsonify({'success': True, 'data': c}), 200
    except Exception:
        return jsonify({'success': False, 'message': 'Error obteniendo cultivo'}), 500


@cultivos_bp.route('/<int:cultivo_id>', methods=['PUT'])
@jwt_required()
def update_cultivo(cultivo_id):
    try:
        uid  = int(get_jwt_identity())
        data = request.get_json()

        sets, vals = [], []
        fields = {
            'nombre':                  data.get('nombre'),
            'tipo_cultivo':            data.get('tipo_cultivo'),
            'variedad':                data.get('variedad'),
            'area_hectareas':          data.get('area_hectareas') or data.get('area'),
            'ubicacion':               data.get('ubicacion'),
            'fecha_siembra':           data.get('fecha_siembra'),
            'fecha_cosecha_estimada':  data.get('fecha_cosecha_estimada'),
            'estado':                  data.get('estado'),
            'descripcion':             data.get('descripcion') or data.get('notas'),
        }
        for col, val in fields.items():
            if val is not None:
                sets.append(f'{col} = %s')
                vals.append(val)

        if not sets:
            return jsonify({'success': False, 'message': 'Sin campos para actualizar'}), 400

        sets.append('fecha_actualizacion = CURRENT_TIMESTAMP')
        vals.extend([cultivo_id, uid])

        conn = get_db_connection()
        cur  = conn.cursor()
        cur.execute(f"UPDATE cultivos SET {', '.join(sets)} WHERE id = %s AND usuario_id = %s", vals)
        updated = cur.rowcount
        conn.commit()
        cur.close(); conn.close()

        if not updated:
            return jsonify({'success': False, 'message': 'Cultivo no encontrado'}), 404
        return jsonify({'success': True, 'message': 'Cultivo actualizado'}), 200
    except Exception:
        return jsonify({'success': False, 'message': 'Error actualizando cultivo'}), 500


@cultivos_bp.route('/<int:cultivo_id>', methods=['DELETE'])
@jwt_required()
def delete_cultivo(cultivo_id):
    try:
        uid = int(get_jwt_identity())
        conn = get_db_connection()
        cur  = conn.cursor()
        cur.execute("DELETE FROM cultivos WHERE id = %s AND usuario_id = %s", (cultivo_id, uid))
        deleted = cur.rowcount
        conn.commit()
        cur.close(); conn.close()

        if not deleted:
            return jsonify({'success': False, 'message': 'Cultivo no encontrado'}), 404
        return jsonify({'success': True, 'message': 'Cultivo eliminado'}), 200
    except Exception:
        return jsonify({'success': False, 'message': 'Error eliminando cultivo'}), 500


@cultivos_bp.route('/tipos', methods=['GET'])
def get_tipos_cultivo():
    tipos = ['Papa', 'Quinua', 'Cañihua', 'Maíz', 'Habas', 'Tarwi', 'Oca', 'Olluco', 'Mashua', 'Cebada']
    return jsonify({'success': True, 'data': tipos}), 200


@cultivos_bp.route('/estadisticas', methods=['GET'])
@jwt_required()
def estadisticas_cultivos():
    try:
        uid  = int(get_jwt_identity())
        conn = get_db_connection()
        cur  = conn.cursor()

        cur.execute("SELECT COUNT(*) AS total FROM cultivos WHERE usuario_id = %s", (uid,))
        total = cur.fetchone()['total']

        cur.execute("SELECT estado, COUNT(*) AS n FROM cultivos WHERE usuario_id = %s GROUP BY estado", (uid,))
        por_estado = {r['estado']: r['n'] for r in cur.fetchall()}

        cur.execute("SELECT tipo_cultivo, COUNT(*) AS n FROM cultivos WHERE usuario_id = %s GROUP BY tipo_cultivo ORDER BY n DESC", (uid,))
        por_tipo = {r['tipo_cultivo']: r['n'] for r in cur.fetchall()}

        cur.execute("SELECT COALESCE(SUM(area_hectareas), 0) AS area FROM cultivos WHERE usuario_id = %s", (uid,))
        area_total = float(cur.fetchone()['area'])

        cur.close(); conn.close()
        return jsonify({'success': True, 'data': {'total_cultivos': total, 'area_total_hectareas': area_total, 'por_estado': por_estado, 'por_tipo': por_tipo}}), 200
    except Exception:
        return jsonify({'success': False, 'message': 'Error obteniendo estadísticas'}), 500


@cultivos_bp.route('/<int:cultivo_id>', methods=['OPTIONS'])
def cultivo_options(cultivo_id):
    return '', 200
