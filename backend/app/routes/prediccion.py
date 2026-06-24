from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import db
from app.models.cultivo import Cultivo, PrediccionCosecha
from app.services.ml_prediccion import PrediccionService

prediccion_bp = Blueprint('prediccion', __name__)


@prediccion_bp.route('/cosecha', methods=['POST'])
@jwt_required()
def predecir_cosecha_post():
    try:
        user_id = get_jwt_identity()
        data = request.get_json() or {}
        cultivo_id = data.get('cultivo_id')

        if not cultivo_id:
            return jsonify({'success': False, 'message': 'cultivo_id requerido'}), 400

        cultivo = Cultivo.query.filter_by(id=cultivo_id, usuario_id=user_id).first()
        if not cultivo:
            return jsonify({'success': False, 'message': 'Cultivo no encontrado o sin acceso'}), 404

        prediccion_data = PrediccionService.predecir_rendimiento(cultivo_id)
        if not prediccion_data:
            return jsonify({'success': False, 'message': 'No se pudo generar predicción'}), 500

        prediccion = PrediccionCosecha(
            cultivo_id=cultivo_id,
            rendimiento_estimado=prediccion_data['rendimiento_estimado'],
            unidad=prediccion_data['unidad'],
            precio_mercado=prediccion_data['precio_mercado'],
            ingreso_estimado=prediccion_data['ingreso_estimado'],
            confianza_prediccion=prediccion_data['confianza_prediccion'],
            factores_considerados=str(prediccion_data['factores'])
        )
        db.session.add(prediccion)
        db.session.commit()

        return jsonify({'success': True, 'data': prediccion_data}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Error interno del servidor'}), 500


@prediccion_bp.route('/historial', methods=['GET'])
@jwt_required()
def historial_predicciones_usuario():
    try:
        user_id = get_jwt_identity()
        cultivos_ids = [c.id for c in Cultivo.query.filter_by(usuario_id=user_id).all()]
        predicciones = PrediccionCosecha.query\
            .filter(PrediccionCosecha.cultivo_id.in_(cultivos_ids))\
            .order_by(PrediccionCosecha.fecha_prediccion.desc())\
            .limit(50).all()

        return jsonify({'success': True, 'data': [p.to_dict() for p in predicciones]}), 200

    except Exception as e:
        return jsonify({'success': False, 'message': 'Error interno del servidor'}), 500


@prediccion_bp.route('/cultivo/<int:cultivo_id>', methods=['GET'])
@jwt_required()
def predecir_cosecha(cultivo_id):
    try:
        user_id = get_jwt_identity()
        cultivo = Cultivo.query.filter_by(id=cultivo_id, usuario_id=user_id).first()

        if not cultivo:
            return jsonify({
                'success': False,
                'message': 'Cultivo no encontrado'
            }), 404

        prediccion_data = PrediccionService.predecir_rendimiento(cultivo_id)

        if not prediccion_data:
            return jsonify({
                'success': False,
                'message': 'No se pudo generar predicción'
            }), 500

        prediccion = PrediccionCosecha(
            cultivo_id=cultivo_id,
            rendimiento_estimado=prediccion_data['rendimiento_estimado'],
            unidad=prediccion_data['unidad'],
            precio_mercado=prediccion_data['precio_mercado'],
            ingreso_estimado=prediccion_data['ingreso_estimado'],
            confianza_prediccion=prediccion_data['confianza_prediccion'],
            factores_considerados=str(prediccion_data['factores'])
        )

        db.session.add(prediccion)
        db.session.commit()

        return jsonify({
            'success': True,
            'data': prediccion_data
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Error interno del servidor'
        }), 500

@prediccion_bp.route('/cultivo/<int:cultivo_id>/tendencia', methods=['GET'])
@jwt_required()
def tendencia_prediccion(cultivo_id):
    try:
        user_id = get_jwt_identity()
        cultivo = Cultivo.query.filter_by(id=cultivo_id, usuario_id=user_id).first()

        if not cultivo:
            return jsonify({
                'success': False,
                'message': 'Cultivo no encontrado'
            }), 404

        tendencia = PrediccionService.generar_grafico_tendencia(cultivo_id)

        if not tendencia:
            return jsonify({
                'success': False,
                'message': 'No se pudo generar tendencia'
            }), 500

        return jsonify({
            'success': True,
            'data': tendencia
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error interno del servidor'
        }), 500

@prediccion_bp.route('/historial/<int:cultivo_id>', methods=['GET'])
@jwt_required()
def historial_predicciones(cultivo_id):
    try:
        user_id = get_jwt_identity()
        cultivo = Cultivo.query.filter_by(id=cultivo_id, usuario_id=user_id).first()

        if not cultivo:
            return jsonify({
                'success': False,
                'message': 'Cultivo no encontrado'
            }), 404

        predicciones = PrediccionCosecha.query.filter_by(cultivo_id=cultivo_id)\
            .order_by(PrediccionCosecha.fecha_prediccion.desc()).all()

        return jsonify({
            'success': True,
            'data': [p.to_dict() for p in predicciones]
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error interno del servidor'
        }), 500
