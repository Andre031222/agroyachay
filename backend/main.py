import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_compress import Compress
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
Compress(app)

@app.after_request
def set_security_headers(response):
    response.headers['Cross-Origin-Opener-Policy'] = 'same-origin-allow-popups'
    return response

_default_origins = [
    "http://localhost:3000",
    "http://localhost:3002",
    "http://localhost:5000",
    "http://localhost:5174",
    "http://localhost:5175",
]
# En producción se añade el dominio público vía CORS_ORIGINS / FRONTEND_URL.
_extra_origins = [
    o.strip() for o in os.getenv('CORS_ORIGINS', os.getenv('FRONTEND_URL', '')).split(',')
    if o.strip()
]
_allowed_origins = _default_origins + _extra_origins

CORS(app, resources={
    r"/api/*": {
        "origins": _allowed_origins,
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

_secret_key = os.getenv('SECRET_KEY')
_jwt_secret_key = os.getenv('JWT_SECRET_KEY')
if not _secret_key or not _jwt_secret_key:
    raise RuntimeError('SECRET_KEY y JWT_SECRET_KEY deben estar definidos en las variables de entorno')
app.config['SECRET_KEY'] = _secret_key
app.config['JWT_SECRET_KEY'] = _jwt_secret_key
app.config['JWT_TOKEN_LOCATION'] = ['headers']
app.config['JWT_HEADER_NAME'] = 'Authorization'
app.config['JWT_HEADER_TYPE'] = 'Bearer'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

_db_user = os.getenv('DB_USER', 'postgres')
_db_pass = os.getenv('DB_PASSWORD', '')
_db_host = os.getenv('DB_HOST', 'localhost')
_db_port = os.getenv('DB_PORT', '5432')
_db_name = os.getenv('DB_NAME', 'as_terrasense')
app.config['SQLALCHEMY_DATABASE_URI'] = (
    f'postgresql+psycopg2://{_db_user}:{_db_pass}@{_db_host}:{_db_port}/{_db_name}'
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'pool_size': 10,
    'pool_timeout': 30,
    'pool_recycle': 1800,
    'max_overflow': 20,
    'pool_pre_ping': True,
}

from app.models import db
db.init_app(app)

from flask_jwt_extended import JWTManager
jwt = JWTManager(app)

@jwt.invalid_token_loader
def invalid_token_callback(error_string):
    return jsonify({
        'success': False,
        'message': f'Token inválido: {error_string}'
    }), 422

@jwt.unauthorized_loader
def missing_token_callback(error_string):
    return jsonify({
        'success': False,
        'message': f'Token faltante: {error_string}'
    }), 401

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({
        'success': False,
        'message': 'El token ha expirado'
    }), 401

@jwt.revoked_token_loader
def revoked_token_callback(jwt_header, jwt_payload):
    return jsonify({
        'success': False,
        'message': 'El token ha sido revocado'
    }), 401

from controllers.auth_controller import auth_bp
from controllers.clima_controller import clima_bp
from controllers.plagas_controller import plagas_bp
from controllers.cultivos_controller import cultivos_bp
from controllers.sensores_controller import sensores_bp
from controllers.asistente_controller import asistente_bp
from controllers.serial_controller import serial_bp
from controllers.superadmin_controller import superadmin_bp
from app.routes.insumos import insumos_bp
from app.routes.prediccion import prediccion_bp
from app.routes.asesoria import asesoria_bp
from app.routes.marketplace import marketplace_bp
from app.routes.informes import informes_bp

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(clima_bp, url_prefix='/api/clima')
app.register_blueprint(plagas_bp, url_prefix='/api/plagas')
app.register_blueprint(cultivos_bp, url_prefix='/api/cultivos')
app.register_blueprint(sensores_bp, url_prefix='/api/sensores')
app.register_blueprint(asistente_bp, url_prefix='/api/asistente')
app.register_blueprint(serial_bp, url_prefix='/api/serial')
app.register_blueprint(superadmin_bp, url_prefix='/api')
app.register_blueprint(insumos_bp, url_prefix='/api/insumos')
app.register_blueprint(prediccion_bp, url_prefix='/api/prediccion')
app.register_blueprint(asesoria_bp, url_prefix='/api/asesoria')
app.register_blueprint(marketplace_bp, url_prefix='/api/marketplace')
app.register_blueprint(informes_bp, url_prefix='/api/informes')

@app.route('/')
def home():
    return {
        'message': 'AgroYachay API v2.0',
        'status': 'running',
        'endpoints': {
            'auth': '/api/auth',
            'clima': '/api/clima',
            'plagas': '/api/plagas',
            'cultivos': '/api/cultivos',
            'sensores': '/api/sensores',
            'insumos': '/api/insumos',
            'prediccion': '/api/prediccion',
            'asesoria': '/api/asesoria',
            'marketplace': '/api/marketplace',
            'informes': '/api/informes'
        }
    }

@app.route('/health')
def health():
    return jsonify({
        'status': 'healthy',
        'message': 'AgroYachay API is running'
    }), 200

if __name__ == '__main__':
    print("\n" + "=" * 60)
    print("AgroYachay Backend API v2.0 - Iniciado Correctamente")
    print("=" * 60)
    print("Server: http://localhost:5000")
    print("Health: http://localhost:5000/health")
    print("API Home: http://localhost:5000/")
    print("\n[OK] FEATURES ACTIVAS:")
    print("   - Prediccion de Cosecha IA")
    print("   - Asesoria Especializada (con notificacion por email)")
    print("   - Marketplace de Productos")
    print("   - Generacion de Informes PDF con Graficos Avanzados")
    print("   - Generacion de Informes EXCEL con Tablas Dinamicas")
    print("   - Sistema de Notificaciones por Email")
    print("=" * 60)
    print("Presiona Ctrl+C para detener el servidor\n")

    debug_mode = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    app.run(debug=debug_mode, port=5000, host='0.0.0.0')
