import logging
import os
import re
import json
import base64
import urllib.request
from groq import Groq

logger = logging.getLogger(__name__)

GROQ_API_KEY  = os.getenv('GROQ_API_KEY', '')
MODEL         = os.getenv('GROQ_TEXT_MODEL', 'openai/gpt-oss-120b')
MODEL_VISION  = 'meta-llama/llama-4-scout-17b-16e-instruct'  # legacy Groq vision (deprecated upstream)

# Motor de visión para diagnóstico de plagas/enfermedades:
#   'ollama' -> modelo abierto local (privado, reproducible, sin dependencia externa)
#   'groq'   -> API en la nube (heredado)
# El texto (asistente, clima, recomendaciones) sigue usando Groq.
VISION_ENGINE       = os.getenv('VISION_ENGINE', 'ollama')
OLLAMA_URL          = os.getenv('OLLAMA_URL', 'http://127.0.0.1:11434')
OLLAMA_VISION_MODEL = os.getenv('OLLAMA_VISION_MODEL', 'qwen2.5vl:3b')

SISTEMA_AGROYACHAY = """Eres AgroIA, el asistente de inteligencia artificial de AgroYachay,
un sistema de gestión agrícola para agricultores peruanos. Tu especialidad es la agricultura
andina (papa, maíz, quinua, habas, oca, trigo) pero conoces cultivos tropicales y de costa.
Responde siempre en español, de forma clara, práctica y directa.
Cuando des recomendaciones, sé específico con dosis, fechas y productos disponibles en Perú.
Limita tu respuesta a lo solicitado sin información irrelevante."""


def _parse_json(texto: str):
    limpio = (texto or '').strip()
    if limpio.startswith('```'):
        partes = limpio.split('```')
        limpio = partes[1] if len(partes) > 1 else limpio
        if limpio.startswith('json'):
            limpio = limpio[4:]
    encontrado = re.search(r'\{.*\}', limpio, re.DOTALL)
    return json.loads(encontrado.group(0) if encontrado else limpio)


def _cliente():
    return Groq(api_key=GROQ_API_KEY)


def _vision_ollama(b64: str, prompt: str) -> str:
    """Diagnóstico por visión con modelo abierto local (Ollama)."""
    payload = json.dumps({
        'model':   OLLAMA_VISION_MODEL,
        'prompt':  prompt,
        'images':  [b64],
        'stream':  False,
        'options': {'temperature': 0.1},
    }).encode('utf-8')
    req = urllib.request.Request(
        f'{OLLAMA_URL}/api/generate', data=payload,
        headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=180) as r:
        return json.load(r).get('response', '').strip()


def _vision_groq(b64: str, mime: str, prompt: str) -> str:
    """Diagnóstico por visión con Groq (heredado)."""
    response = _cliente().chat.completions.create(
        model=MODEL_VISION,
        messages=[{
            'role': 'user',
            'content': [
                {'type': 'image_url', 'image_url': {'url': f'data:{mime};base64,{b64}'}},
                {'type': 'text',      'text': prompt},
            ],
        }],
        temperature=0.1,
        max_tokens=600,
    )
    return response.choices[0].message.content.strip()


