from . import db
from datetime import datetime


class Asesoria(db.Model):
    __tablename__ = 'asesorias'

    id                  = db.Column(db.Integer, primary_key=True)
    usuario_id          = db.Column(db.Integer, db.ForeignKey('usuarios.id', ondelete='CASCADE'), nullable=False)
    tipo_asesoria       = db.Column(db.String(100))
    descripcion_problema = db.Column(db.Text)
    prioridad           = db.Column(db.String(20), default='Media')
    estado              = db.Column(db.String(20), default='Pendiente')
    respuesta           = db.Column(db.Text)
    asesor_asignado     = db.Column(db.String(100))
    fecha_solicitud     = db.Column(db.DateTime, default=datetime.utcnow)
    fecha_respuesta     = db.Column(db.DateTime)
    fecha_resolucion    = db.Column(db.DateTime)

    def to_dict(self):
        return {
            'id':                   self.id,
            'usuario_id':           self.usuario_id,
            'tipo_asesoria':        self.tipo_asesoria,
            'descripcion_problema': self.descripcion_problema,
            'prioridad':            self.prioridad,
            'estado':               self.estado,
            'respuesta':            self.respuesta,
            'asesor_asignado':      self.asesor_asignado,
            'fecha_solicitud':      self.fecha_solicitud.isoformat() if self.fecha_solicitud else None,
            'fecha_respuesta':      self.fecha_respuesta.isoformat() if self.fecha_respuesta else None,
            'fecha_resolucion':     self.fecha_resolucion.isoformat() if self.fecha_resolucion else None,
        }


class Informe(db.Model):
    __tablename__ = 'informes'

    id               = db.Column(db.Integer, primary_key=True)
    usuario_id       = db.Column(db.Integer, db.ForeignKey('usuarios.id', ondelete='CASCADE'), nullable=False)
    tipo_informe     = db.Column(db.String(100))
    formato          = db.Column(db.String(20))
    archivo_url      = db.Column(db.String(500))
    parametros       = db.Column(db.Text)
    estado           = db.Column(db.String(20), default='generado')
    fecha_generacion = db.Column(db.DateTime, default=datetime.utcnow)
    fecha_descarga   = db.Column(db.DateTime)

    def to_dict(self):
        return {
            'id':               self.id,
            'usuario_id':       self.usuario_id,
            'tipo_informe':     self.tipo_informe,
            'formato':          self.formato,
            'archivo_url':      self.archivo_url,
            'estado':           self.estado,
            'fecha_generacion': self.fecha_generacion.isoformat() if self.fecha_generacion else None,
            'fecha_descarga':   self.fecha_descarga.isoformat() if self.fecha_descarga else None,
        }


class DatoClimatico(db.Model):
    __tablename__ = 'datos_climaticos'

    id               = db.Column(db.Integer, primary_key=True)
    latitud          = db.Column(db.Numeric(10, 6))
    longitud         = db.Column(db.Numeric(10, 6))
    temperatura      = db.Column(db.Numeric(5, 2))
    humedad          = db.Column(db.Numeric(5, 2))
    presion          = db.Column(db.Numeric(7, 2))
    velocidad_viento = db.Column(db.Numeric(6, 2))
    direccion_viento = db.Column(db.Numeric(5, 1))
    precipitacion    = db.Column(db.Numeric(6, 2))
    nubosidad        = db.Column(db.Integer)
    condicion        = db.Column(db.String(100))
    icono            = db.Column(db.String(20))
    fecha_hora       = db.Column(db.DateTime, default=datetime.utcnow)
    fuente           = db.Column(db.String(50))

    def to_dict(self):
        return {
            'id':               self.id,
            'latitud':          float(self.latitud) if self.latitud else None,
            'longitud':         float(self.longitud) if self.longitud else None,
            'temperatura':      float(self.temperatura) if self.temperatura else None,
            'humedad':          float(self.humedad) if self.humedad else None,
            'velocidad_viento': float(self.velocidad_viento) if self.velocidad_viento else None,
            'nubosidad':        self.nubosidad,
            'condicion':        self.condicion,
            'fecha_hora':       self.fecha_hora.isoformat() if self.fecha_hora else None,
        }


class ProductoMarketplace(db.Model):
    __tablename__ = 'productos_marketplace'

    id               = db.Column(db.Integer, primary_key=True)
    nombre           = db.Column(db.String(200))
    descripcion      = db.Column(db.Text)
    categoria        = db.Column(db.String(100))
    precio           = db.Column(db.Numeric(10, 2))
    imagen_url       = db.Column(db.String(500))
    url_compra       = db.Column(db.String(500))
    plataforma       = db.Column(db.String(100))
    calificacion     = db.Column(db.Numeric(3, 1))
    numero_ventas    = db.Column(db.Integer)
    envio_gratis     = db.Column(db.Boolean, default=False)
    stock_disponible = db.Column(db.Integer)
    proveedor        = db.Column(db.String(200))
    fecha_agregado   = db.Column(db.DateTime, default=datetime.utcnow)
    fecha_actualizacion = db.Column(db.DateTime, default=datetime.utcnow)
    activo           = db.Column(db.Boolean, default=True)

    def to_dict(self):
        return {
            'id':               self.id,
            'nombre':           self.nombre,
            'descripcion':      self.descripcion,
            'categoria':        self.categoria,
            'precio':           float(self.precio) if self.precio else None,
            'imagen_url':       self.imagen_url,
            'url_compra':       self.url_compra,
            'plataforma':       self.plataforma,
            'calificacion':     float(self.calificacion) if self.calificacion else None,
            'numero_ventas':    self.numero_ventas,
            'envio_gratis':     self.envio_gratis,
            'stock_disponible': self.stock_disponible,
            'proveedor':        self.proveedor,
            'activo':           self.activo,
        }
