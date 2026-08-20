from flask import Blueprint, request, jsonify, send_from_directory, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import datetime
import glob
import os
import re
import bcrypt
import requests
import secrets
from werkzeug.utils import secure_filename
from db import get_db_connection
from app.i18n import translate as _

_AVATAR_DIR  = os.path.join(os.path.dirname(__file__), '..', 'uploads', 'avatars')
_AVATAR_EXT  = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

_EMAIL_RE = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        username = (data.get('email') or data.get('username') or '').strip()
        password    = data.get('password', '')
        remember_me = bool(data.get('remember_me', False))

        if not username or not password:
            return jsonify({
                'success': False,
                'message': _('email_y_contrasena_requeridos')
            }), 400

        connection = get_db_connection()
        if not connection:
            return jsonify({
                'success': False,
                'message': _('error_de_conexion_a_la_base')
            }), 500

        cursor = connection.cursor()

        cursor.execute("""
            SELECT id, nombre, email, password_hash, rol, activo, telefono, avatar
            FROM usuarios
            WHERE email = %s AND activo = TRUE
        """, (username,))

        user = cursor.fetchone()

        if not user:
            cursor.close()
            connection.close()
            return jsonify({
                'success': False,
                'message': _('credenciales_invalidas')
            }), 401

        password_hash = user['password_hash']

        if not password_hash.startswith('$2b$'):
            cursor.close()
            connection.close()
            return jsonify({'success': False, 'message': _('credenciales_invalidas')}), 401

        password_match = bcrypt.checkpw(
            password.encode('utf-8'),
            password_hash.encode('utf-8')
        )

        if not password_match:
            cursor.close()
            connection.close()
            current_app.audit('login_failed', f"email={username}")
            return jsonify({
                'success': False,
                'message': _('credenciales_invalidas')
            }), 401

        expires = datetime.timedelta(days=30) if remember_me else datetime.timedelta(hours=24)
        token = create_access_token(
            identity=str(user['id']),
            additional_claims={'email': user['email'], 'rol': user['rol']},
            expires_delta=expires
        )

        user_data = {
            'id':           user['id'],
            'nombre':       user['nombre'],
            'email':        user['email'],
            'rol':          user['rol'],
            'telefono':     user['telefono'] or '',
            'avatar':       user.get('avatar') or '',
            'google_avatar':user.get('google_avatar') or '',
        }

        cursor.close()
        connection.close()

        current_app.audit('login_success', f"user_id={user['id']}")
        return jsonify({
            'success': True,
            'message': _('login_exitoso'),
            'data': {
                'token': token,
                'user': user_data
            }
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'message': _('error_interno_del_servidor')
        }), 500


