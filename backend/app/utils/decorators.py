from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from app.models.user import Usuario

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        try:
            verify_jwt_in_request()
            return f(*args, **kwargs)
        except Exception:
            return jsonify({
                'success': False,
                'message': 'Token inválido o expirado'
            }), 401
    return decorated

def get_current_user():
    try:
        user_id = get_jwt_identity()
        return Usuario.query.get(user_id)
    except Exception:
        return None
