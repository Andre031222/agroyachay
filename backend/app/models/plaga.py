from . import db
from datetime import datetime


class DeteccionPlaga(db.Model):
    __tablename__ = 'detecciones_plagas'

    id                   = db.Column(db.Integer, primary_key=True)
    cultivo_id           = db.Column(db.Integer, db.ForeignKey('cultivos.id', ondelete='CASCADE'), nullable=False)
    imagen_path          = db.Column(db.String(500))
    tipo_plaga           = db.Column(db.String(100))
    confianza            = db.Column(db.Numeric(5, 2))
    severidad            = db.Column(db.String(20))
    recomendaciones      = db.Column(db.Text)
    fecha_deteccion      = db.Column(db.DateTime, default=datetime.utcnow)
    tratamiento_aplicado = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            'id':                   self.id,
            'cultivo_id':           self.cultivo_id,
            'imagen_path':          self.imagen_path,
            'tipo_plaga':           self.tipo_plaga,
            'confianza':            float(self.confianza) if self.confianza else None,
            'severidad':            self.severidad,
            'recomendaciones':      self.recomendaciones,
            'fecha_deteccion':      self.fecha_deteccion.isoformat() if self.fecha_deteccion else None,
            'tratamiento_aplicado': self.tratamiento_aplicado,
        }
