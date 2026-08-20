from flask import current_app, Blueprint, request, jsonify
from app.services.groq_service import MODEL, consulta_agricola
from app.i18n import translate as _

asistente_bp = Blueprint('asistente', __name__)


@asistente_bp.route('/consulta', methods=['POST'])
def consulta():
    try:
        data = request.get_json()
        if not data or not data.get('pregunta'):
            return jsonify({'success': False, 'message': _('el_campo_pregunta_es_requerido')}), 400

        pregunta = data['pregunta'].strip()
        if len(pregunta) < 3:
            return jsonify({'success': False, 'message': _('pregunta_demasiado_corta')}), 400
        if len(pregunta) > 1000:
            return jsonify({'success': False, 'message': _('pregunta_demasiado_larga_max_1000_caracteres')}), 400

        contexto = data.get('contexto', {})

        resultado = consulta_agricola(pregunta, contexto)

        if not resultado['success']:
            current_app.logger.warning('AI service failed: %s', resultado.get('error'))
            return jsonify({
                'success': False,
                'message': _('servicio_ia_no_disponible')
            }), 503

        return jsonify({
            'success': True,
            'data': {
                'pregunta': pregunta,
                'respuesta': resultado['respuesta'],
                'tokens_usados': resultado.get('tokens_usados', 0),
                'modelo': MODEL
            }
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'message': _('error_interno_del_servidor')}), 500


@asistente_bp.route('/estado', methods=['GET'])
def estado():
    try:
        resultado = consulta_agricola('Responde solo: OK', {})
        operativo = resultado['success']
        return jsonify({
            'success': True,
            'groq_operativo': operativo,
            'modelo': MODEL,
            'error': resultado.get('error') if not operativo else None
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'groq_operativo': False, 'error': 'Error interno del servidor'}), 500
