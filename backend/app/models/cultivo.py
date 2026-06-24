from . import db
from datetime import datetime


class Cultivo(db.Model):
    __tablename__ = 'cultivos'

    id                     = db.Column(db.Integer, primary_key=True)
    usuario_id             = db.Column(db.Integer, db.ForeignKey('usuarios.id', ondelete='CASCADE'), nullable=False)
    nombre                 = db.Column(db.String(100), nullable=False)
    tipo_cultivo           = db.Column(db.String(100), nullable=False)
    variedad               = db.Column(db.String(100))
    area_hectareas         = db.Column(db.Numeric(10, 2))
    ubicacion              = db.Column(db.String(255))
    latitud                = db.Column(db.Numeric(10, 6))
    longitud               = db.Column(db.Numeric(10, 6))
    fecha_siembra          = db.Column(db.Date)
    fecha_cosecha_estimada = db.Column(db.Date)
    estado                 = db.Column(db.String(20), default='planificado')
    descripcion            = db.Column(db.Text)
    notas                  = db.Column(db.Text)
    imagen_url             = db.Column(db.String(500))
    fecha_creacion         = db.Column(db.DateTime, default=datetime.utcnow)
    fecha_actualizacion    = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id':                     self.id,
            'usuario_id':             self.usuario_id,
            'nombre':                 self.nombre,
            'tipo_cultivo':           self.tipo_cultivo,
            'variedad':               self.variedad,
            'area_hectareas':         float(self.area_hectareas) if self.area_hectareas else None,
            'ubicacion':              self.ubicacion,
            'latitud':                float(self.latitud) if self.latitud else None,
            'longitud':               float(self.longitud) if self.longitud else None,
            'fecha_siembra':          self.fecha_siembra.isoformat() if self.fecha_siembra else None,
            'fecha_cosecha_estimada': self.fecha_cosecha_estimada.isoformat() if self.fecha_cosecha_estimada else None,
            'estado':                 self.estado,
            'descripcion':            self.descripcion,
            'notas':                  self.notas,
            'fecha_creacion':         self.fecha_creacion.isoformat() if self.fecha_creacion else None,
        }


class PrediccionCosecha(db.Model):
    __tablename__ = 'predicciones_cosecha'

    id                    = db.Column(db.Integer, primary_key=True)
    cultivo_id            = db.Column(db.Integer, db.ForeignKey('cultivos.id', ondelete='CASCADE'), nullable=False)
    rendimiento_estimado  = db.Column(db.Numeric(10, 2))
    unidad                = db.Column(db.String(50))
    precio_mercado        = db.Column(db.Numeric(10, 2))
    ingreso_estimado      = db.Column(db.Numeric(10, 2))
    confianza_prediccion  = db.Column(db.Numeric(5, 2))
    factores_considerados = db.Column(db.Text)
    fecha_prediccion      = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id':                    self.id,
            'cultivo_id':            self.cultivo_id,
            'rendimiento_estimado':  float(self.rendimiento_estimado) if self.rendimiento_estimado else None,
            'unidad':                self.unidad,
            'precio_mercado':        float(self.precio_mercado) if self.precio_mercado else None,
            'ingreso_estimado':      float(self.ingreso_estimado) if self.ingreso_estimado else None,
            'confianza_prediccion':  float(self.confianza_prediccion) if self.confianza_prediccion else None,
            'factores_considerados': self.factores_considerados,
            'fecha_prediccion':      self.fecha_prediccion.isoformat() if self.fecha_prediccion else None,
        }


class ActividadCultivo(db.Model):
    __tablename__ = 'actividades_cultivo'

    id              = db.Column(db.Integer, primary_key=True)
    cultivo_id      = db.Column(db.Integer, db.ForeignKey('cultivos.id', ondelete='CASCADE'), nullable=False)
    tipo_actividad  = db.Column(db.String(100))
    descripcion     = db.Column(db.Text)
    fecha_actividad = db.Column(db.Date)
    costo           = db.Column(db.Numeric(10, 2))
    fecha_registro  = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id':              self.id,
            'cultivo_id':      self.cultivo_id,
            'tipo_actividad':  self.tipo_actividad,
            'descripcion':     self.descripcion,
            'fecha_actividad': self.fecha_actividad.isoformat() if self.fecha_actividad else None,
            'costo':           float(self.costo) if self.costo else None,
            'fecha_registro':  self.fecha_registro.isoformat() if self.fecha_registro else None,
        }


class Insumo(db.Model):
    __tablename__ = 'insumos'

    id               = db.Column(db.Integer, primary_key=True)
    cultivo_id       = db.Column(db.Integer, db.ForeignKey('cultivos.id', ondelete='CASCADE'), nullable=False)
    tipo_insumo      = db.Column(db.String(100))
    cantidad         = db.Column(db.Numeric(10, 2))
    unidad           = db.Column(db.String(50))
    costo_unitario   = db.Column(db.Numeric(10, 2))
    costo_total      = db.Column(db.Numeric(10, 2))
    fecha_aplicacion = db.Column(db.Date)
    proveedor        = db.Column(db.String(200))
    notas            = db.Column(db.Text)
    fecha_registro   = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id':               self.id,
            'cultivo_id':       self.cultivo_id,
            'tipo_insumo':      self.tipo_insumo,
            'cantidad':         float(self.cantidad) if self.cantidad else None,
            'unidad':           self.unidad,
            'costo_unitario':   float(self.costo_unitario) if self.costo_unitario else None,
            'costo_total':      float(self.costo_total) if self.costo_total else None,
            'fecha_aplicacion': self.fecha_aplicacion.isoformat() if self.fecha_aplicacion else None,
            'proveedor':        self.proveedor,
            'notas':            self.notas,
            'fecha_registro':   self.fecha_registro.isoformat() if self.fecha_registro else None,
        }
