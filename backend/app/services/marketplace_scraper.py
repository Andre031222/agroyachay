from app.models.sensor import ProductoMarketplace


class MarketplaceService:

    _CULTIVO_CATEGORIAS = {
        'papa':       ['fungicidas', 'insecticidas', 'fertilizantes', 'semillas'],
        'quinua':     ['fertilizantes', 'semillas', 'herbicidas'],
        'maíz':       ['fertilizantes', 'semillas', 'insecticidas'],
        'maiz':       ['fertilizantes', 'semillas', 'insecticidas'],
        'trigo':      ['fertilizantes', 'semillas', 'fungicidas'],
        'tomate':     ['fertilizantes', 'insecticidas', 'fungicidas'],
        'cebolla':    ['fertilizantes', 'fungicidas', 'semillas'],
        'lechuga':    ['fertilizantes', 'semillas'],
        'fresa':      ['fertilizantes', 'insecticidas'],
        'aguaymanto': ['fertilizantes', 'semillas'],
    }

    @staticmethod
    def obtener_productos_recomendados(tipo_cultivo: str = None, limite: int = 12):
        try:
            query = ProductoMarketplace.query.filter_by(activo=True)

            if tipo_cultivo:
                cultivo_lower = tipo_cultivo.lower().strip()
                categorias = MarketplaceService._CULTIVO_CATEGORIAS.get(cultivo_lower)
                if categorias:
                    query = query.filter(ProductoMarketplace.categoria.in_(categorias))

            productos = (
                query
                .order_by(
                    ProductoMarketplace.calificacion.desc(),
                    ProductoMarketplace.numero_ventas.desc()
                )
                .limit(limite)
                .all()
            )

            return [p.to_dict() for p in productos]

        except Exception:
            return []
