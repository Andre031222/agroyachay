from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.models.sensor import ProductoMarketplace
from app.services.marketplace_scraper import MarketplaceService

marketplace_bp = Blueprint('marketplace', __name__)

@marketplace_bp.route('/productos', methods=['GET'])
@jwt_required()
def buscar_productos():
    try:
        query = request.args.get('q', '')
        categoria = request.args.get('categoria')
        plataforma = request.args.get('plataforma')
        min_precio = request.args.get('min_precio', type=float)
        max_precio = request.args.get('max_precio', type=float)
        envio_gratis = request.args.get('envio_gratis', type=bool)
        orden = request.args.get('orden', 'relevancia')

        productos_query = ProductoMarketplace.query

        if query:
            productos_query = productos_query.filter(
                (ProductoMarketplace.nombre.contains(query)) |
                (ProductoMarketplace.descripcion.contains(query))
            )

        if categoria:
            productos_query = productos_query.filter_by(categoria=categoria)

        if plataforma:
            productos_query = productos_query.filter_by(plataforma=plataforma)

        if min_precio is not None:
            productos_query = productos_query.filter(ProductoMarketplace.precio >= min_precio)

        if max_precio is not None:
            productos_query = productos_query.filter(ProductoMarketplace.precio <= max_precio)

        if envio_gratis:
            productos_query = productos_query.filter_by(envio_gratis=True)

        if orden == 'precio_asc':
            productos_query = productos_query.order_by(ProductoMarketplace.precio.asc())
        elif orden == 'precio_desc':
            productos_query = productos_query.order_by(ProductoMarketplace.precio.desc())
        elif orden == 'mas_vendidos':
            productos_query = productos_query.order_by(ProductoMarketplace.numero_ventas.desc())
        elif orden == 'mejor_valorados':
            productos_query = productos_query.order_by(ProductoMarketplace.calificacion.desc())
        else:
            productos_query = productos_query.order_by(
                ProductoMarketplace.calificacion.desc(),
                ProductoMarketplace.numero_ventas.desc()
            )

        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)

        productos_paginados = productos_query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )

        return jsonify({
            'success': True,
            'data': [p.to_dict() for p in productos_paginados.items],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': productos_paginados.total,
                'pages': productos_paginados.pages
            }
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error interno del servidor'
        }), 500

@marketplace_bp.route('/producto/<int:producto_id>', methods=['GET'])
@jwt_required()
def detalle_producto(producto_id):
    try:
        producto = ProductoMarketplace.query.get(producto_id)

        if not producto:
            return jsonify({
                'success': False,
                'message': 'Producto no encontrado'
            }), 404

        return jsonify({
            'success': True,
            'data': producto.to_dict()
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error interno del servidor'
        }), 500

@marketplace_bp.route('/categorias', methods=['GET'])
@jwt_required()
def categorias():
    try:
        from sqlalchemy import distinct

        categorias = ProductoMarketplace.query.with_entities(
            distinct(ProductoMarketplace.categoria)
        ).all()

        categorias_lista = [c[0] for c in categorias]

        return jsonify({
            'success': True,
            'data': categorias_lista
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error interno del servidor'
        }), 500

@marketplace_bp.route('/plataformas', methods=['GET'])
@jwt_required()
def plataformas():
    try:
        from sqlalchemy import distinct

        plataformas = ProductoMarketplace.query.with_entities(
            distinct(ProductoMarketplace.plataforma)
        ).all()

        plataformas_lista = [p[0] for p in plataformas]

        return jsonify({
            'success': True,
            'data': plataformas_lista
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error interno del servidor'
        }), 500

@marketplace_bp.route('/recomendaciones', methods=['GET'])
@jwt_required()
def recomendaciones():
    try:
        tipo_cultivo = request.args.get('tipo_cultivo')

        productos = MarketplaceService.obtener_productos_recomendados(tipo_cultivo)

        return jsonify({
            'success': True,
            'data': productos
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error interno del servidor'
        }), 500

@marketplace_bp.route('/destacados', methods=['GET'])
@jwt_required()
def productos_destacados():
    try:
        productos = ProductoMarketplace.query.filter_by(envio_gratis=True)\
            .order_by(ProductoMarketplace.calificacion.desc())\
            .limit(12).all()

        return jsonify({
            'success': True,
            'data': [p.to_dict() for p in productos]
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error interno del servidor'
        }), 500
