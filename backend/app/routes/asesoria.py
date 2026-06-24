from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import db
from app.models.sensor import Asesoria
from app.models.user import Usuario
from app.services.groq_service import consulta_agricola

asesoria_bp = Blueprint('asesoria', __name__)


def _groq_respuesta(tipo_asesoria, descripcion, prioridad, usuario_nombre):
    try:
        prompt = (
            f"Eres un agrónomo experto certificado de AgroYachay respondiendo a un agricultor de Puno, Perú "
            f"(altiplano 3800-4500 msnm). Responde con profesionalismo y empatía.\n\n"
            f"Tipo de consulta: {tipo_asesoria}\n"
            f"Agricultor: {usuario_nombre}\n"
            f"Prioridad: {prioridad}\n\n"
            f"Consulta del agricultor:\n\"{descripcion}\"\n\n"
            f"Proporciona una respuesta profesional en texto plano (sin markdown, sin asteriscos). "
            f"Incluye: diagnóstico o evaluación inicial, recomendaciones específicas con dosis y productos "
            f"disponibles en Perú, y pasos de seguimiento. Máximo 5-6 oraciones. Tono cercano y práctico."
        )
        resultado = consulta_agricola(prompt, {'region': 'Puno, Perú'})
        if resultado['success']:
            texto = resultado['respuesta'].replace('**', '').replace('*', '')
            return texto
        return None
    except Exception:
        return None


@asesoria_bp.route('/solicitar', methods=['POST'])
@jwt_required()
def solicitar_asesoria():
    try:
        user_id = int(get_jwt_identity())
        data    = request.get_json() or {}

        tipo_asesoria        = (data.get('tipo_asesoria') or '').strip()
        descripcion_problema = (data.get('descripcion_problema') or '').strip()
        prioridad            = data.get('prioridad', 'Media')

        if not tipo_asesoria:
            return jsonify({'success': False, 'message': 'Tipo de asesoría requerido'}), 400
        if not descripcion_problema:
            return jsonify({'success': False, 'message': 'Descripción del problema requerida'}), 400

        usuario = Usuario.query.get(user_id)
        if not usuario:
            return jsonify({'success': False, 'message': 'Usuario no encontrado'}), 404

        respuesta_ia = _groq_respuesta(
            tipo_asesoria, descripcion_problema, prioridad,
            usuario.nombre or 'Agricultor'
        )

        asesoria = Asesoria(
            usuario_id           = user_id,
            tipo_asesoria        = tipo_asesoria,
            descripcion_problema = descripcion_problema,
            prioridad            = prioridad,
            estado               = 'Respondida' if respuesta_ia else 'Pendiente',
            respuesta            = respuesta_ia,
            asesor_asignado      = 'AgroIA · AgroYachay' if respuesta_ia else None,
        )

        db.session.add(asesoria)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Solicitud enviada y respondida por AgroIA' if respuesta_ia else 'Solicitud enviada. Un experto te responderá pronto.',
            'data':    asesoria.to_dict(),
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Error interno del servidor'}), 500


@asesoria_bp.route('/mis-solicitudes', methods=['GET'])
@jwt_required()
def mis_asesorias():
    try:
        user_id = int(get_jwt_identity())
        estado  = request.args.get('estado')
        query   = Asesoria.query.filter_by(usuario_id=user_id)
        if estado:
            query = query.filter_by(estado=estado)
        asesorias = query.order_by(Asesoria.fecha_solicitud.desc()).all()
        return jsonify({'success': True, 'data': [a.to_dict() for a in asesorias]}), 200
    except Exception:
        return jsonify({'success': False, 'message': 'Error interno del servidor'}), 500


@asesoria_bp.route('/<int:asesoria_id>', methods=['GET'])
@jwt_required()
def detalle_asesoria(asesoria_id):
    try:
        user_id  = int(get_jwt_identity())
        asesoria = Asesoria.query.filter_by(id=asesoria_id, usuario_id=user_id).first()
        if not asesoria:
            return jsonify({'success': False, 'message': 'Asesoría no encontrada'}), 404
        return jsonify({'success': True, 'data': asesoria.to_dict()}), 200
    except Exception:
        return jsonify({'success': False, 'message': 'Error interno del servidor'}), 500


@asesoria_bp.route('/especialidades', methods=['GET'])
def especialidades():
    data = [
        {'tipo': 'Nutrición Vegetal',      'descripcion': 'Fertilización y nutrientes para maximizar el rendimiento.'},
        {'tipo': 'Manejo Hídrico',         'descripcion': 'Sistemas de riego eficientes y gestión óptima del agua.'},
        {'tipo': 'Manejo de Suelos',       'descripcion': 'Análisis de suelos, fertilidad y conservación.'},
        {'tipo': 'Control Fitosanitario',  'descripcion': 'Prevención y control de plagas y enfermedades.'},
        {'tipo': 'Análisis de Productividad', 'descripcion': 'Evaluación de rendimientos y estrategias de mejora.'},
        {'tipo': 'Agricultura Sostenible', 'descripcion': 'Prácticas ecológicas y sostenibles para el altiplano.'},
    ]
    return jsonify({'success': True, 'data': data}), 200