@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()

        nombre = data.get('nombre', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        telefono = data.get('telefono', '').strip()

        if not nombre or not email or not password:
            return jsonify({
                'success': False,
                'message': _('nombre_email_y_contrasena_son_requeridos')
            }), 400

        if not _EMAIL_RE.match(email):
            return jsonify({'success': False, 'message': _('formato_de_email_invalido')}), 400

        if len(password) < 8:
            return jsonify({'success': False, 'message': _('la_contrasena_debe_tener_al_menos')}), 400

        connection = get_db_connection()
        if not connection:
            return jsonify({
                'success': False,
                'message': _('error_de_conexion_a_la_base')
            }), 500

        cursor = connection.cursor()

        cursor.execute("SELECT id FROM usuarios WHERE email = %s", (email,))
        if cursor.fetchone():
            cursor.close()
            connection.close()
            return jsonify({
                'success': False,
                'message': _('el_email_ya_esta_registrado')
            }), 409

        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        cursor.execute("""
            INSERT INTO usuarios (nombre, email, password_hash, telefono)
            VALUES (%s, %s, %s, %s)
            RETURNING id
        """, (nombre, email, password_hash, telefono))

        row = cursor.fetchone()
        user_id = row['id']
        connection.commit()

        cursor.execute(
            "SELECT id, nombre, email, rol, telefono, avatar FROM usuarios WHERE id = %s",
            (user_id,)
        )
        new_user = cursor.fetchone()

        token = create_access_token(
            identity=str(new_user['id']),
            additional_claims={'email': new_user['email'], 'rol': new_user['rol']},
            expires_delta=datetime.timedelta(hours=24)
        )

        cursor.close()
        connection.close()

        return jsonify({
            'success': True,
            'message': _('usuario_registrado_exitosamente'),
            'data': {
                'token': token,
                'user': {
                    'id':       new_user['id'],
                    'nombre':   new_user['nombre'],
                    'email':    new_user['email'],
                    'rol':      new_user['rol'],
                    'telefono': new_user['telefono'] or '',
                    'avatar':   new_user.get('avatar') or '',
                }
            }
        }), 201

    except Exception:
        return jsonify({
            'success': False,
            'message': _('error_al_registrar_usuario')
        }), 500


@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    try:
        current_user_id = get_jwt_identity()
        connection = get_db_connection()
        if not connection:
            return jsonify({
                'success': False,
                'message': _('error_de_conexion_a_la_base')
            }), 500

        cursor = connection.cursor()

        cursor.execute("""
            SELECT id, nombre, email, rol, telefono, fecha_registro, activo, avatar
            FROM usuarios
            WHERE id = %s
        """, (current_user_id,))

        user = cursor.fetchone()

        cursor.close()
        connection.close()

        if not user:
            return jsonify({
                'success': False,
                'message': _('usuario_no_encontrado')
            }), 404

        return jsonify({
            'success': True,
            'data': {
                'user': user
            }
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'message': _('error_interno_del_servidor')
        }), 500


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    try:
        return jsonify({
            'success': True,
            'message': _('sesion_cerrada_exitosamente')
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': _('error_interno_del_servidor')
        }), 500


@auth_bp.route('/verify', methods=['GET'])
@jwt_required()
def verify_token():
    try:
        current_user_id = get_jwt_identity()
        connection = get_db_connection()
        if not connection:
            return jsonify({
                'success': False,
                'message': _('error_de_conexion')
            }), 500

        cursor = connection.cursor()
        cursor.execute("""
            SELECT id, nombre, email, rol
            FROM usuarios
            WHERE id = %s AND activo = TRUE
        """, (current_user_id,))

        user = cursor.fetchone()
        cursor.close()
        connection.close()

        if not user:
            return jsonify({
                'success': False,
                'message': _('usuario_no_encontrado')
            }), 404

        return jsonify({
            'success': True,
            'data': {
                'user': user
            }
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'message': _('error_interno_del_servidor')
        }), 500


@auth_bp.route('/google', methods=['POST', 'OPTIONS'])
def google_auth():
    if request.method == 'OPTIONS':
        return '', 200

    try:
        data = request.get_json()
        access_token = data.get('token')

        if not access_token:
            return jsonify({
                'success': False,
                'message': _('token_de_google_requerido')
            }), 400

        google_user_info_url = 'https://www.googleapis.com/oauth2/v2/userinfo'
        headers = {'Authorization': f'Bearer {access_token}'}

        response = requests.get(google_user_info_url, headers=headers)

        if response.status_code != 200:
            return jsonify({
                'success': False,
                'message': _('token_de_google_invalido')
            }), 401

        google_user = response.json()
        email       = google_user.get('email')
        nombre      = google_user.get('given_name') or (google_user.get('name', '') or '').split()[0] or 'Usuario'
        google_id   = google_user.get('id')
        avatar      = google_user.get('picture')

        if not email:
            return jsonify({
                'success': False,
                'message': _('no_se_pudo_obtener_el_email')
            }), 400

        connection = get_db_connection()
        if not connection:
            return jsonify({
                'success': False,
                'message': _('error_de_conexion_a_la_base')
            }), 500

        cursor = connection.cursor()

        cursor.execute("""
            SELECT id, nombre, email, rol, telefono, avatar, google_avatar
            FROM usuarios WHERE email = %s
        """, (email,))
        user = cursor.fetchone()

        is_new = not user

        if is_new:
            password_hash = bcrypt.hashpw(
                secrets.token_urlsafe(32).encode('utf-8'),
                bcrypt.gensalt()
            ).decode('utf-8')

            cursor.execute("""
                INSERT INTO usuarios (nombre, email, password_hash, rol, activo, telefono, google_id, avatar, google_avatar)
                VALUES (%s, %s, %s, 'usuario', TRUE, '', %s, %s, %s)
                RETURNING id
            """, (nombre, email, password_hash, google_id, avatar, avatar))

            user_id = cursor.fetchone()['id']
            connection.commit()

            cursor.execute("""
                SELECT id, nombre, email, rol, telefono, avatar, google_avatar
                FROM usuarios WHERE id = %s
            """, (user_id,))
            user = cursor.fetchone()
        else:
            is_custom = user.get('avatar') and not user['avatar'].startswith('https://')
            if is_custom:
                cursor.execute(
                    "UPDATE usuarios SET google_id = %s, google_avatar = %s WHERE id = %s",
                    (google_id, avatar, user['id'])
                )
            else:
                cursor.execute(
                    "UPDATE usuarios SET google_id = %s, avatar = %s, google_avatar = %s WHERE id = %s",
                    (google_id, avatar, avatar, user['id'])
                )
            connection.commit()
            cursor.execute("""
                SELECT id, nombre, email, rol, telefono, avatar, google_avatar
                FROM usuarios WHERE id = %s
            """, (user['id'],))
            user = cursor.fetchone()

        token = create_access_token(
            identity=str(user['id']),
            additional_claims={
                'email': user['email'],
                'rol': user['rol']
            },
            expires_delta=datetime.timedelta(hours=24)
        )

        user_data = {
            'id':           user['id'],
            'nombre':       user['nombre'],
            'email':        user['email'],
            'rol':          user['rol'],
            'telefono':     user.get('telefono', '') or '',
            'avatar':       user.get('avatar') or '',
            'google_avatar':user.get('google_avatar') or '',
        }

        cursor.close()
        connection.close()

        return jsonify({
            'success': True,
            'message': _('autenticacion_con_google_exitosa'),
            'data': {
                'token': token,
                'user': user_data,
                'is_new_user': is_new
            }
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'message': _('error_interno_del_servidor')
        }), 500


@auth_bp.route('/update-name', methods=['PUT'])
@jwt_required()
def update_name():
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        nombre = (data.get('nombre') or '').strip()

        if not nombre or len(nombre) < 2:
            return jsonify({'success': False, 'message': _('el_nombre_debe_tener_al_menos')}), 400

        connection = get_db_connection()
        if not connection:
            return jsonify({'success': False, 'message': _('error_de_conexion_40')}), 500

        cursor = connection.cursor()
        cursor.execute('UPDATE usuarios SET nombre = %s WHERE id = %s', (nombre, current_user_id))
        connection.commit()
        cursor.execute('SELECT id, nombre, email, rol, telefono FROM usuarios WHERE id = %s', (current_user_id,))
        user = dict(cursor.fetchone())
        cursor.close()
        connection.close()

        return jsonify({'success': True, 'data': {'user': user}}), 200

    except Exception:
        return jsonify({'success': False, 'message': _('error_interno_del_servidor')}), 500


@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    try:
        user_id  = int(get_jwt_identity())
        data     = request.get_json()
        nombre   = (data.get('nombre') or '').strip()
        telefono = (data.get('telefono') or '').strip()

        if nombre and len(nombre) < 2:
            return jsonify({'success': False, 'message': _('el_nombre_debe_tener_al_menos')}), 400

        connection = get_db_connection()
        cursor     = connection.cursor()

        sets, params = [], []
        if nombre:
            sets.append('nombre = %s');   params.append(nombre)
        if telefono is not None:
            sets.append('telefono = %s'); params.append(telefono)
        if sets:
            params.append(user_id)
            cursor.execute(f"UPDATE usuarios SET {', '.join(sets)} WHERE id = %s", params)
            connection.commit()

        cursor.execute(
            "SELECT id, nombre, email, rol, telefono, avatar, google_avatar FROM usuarios WHERE id = %s",
            (user_id,)
        )
        user = dict(cursor.fetchone())
        cursor.close(); connection.close()
        return jsonify({'success': True, 'data': {'user': user}}), 200
    except Exception:
        return jsonify({'success': False, 'message': _('error_interno_del_servidor')}), 500


@auth_bp.route('/change-password', methods=['PUT'])
@jwt_required()
def change_password():
    try:
        user_id     = int(get_jwt_identity())
        data        = request.get_json()
        current_pwd = data.get('current_password', '')
        new_pwd     = data.get('new_password', '')

        if len(new_pwd) < 8:
            return jsonify({'success': False, 'message': _('la_nueva_contrasena_debe_tener_al')}), 400

        connection = get_db_connection()
        cursor     = connection.cursor()
        cursor.execute("SELECT password_hash FROM usuarios WHERE id = %s", (user_id,))
        row = cursor.fetchone()
        if not row:
            cursor.close(); connection.close()
            return jsonify({'success': False, 'message': _('usuario_no_encontrado')}), 404

        ph = row['password_hash']
        if ph.startswith('$2b$') and current_pwd:
            if not bcrypt.checkpw(current_pwd.encode('utf-8'), ph.encode('utf-8')):
                cursor.close(); connection.close()
                return jsonify({'success': False, 'message': _('contrasena_actual_incorrecta')}), 401

        new_hash = bcrypt.hashpw(new_pwd.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        cursor.execute("UPDATE usuarios SET password_hash = %s WHERE id = %s", (new_hash, user_id))
        connection.commit()
        cursor.close(); connection.close()
        return jsonify({'success': True, 'message': _('contrasena_actualizada')}), 200
    except Exception:
        return jsonify({'success': False, 'message': _('error_interno_del_servidor')}), 500


@auth_bp.route('/avatar', methods=['GET'])
def list_avatars():
    return jsonify({'success': False, 'message': _('method_not_allowed')}), 405


@auth_bp.route('/avatar/<path:filename>', methods=['GET'])
def serve_avatar(filename):
    return send_from_directory(_AVATAR_DIR, filename)


@auth_bp.route('/avatar', methods=['POST'])
@jwt_required()
def upload_avatar():
    try:
        user_id = get_jwt_identity()
        if 'file' not in request.files:
            return jsonify({'success': False, 'message': _('no_se_envio_archivo')}), 400

        file = request.files['file']
        if not file or not file.filename:
            return jsonify({'success': False, 'message': _('archivo_vacio')}), 400

        ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else ''
        if ext not in _AVATAR_EXT:
            return jsonify({'success': False, 'message': _('formato_no_permitido_png_jpg_webp')}), 400

        os.makedirs(_AVATAR_DIR, exist_ok=True)
        for old in glob.glob(os.path.join(_AVATAR_DIR, f'av_{user_id}.*')):
            try: os.remove(old)
            except OSError: pass

        filename = f'av_{user_id}.{ext}'
        file.save(os.path.join(_AVATAR_DIR, filename))

        connection = get_db_connection()
        cursor     = connection.cursor()
        cursor.execute("UPDATE usuarios SET avatar = %s WHERE id = %s", (filename, int(user_id)))
        connection.commit()
        cursor.close(); connection.close()

        return jsonify({'success': True, 'data': {'avatar': filename}}), 200
    except Exception:
        return jsonify({'success': False, 'message': _('error_interno_del_servidor')}), 500


@auth_bp.route('/avatar', methods=['DELETE'])
@jwt_required()
def revert_avatar():
    try:
        user_id    = int(get_jwt_identity())
        connection = get_db_connection()
        cursor     = connection.cursor()
        cursor.execute("SELECT google_avatar FROM usuarios WHERE id = %s", (user_id,))
        row        = cursor.fetchone()
        new_avatar = (row['google_avatar'] or '') if row else ''
        cursor.execute("UPDATE usuarios SET avatar = %s WHERE id = %s", (new_avatar, user_id))
        connection.commit()
        cursor.close(); connection.close()
        return jsonify({'success': True, 'data': {'avatar': new_avatar}}), 200
    except Exception:
        return jsonify({'success': False, 'message': _('error_interno_del_servidor')}), 500
