from . import db
from datetime import datetime


class Usuario(db.Model):
    __tablename__ = 'usuarios'

    id               = db.Column(db.Integer, primary_key=True)
    nombre           = db.Column(db.String(100), nullable=False)
    apellido         = db.Column(db.String(100))
    email            = db.Column(db.String(150), unique=True, nullable=False)
    password_hash    = db.Column(db.String(255), nullable=False)
    telefono         = db.Column(db.String(20))
    rol              = db.Column(db.String(20), default='usuario')
    fecha_registro   = db.Column(db.DateTime, default=datetime.utcnow)
    activo           = db.Column(db.Boolean, default=True)
    dni              = db.Column(db.String(20))
    username         = db.Column(db.String(100))
    google_id        = db.Column(db.String(255))
    region           = db.Column(db.String(100))
    provincia        = db.Column(db.String(100))
    ultimo_acceso    = db.Column(db.DateTime)

    def to_dict(self):
        return {
            'id':             self.id,
            'nombre':         self.nombre,
            'apellido':       self.apellido,
            'email':          self.email,
            'telefono':       self.telefono,
            'rol':            self.rol,
            'region':         self.region,
            'provincia':      self.provincia,
            'activo':         self.activo,
            'fecha_registro': self.fecha_registro.isoformat() if self.fecha_registro else None,
        }
