import os
import json
from functools import wraps
from datetime import datetime

import bcrypt
from flask import Blueprint, request, jsonify, send_file, make_response
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from werkzeug.utils import secure_filename
from db import get_db_connection as get_db

superadmin_bp = Blueprint('superadmin', __name__)

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), '..', 'uploads', 'config')
ALLOWED_IMAGE_EXT = {'png', 'jpg', 'jpeg', 'gif', 'ico', 'webp', 'svg'}

PUBLIC_KEYS = {
    'site_name', 'site_tagline', 'hero_title', 'hero_description', 'hero_cta',
    'ecosystem_title', 'ecosystem_description',
    'announcement_enabled', 'announcement_text', 'announcement_color',
    'nav_items',
    'footer_description', 'footer_institution', 'footer_contact', 'footer_copyright',
    'social_twitter', 'social_facebook', 'social_instagram', 'social_linkedin',
    'maintenance_mode', 'maintenance_message',
    'ga4_id',
    'logo', 'favicon', 'institution_logo', 'cover_image',
}


def _allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_IMAGE_EXT


def require_superadmin(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        claims = get_jwt()
        if claims.get('rol') != 'superadmin':
            return jsonify({'success': False, 'message': 'Acceso restringido a SuperAdmin'}), 403
        return fn(*args, **kwargs)
    return wrapper


def require_admin(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        claims = get_jwt()
        if claims.get('rol') not in ('admin', 'superadmin'):
            return jsonify({'success': False, 'message': 'Acceso restringido a administradores'}), 403
        return fn(*args, **kwargs)
    return wrapper


@superadmin_bp.route('/public/config', methods=['GET'])
def get_public_config():
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            "SELECT config_key, config_value, es_imagen FROM system_config WHERE config_key = ANY(%s)",
            (list(PUBLIC_KEYS),)
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()

        result = {}
        for row in rows:
            key = row['config_key']
            if row['es_imagen']:
                fname = row['config_value'] or ''
                fpath = os.path.join(UPLOAD_DIR, fname)
                result[key] = fname if fname and os.path.exists(fpath) else ''
            else:
                result[key] = row['config_value'] or ''

        resp = make_response(jsonify({'success': True, 'data': result}), 200)
        resp.headers['Cache-Control'] = 'public, max-age=60'
        return resp
    except Exception as e:
        return jsonify({'success': False, 'message': 'Error interno del servidor'}), 500


@superadmin_bp.route('/public/config/image/<key>', methods=['GET'])
def serve_config_image(key):
    allowed_image_keys = {'logo', 'favicon', 'institution_logo', 'cover_image'}
    if key not in allowed_image_keys:
        return jsonify({'success': False, 'message': 'Clave de imagen no valida'}), 400

    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT config_value FROM system_config WHERE config_key = %s", (key,))
        row = cur.fetchone()
        cur.close()
        conn.close()

        if not row or not row['config_value']:
            return jsonify({'success': False, 'message': 'Imagen no configurada'}), 404

        fpath = os.path.join(UPLOAD_DIR, row['config_value'])
        if not os.path.exists(fpath):
            return jsonify({'success': False, 'message': 'Archivo no encontrado'}), 404

        return send_file(fpath)
    except Exception as e:
        return jsonify({'success': False, 'message': 'Error interno del servidor'}), 500


@superadmin_bp.route('/admin/users', methods=['GET'])
@require_admin
def list_users():
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("""
            SELECT id, nombre, email, rol, activo, telefono,
                   fecha_registro, ultimo_acceso
            FROM usuarios
            ORDER BY fecha_registro DESC
        """)
        users = [dict(r) for r in cur.fetchall()]
        cur.close()
        conn.close()

        for u in users:
            for f in ('fecha_registro', 'ultimo_acceso'):
                if u.get(f):
                    u[f] = u[f].isoformat()

        return jsonify({'success': True, 'data': {'users': users, 'total': len(users)}}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': 'Error interno del servidor'}), 500


@superadmin_bp.route('/admin/users/<int:user_id>/role', methods=['PUT'])
@require_admin
def change_user_role(user_id):
    try:
        claims   = get_jwt()
        caller_rol = claims.get('rol')
        current_id = int(get_jwt_identity())

        data     = request.get_json()
        new_role = data.get('rol', '').strip()

        if caller_rol == 'superadmin':
            allowed_targets = ('superadmin', 'admin', 'agricultor', 'usuario')
        else:
            allowed_targets = ('agricultor', 'usuario')

        if new_role not in allowed_targets:
            return jsonify({'success': False, 'message': 'Rol no permitido para tu nivel de acceso'}), 403

        if current_id == user_id:
            return jsonify({'success': False, 'message': 'No puedes cambiar tu propio rol'}), 400

        conn = get_db()
        cur  = conn.cursor()
        cur.execute("SELECT rol FROM usuarios WHERE id = %s", (user_id,))
        target = cur.fetchone()
        if not target:
            cur.close(); conn.close()
            return jsonify({'success': False, 'message': 'Usuario no encontrado'}), 404

        if caller_rol != 'superadmin' and target['rol'] in ('superadmin', 'admin'):
            cur.close(); conn.close()
            return jsonify({'success': False, 'message': 'Sin permisos para modificar este usuario'}), 403

        cur.execute("UPDATE usuarios SET rol = %s WHERE id = %s", (new_role, user_id))
        conn.commit()
        cur.close(); conn.close()
        return jsonify({'success': True, 'message': f'Rol actualizado a {new_role}'}), 200
    except Exception:
        return jsonify({'success': False, 'message': 'Error interno del servidor'}), 500


@superadmin_bp.route('/admin/users/<int:user_id>/toggle', methods=['PUT'])
@require_admin
def toggle_user_active(user_id):
    try:
        claims     = get_jwt()
        caller_rol = claims.get('rol')
        current_id = int(get_jwt_identity())

        if current_id == user_id:
            return jsonify({'success': False, 'message': 'No puedes desactivarte a ti mismo'}), 400

        conn = get_db()
        cur  = conn.cursor()
        cur.execute("SELECT rol FROM usuarios WHERE id = %s", (user_id,))
        target = cur.fetchone()
        if not target:
            cur.close(); conn.close()
            return jsonify({'success': False, 'message': 'Usuario no encontrado'}), 404

        if caller_rol != 'superadmin' and target['rol'] in ('superadmin', 'admin'):
            cur.close(); conn.close()
            return jsonify({'success': False, 'message': 'Sin permisos para modificar este usuario'}), 403

        cur.execute("UPDATE usuarios SET activo = NOT activo WHERE id = %s RETURNING activo", (user_id,))
        row = cur.fetchone()
        conn.commit()
        cur.close(); conn.close()
        estado = 'activado' if row['activo'] else 'desactivado'
        return jsonify({'success': True, 'message': f'Usuario {estado}', 'activo': row['activo']}), 200
    except Exception:
        return jsonify({'success': False, 'message': 'Error interno del servidor'}), 500


@superadmin_bp.route('/admin/users/<int:user_id>/reset-password', methods=['PUT'])
@require_admin
def reset_user_password(user_id):
    try:
        claims     = get_jwt()
        caller_rol = claims.get('rol')

        data         = request.get_json()
        new_password = data.get('new_password', '')
        if len(new_password) < 8:
            return jsonify({'success': False, 'message': 'La contraseña debe tener al menos 8 caracteres'}), 400

        conn = get_db()
        cur  = conn.cursor()
        cur.execute("SELECT rol FROM usuarios WHERE id = %s", (user_id,))
        target = cur.fetchone()
        if not target:
            cur.close(); conn.close()
            return jsonify({'success': False, 'message': 'Usuario no encontrado'}), 404

        if caller_rol != 'superadmin' and target['rol'] in ('superadmin', 'admin'):
            cur.close(); conn.close()
            return jsonify({'success': False, 'message': 'Sin permisos para modificar este usuario'}), 403

        password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        cur.execute("UPDATE usuarios SET password_hash = %s WHERE id = %s", (password_hash, user_id))
        conn.commit()
        cur.close(); conn.close()
        return jsonify({'success': True, 'message': 'Contraseña actualizada'}), 200
    except Exception:
        return jsonify({'success': False, 'message': 'Error interno del servidor'}), 500


@superadmin_bp.route('/admin/super/config', methods=['GET'])
@require_superadmin
def get_all_config():
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT config_key, config_value, descripcion, tipo, es_imagen, actualizado_en FROM system_config ORDER BY config_key")
        rows = cur.fetchall()
        cur.close(); conn.close()

        result = {}
        for row in rows:
            entry = dict(row)
            if entry.get('actualizado_en'):
                entry['actualizado_en'] = entry['actualizado_en'].isoformat()
            result[row['config_key']] = entry

        return jsonify({'success': True, 'data': result}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': 'Error interno del servidor'}), 500


@superadmin_bp.route('/admin/super/config', methods=['POST'])
@require_superadmin
def save_config():
    try:
        data = request.get_json()
        if not isinstance(data, dict):
            return jsonify({'success': False, 'message': 'Se esperaba un objeto JSON'}), 400

        current_id = get_jwt_identity()
        conn = get_db()
        cur = conn.cursor()

        for key, value in data.items():
            if isinstance(value, (dict, list)):
                value = json.dumps(value, ensure_ascii=False)
            cur.execute("""
                INSERT INTO system_config (config_key, config_value, actualizado_en, actualizado_por)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (config_key) DO UPDATE
                  SET config_value = EXCLUDED.config_value,
                      actualizado_en = EXCLUDED.actualizado_en,
                      actualizado_por = EXCLUDED.actualizado_por
            """, (key, str(value), datetime.utcnow(), current_id))

        conn.commit()
        cur.close(); conn.close()
        return jsonify({'success': True, 'message': f'{len(data)} clave(s) guardada(s)'}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': 'Error interno del servidor'}), 500


@superadmin_bp.route('/admin/super/config/upload/<key>', methods=['POST'])
@require_superadmin
def upload_config_image(key):
    allowed_image_keys = {'logo', 'favicon', 'institution_logo', 'cover_image'}
    if key not in allowed_image_keys:
        return jsonify({'success': False, 'message': 'Clave de imagen no valida'}), 400

    if 'file' not in request.files:
        return jsonify({'success': False, 'message': 'No se envio ningun archivo'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'success': False, 'message': 'Archivo sin nombre'}), 400

    if not _allowed_file(file.filename):
        return jsonify({'success': False, 'message': f'Extension no permitida. Usa: {ALLOWED_IMAGE_EXT}'}), 400

    os.makedirs(UPLOAD_DIR, exist_ok=True)

    ext = file.filename.rsplit('.', 1)[1].lower()
    filename = f"{key}.{ext}"
    fpath = os.path.join(UPLOAD_DIR, filename)
    file.save(fpath)

    current_id = get_jwt_identity()
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO system_config (config_key, config_value, es_imagen, tipo, actualizado_en, actualizado_por)
        VALUES (%s, %s, TRUE, 'image', %s, %s)
        ON CONFLICT (config_key) DO UPDATE
          SET config_value = EXCLUDED.config_value,
              actualizado_en = EXCLUDED.actualizado_en,
              actualizado_por = EXCLUDED.actualizado_por
    """, (key, filename, datetime.utcnow(), current_id))
    conn.commit()
    cur.close(); conn.close()

    return jsonify({
        'success': True,
        'message': 'Imagen subida correctamente',
        'filename': filename,
        'url': f'/api/public/config/image/{key}'
    }), 200


@superadmin_bp.route('/admin/super/config/reset', methods=['POST'])
@require_superadmin
def reset_config():
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("""
            UPDATE system_config
            SET config_value = CASE
                WHEN config_key IN ('maintenance_mode','announcement_enabled') THEN 'false'
                WHEN config_key = 'announcement_color' THEN '#10b981'
                WHEN config_key = 'nav_items' THEN '[]'
                ELSE ''
            END,
            actualizado_en = %s
            WHERE es_imagen = FALSE
        """, (datetime.utcnow(),))
        conn.commit()
        cur.close(); conn.close()
        return jsonify({'success': True, 'message': 'Configuracion restablecida a valores por defecto'}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': 'Error interno del servidor'}), 500


@superadmin_bp.route('/admin/super/promote', methods=['POST'])
def promote_first_superadmin():
    try:
        conn = get_db()
        cur = conn.cursor()

        cur.execute("SELECT id FROM usuarios WHERE rol = 'superadmin' LIMIT 1")
        if cur.fetchone():
            cur.close(); conn.close()
            return jsonify({'success': False, 'message': 'Ya existe un superadmin. Usa el panel para gestionar roles.'}), 409

        data = request.get_json()
        email = (data.get('email') or '').strip()
        password = (data.get('password') or '').strip()
        nombre = (data.get('nombre') or 'SuperAdmin').strip()

        if not email or not password:
            return jsonify({'success': False, 'message': 'Email y contrasena requeridos'}), 400
        if len(password) < 8:
            return jsonify({'success': False, 'message': 'Contrasena minima de 8 caracteres'}), 400

        cur.execute("SELECT id FROM usuarios WHERE email = %s", (email,))
        existing = cur.fetchone()

        if existing:
            cur.execute("UPDATE usuarios SET rol = 'superadmin' WHERE id = %s RETURNING id", (existing['id'],))
            conn.commit()
            cur.close(); conn.close()
            return jsonify({'success': True, 'message': f'Usuario {email} promovido a superadmin'}), 200

        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        cur.execute("""
            INSERT INTO usuarios (nombre, email, password_hash, rol, activo)
            VALUES (%s, %s, %s, 'superadmin', TRUE) RETURNING id
        """, (nombre, email, password_hash))
        user_id = cur.fetchone()['id']
        conn.commit()
        cur.close(); conn.close()

        return jsonify({'success': True, 'message': 'SuperAdmin creado exitosamente', 'user_id': user_id}), 201
    except Exception as e:
        return jsonify({'success': False, 'message': 'Error interno del servidor'}), 500
