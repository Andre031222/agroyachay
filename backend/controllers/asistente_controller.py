from flask import Blueprint, request, jsonify
from app.services.groq_service import consulta_agricola

asistente_bp = Blueprint('asistente', __name__)


@asistente_bp.route('/consulta', methods=['POST'])
def consulta():
    try:
        data = request.get_json()
        if not data or not data.get('pregunta'):
            return jsonify({'success': False, 'message': 'El campo "pregunta" es requerido'}), 400

        pregunta = data['pregunta'].strip()
        if len(pregunta) < 3:
            return jsonify({'success': False, 'message': 'Pregunta demasiado corta'}), 400
        if len(pregunta) > 1000:
            return jsonify({'success': False, 'message': 'Pregunta demasiado larga (máx 1000 caracteres)'}), 400

        contexto = data.get('contexto', {})

        resultado = consulta_agricola(pregunta, contexto)

        if not resultado['success']:
            return jsonify({
                'success': False,
                'message': f"Error en IA: {resultado['error']}"
            }), 503

        return jsonify({
            'success': True,
            'data': {
                'pregunta': pregunta,
                'respuesta': resultado['respuesta'],
                'tokens_usados': resultado.get('tokens_usados', 0),
                'modelo': 'llama-3.3-70b-versatile'
            }
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'message': 'Error interno del servidor'}), 500


@asistente_bp.route('/estado', methods=['GET'])
def estado():
    try:
        resultado = consulta_agricola('Responde solo: OK', {})
        operativo = resultado['success']
        return jsonify({
            'success': True,
            'groq_operativo': operativo,
            'modelo': 'llama-3.3-70b-versatile',
            'error': resultado.get('error') if not operativo else None
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'groq_operativo': False, 'error': 'Error interno del servidor'}), 500