def detectar_plaga_vision(image_path: str, cultivo: str = '') -> dict:
    try:
        with open(image_path, 'rb') as f:
            b64 = base64.b64encode(f.read()).decode('utf-8')

        ext = image_path.rsplit('.', 1)[-1].lower()
        mime = 'image/jpeg' if ext in ('jpg', 'jpeg') else f'image/{ext}'

        cultivo_ctx = f' El cultivo es: {cultivo}.' if cultivo else ''

        prompt = f"""Eres un fitopatólogo experto en cultivos andinos peruanos (papa, quinua, maíz, habas, oca, cañihua).{cultivo_ctx}

Analiza esta imagen y responde SOLO en JSON con este formato exacto:
{{
  "is_healthy": true,
  "nombre": "Planta Saludable",
  "confianza": 92,
  "severidad": "leve",
  "descripcion": "descripción en 1-2 oraciones",
  "causas": "causas principales en 1-2 oraciones",
  "tratamiento": "tratamiento específico con productos disponibles en Perú",
  "prevencion": "medidas preventivas concretas"
}}

Reglas:
- Si la planta está sana, is_healthy=true y nombre="Planta Saludable"
- Si hay problema, is_healthy=false y nombre=nombre exacto de la enfermedad o plaga
- confianza entre 0 y 100
- severidad: "leve", "moderada" o "severa"
- Responde SOLO el JSON, sin texto adicional"""

        if VISION_ENGINE == 'ollama':
            texto = _vision_ollama(b64, prompt)
        else:
            texto = _vision_groq(b64, mime, prompt)

        # Extraer el objeto JSON aunque el modelo lo envuelva en ``` o texto extra.
        resultado = _parse_json(texto)
        resultado.setdefault('is_healthy', False)
        resultado.setdefault('confianza',  70)
        resultado.setdefault('severidad',  'moderada')
        return {'success': True, 'resultado': resultado}

    except Exception as e:
        return {'success': False, 'error': str(e)}


def analizar_clima_agricola(clima_data: dict, cultivos: list = None) -> dict:
    try:
        cultivos_texto = ', '.join(cultivos) if cultivos else 'cultivos andinos en general'

        prompt = f"""Analiza estas condiciones climáticas actuales y genera recomendaciones agrícolas:

DATOS CLIMÁTICOS:
- Temperatura: {clima_data.get('temperatura', 'N/D')}°C
- Sensación térmica: {clima_data.get('sensacion_termica', 'N/D')}°C
- Humedad relativa: {clima_data.get('humedad', 'N/D')}%
- Velocidad del viento: {clima_data.get('velocidad_viento', 'N/D')} km/h
- Condición: {clima_data.get('descripcion', 'N/D')}
- Nubosidad: {clima_data.get('nubosidad', 'N/D')}%

CULTIVOS ACTIVOS: {cultivos_texto}

Proporciona en formato JSON con estas claves exactas:
{{
  "resumen": "diagnóstico en 1 oración",
  "riesgo_nivel": "bajo|medio|alto|crítico",
  "riesgo_descripcion": "qué riesgo representa para los cultivos",
  "recomendaciones": ["acción 1", "acción 2", "acción 3"],
  "mejor_actividad_hoy": "la actividad agrícola más adecuada para hoy",
  "alerta_fitosanitaria": "si el clima favorece alguna plaga o enfermedad, o null",
  "riego": "recomendación específica de riego para hoy"
}}
Responde SOLO el JSON, sin texto adicional."""

        cliente = _cliente()
        response = cliente.chat.completions.create(
            model=MODEL,
            messages=[
                {'role': 'system', 'content': SISTEMA_AGROYACHAY},
                {'role': 'user', 'content': prompt}
            ],
            temperature=0.3,
            max_tokens=2000
        )

        texto = response.choices[0].message.content.strip()
        return {'success': True, 'analisis': _parse_json(texto)}

    except Exception:
        logger.exception('Groq request failed')
        return {'success': False, 'error': 'Error al contactar el servicio de IA'}


def consejo_plaga(deteccion: dict) -> dict:
    try:
        prompt = f"""Se detectó la siguiente plaga/enfermedad en un cultivo agrícola peruano:

DETECCIÓN:
- Nombre: {deteccion.get('nombre_plaga', 'desconocida')}
- Confianza de detección: {deteccion.get('confianza', 0):.1f}%
- Severidad: {deteccion.get('severidad', 'moderada')}
- Cultivo afectado: {deteccion.get('cultivo', 'no especificado')}
- Descripción adicional: {deteccion.get('descripcion', '')}

Genera un plan de manejo en JSON con estas claves exactas:
{{
  "confirmacion": "confirmación o duda sobre el diagnóstico",
  "urgencia": "inmediata|24h|esta_semana|monitorear",
  "plan_accion": ["paso 1 inmediato", "paso 2", "paso 3"],
  "productos_quimicos": [{{"nombre": "...", "dosis": "...", "frecuencia": "..."}}],
  "alternativa_organica": "tratamiento orgánico/biológico disponible en Perú",
  "prevencion_futura": ["medida preventiva 1", "medida preventiva 2"],
  "cuando_consultar_especialista": "condición que requiere agrónomo presencial"
}}
Responde SOLO el JSON."""

        cliente = _cliente()
        response = cliente.chat.completions.create(
            model=MODEL,
            messages=[
                {'role': 'system', 'content': SISTEMA_AGROYACHAY},
                {'role': 'user', 'content': prompt}
            ],
            temperature=0.2,
            max_tokens=2000
        )

        texto = response.choices[0].message.content.strip()
        return {'success': True, 'consejo': _parse_json(texto)}

    except Exception:
        logger.exception('Groq request failed')
        return {'success': False, 'error': 'Error al contactar el servicio de IA'}


