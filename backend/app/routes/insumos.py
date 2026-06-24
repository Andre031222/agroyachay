from flask import Blueprint, request, jsonify

insumos_bp = Blueprint('insumos', __name__)

@insumos_bp.route('/cultivo/<int:cultivo_id>', methods=['GET'])
def get_insumos_cultivo(cultivo_id):
    try:
        return jsonify({
            'success': True,
            'data': [],
            'message': 'Endpoint en desarrollo'
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error interno del servidor'
        }), 500

@insumos_bp.route('/', methods=['POST'])
def agregar_insumo():
    try:
        data = request.get_json()

        return jsonify({
            'success': True,
            'message': 'Insumo agregado exitosamente',
            'data': data
        }), 201

    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error interno del servidor'
        }), 500

@insumos_bp.route('/calcular', methods=['POST'])
def calcular_insumos():
    try:
        data = request.get_json()

        tipo_cultivo = data.get('tipo_cultivo')
        area_hectareas = float(data.get('area_hectareas', 1))

        requerimientos_npk = {
            'Papa': {'N': 180, 'P': 90, 'K': 150},
            'Maíz': {'N': 150, 'P': 70, 'K': 100},
            'Trigo': {'N': 100, 'P': 50, 'K': 60},
            'Quinua': {'N': 80, 'P': 40, 'K': 60},
            'Arroz': {'N': 120, 'P': 60, 'K': 80},
            'Tomate': {'N': 200, 'P': 100, 'K': 250},
            'Otro': {'N': 100, 'P': 50, 'K': 80}
        }

        req = requerimientos_npk.get(tipo_cultivo, requerimientos_npk['Otro'])

        nitrogeno_total = req['N'] * area_hectareas
        fosforo_total = req['P'] * area_hectareas
        potasio_total = req['K'] * area_hectareas

        precio_n = 5.00
        precio_p = 3.50
        precio_k = 4.00

        costo_nitrogeno = nitrogeno_total * precio_n
        costo_fosforo = fosforo_total * precio_p
        costo_potasio = potasio_total * precio_k
        costo_total = costo_nitrogeno + costo_fosforo + costo_potasio

        ahorro_estimado = costo_total * 0.25
        aumento_rendimiento = 15

        return jsonify({
            'success': True,
            'data': {
                'tipo_cultivo': tipo_cultivo,
                'area_hectareas': area_hectareas,
                'requerimientos': {
                    'nitrogeno': {
                        'cantidad_kg': round(nitrogeno_total, 2),
                        'costo': round(costo_nitrogeno, 2)
                    },
                    'fosforo': {
                        'cantidad_kg': round(fosforo_total, 2),
                        'costo': round(costo_fosforo, 2)
                    },
                    'potasio': {
                        'cantidad_kg': round(potasio_total, 2),
                        'costo': round(costo_potasio, 2)
                    }
                },
                'costo_total': round(costo_total, 2),
                'beneficios': {
                    'ahorro_estimado': round(ahorro_estimado, 2),
                    'aumento_rendimiento_porcentaje': aumento_rendimiento,
                    'mejora_calidad': 'Alta'
                },
                'recomendaciones': [
                    'Realizar análisis de suelo cada 2-3 años para ajustar fertilización',
                    'Implementar sistemas de riego por goteo para reducir consumo de agua hasta un 40%',
                    'Utilizar aplicaciones fraccionadas de fertilizante para mejorar absorción y reducir pérdidas'
                ]
            }
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error interno del servidor'
        }), 500

@insumos_bp.route('/estadisticas/<int:cultivo_id>', methods=['GET'])
def estadisticas_insumos(cultivo_id):
    try:
        return jsonify({
            'success': True,
            'data': {
                'costo_total': 0.0,
                'por_tipo': {}
            }
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error interno del servidor'
        }), 500
