from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

from .user    import Usuario
from .cultivo import Cultivo, PrediccionCosecha, ActividadCultivo, Insumo
from .sensor  import Asesoria, Informe, DatoClimatico, ProductoMarketplace
from .plaga   import DeteccionPlaga

__all__ = [
    'db',
    'Usuario',
    'Cultivo', 'PrediccionCosecha', 'ActividadCultivo', 'Insumo',
    'Asesoria', 'Informe', 'DatoClimatico', 'ProductoMarketplace',
    'DeteccionPlaga',
]