def consulta_agricola(pregunta: str, contexto: dict = None) -> dict:
    try:
        contexto_texto = ''
        if contexto:
            partes = []
            if contexto.get('cultivos'):
                partes.append(f"Cultivos activos: {', '.join(contexto['cultivos'])}")
            if contexto.get('region'):
                partes.append(f"Región: {contexto['region']}")
            if contexto.get('temperatura'):
                partes.append(f"Temperatura actual: {contexto['temperatura']}°C")
            if contexto.get('humedad_suelo'):
                partes.append(f"Humedad suelo: {contexto['humedad_suelo']}%")
            if partes:
                contexto_texto = '\nCONTEXTO DEL AGRICULTOR:\n' + '\n'.join(partes) + '\n'

        cliente = _cliente()
        response = cliente.chat.completions.create(
            model=MODEL,
            messages=[
                {'role': 'system', 'content': SISTEMA_AGROYACHAY},
                {'role': 'user', 'content': f"{contexto_texto}\nPREGUNTA: {pregunta}"}
            ],
            temperature=0.5,
            max_tokens=800
        )

        return {
            'success': True,
            'respuesta': response.choices[0].message.content.strip(),
            'tokens_usados': response.usage.total_tokens
        }

    except Exception:
        logger.exception('Groq request failed')
        return {'success': False, 'error': 'Error al contactar el servicio de IA'}


def analizar_pronostico_agricola(pronostico_lista: list, cultivos: list = None) -> dict:
    try:
        dias = {}
        for item in pronostico_lista:
            fecha = item['fecha_hora'][:10]
            if fecha not in dias:
                dias[fecha] = item

        resumen_dias = []
        for fecha, dato in list(dias.items())[:5]:
            resumen_dias.append(
                f"  {fecha}: {dato.get('temperatura')}°C, "
                f"humedad {dato.get('humedad')}%, "
                f"lluvia {dato.get('probabilidad_lluvia', 0)}%, "
                f"{dato.get('descripcion', '')}"
            )

        cultivos_texto = ', '.join(cultivos) if cultivos else 'cultivos andinos'

        prompt = f"""Analiza el siguiente pronóstico de 5 días para planificar actividades agrícolas:

PRONÓSTICO:
{chr(10).join(resumen_dias)}

CULTIVOS: {cultivos_texto}

Genera en JSON:
{{
  "dia_optimo_fumigacion": "fecha YYYY-MM-DD o null si no hay día óptimo",
  "dia_optimo_siembra": "fecha o null",
  "dias_riesgo_helada": ["fecha1"],
  "dias_riesgo_lluvia_excesiva": ["fecha1"],
  "plan_semanal": [
    {{"dia": "YYYY-MM-DD", "actividades": ["actividad 1"], "prioridad": "alta|media|baja"}}
  ],
  "recomendacion_general": "consejo principal para esta semana"
}}
Responde SOLO el JSON."""

        cliente = _cliente()
        response = cliente.chat.completions.create(
            model=MODEL,
            messages=[
                {'role': 'system', 'content': SISTEMA_AGROYACHAY},
                {'role': 'user', 'content': prompt}
            ],
            temperature=0.3,
            max_tokens=2500
        )

        texto = response.choices[0].message.content.strip()
        return {'success': True, 'plan': _parse_json(texto)}

    except Exception:
        logger.exception('Groq request failed')
        return {'success': False, 'error': 'Error al contactar el servicio de IA'}
