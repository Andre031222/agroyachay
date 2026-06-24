import re
from datetime import datetime

def validar_dni(dni):
    return bool(re.match(r'^\d{8}$', str(dni)))

def validar_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

def validar_telefono(telefono):
    return bool(re.match(r'^\d{9}$', str(telefono)))

def validar_fecha(fecha_str):
    try:
        return datetime.strptime(fecha_str, '%Y-%m-%d').date()
    except Exception:
        return None
