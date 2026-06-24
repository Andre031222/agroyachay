import os
from flask import Blueprint, request, jsonify, make_response
import requests
from datetime import datetime
import time
from app.services.groq_service import analizar_clima_agricola, analizar_pronostico_agricola

clima_bp = Blueprint('clima', __name__)

OPENWEATHER_API_KEY = os.getenv('OPENWEATHER_API_KEY', '')
OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5'

_weather_cache: dict = {}
_CACHE_TTL = 10 * 60


def _cache_get(key: str):
    hit = _weather_cache.get(key)
    if hit and time.time() - hit[0] < _CACHE_TTL:
        return hit[1]
    return None


def _cache_set(key: str, data):
    _weather_cache[key] = (time.time(), data)


@clima_bp.route('/actual', methods=['GET'])
def get_clima_actual():
    try:
        lat = request.args.get('lat', -15.8422)
        lon = request.args.get('lon', -70.0199)
        ciudad = request.args.get('ciudad', 'Puno')

        cache_key = f'actual_{lat}_{lon}'
        cached = _cache_get(cache_key)
        if cached:
            resp = make_response(jsonify({'success': True, 'data': cached, 'cached': True}), 200)
            resp.headers['Cache-Control'] = 'public, max-age=300'
            return resp

        url = f'{OPENWEATHER_BASE_URL}/weather'
        params = {
            'lat': lat,
            'lon': lon,
            'appid': OPENWEATHER_API_KEY,
            'units': 'metric',
            'lang': 'es'
        }

        response = requests.get(url, params=params, timeout=8)

        if response.status_code == 200:
            data = response.json()

            clima_data = {
                'ubicacion': f"{ciudad}, Perú",
                'temperatura': round(data['main']['temp'], 1),
                'sensacion_termica': round(data['main']['feels_like'], 1),
                'descripcion': data['weather'][0]['description'],
                'humedad': data['main']['humidity'],
                'presion': data['main']['pressure'],
                'velocidad_viento': round(data['wind']['speed'] * 3.6, 1),
                'nubosidad': data['clouds']['all'],
                'amanecer': datetime.fromtimestamp(data['sys']['sunrise']).isoformat(),
                'atardecer': datetime.fromtimestamp(data['sys']['sunset']).isoformat(),
                'icono': data['weather'][0]['icon']
            }

            _cache_set(cache_key, clima_data)
            resp = make_response(jsonify({'success': True, 'data': clima_data}), 200)
            resp.headers['Cache-Control'] = 'public, max-age=300'
            return resp
        else:
            return jsonify({
                'success': False,
                'message': 'Error al obtener datos del clima'
            }), 500

    except Exception as e:
        return jsonify({'success': False, 'message': 'Error interno del servidor'}), 500


@clima_bp.route('/pronostico', methods=['GET'])
def get_pronostico():
    try:
        lat = request.args.get('lat', -15.8422)
        lon = request.args.get('lon', -70.0199)

        cache_key = f'forecast_{lat}_{lon}'
        cached = _cache_get(cache_key)
        if cached:
            resp = make_response(jsonify({'success': True, 'data': cached, 'cached': True}), 200)
            resp.headers['Cache-Control'] = 'public, max-age=600'
            return resp

        url = f'{OPENWEATHER_BASE_URL}/forecast'
        params = {
            'lat': lat,
            'lon': lon,
            'appid': OPENWEATHER_API_KEY,
            'units': 'metric',
            'lang': 'es'
        }

        response = requests.get(url, params=params, timeout=8)

        if response.status_code == 200:
            data = response.json()

            pronostico_list = []
            for item in data['list']:
                pronostico_list.append({
                    'fecha_hora': item['dt_txt'],
                    'temperatura': round(item['main']['temp'], 1),
                    'sensacion_termica': round(item['main']['feels_like'], 1),
                    'descripcion': item['weather'][0]['description'],
                    'humedad': item['main']['humidity'],
                    'presion': item['main']['pressure'],
                    'velocidad_viento': round(item['wind']['speed'] * 3.6, 1),
                    'probabilidad_lluvia': round(item.get('pop', 0) * 100),
                    'icono': item['weather'][0]['icon']
                })

            _cache_set(cache_key, pronostico_list)
            resp = make_response(jsonify({'success': True, 'data': pronostico_list}), 200)
            resp.headers['Cache-Control'] = 'public, max-age=600'
            return resp
        else:
            return jsonify({
                'success': False,
                'message': 'Error al obtener pronóstico'
            }), 500

    except Exception as e:
        return jsonify({'success': False, 'message': 'Error interno del servidor'}), 500


@clima_bp.route('/alertas', methods=['GET'])
def get_alertas():
    try:
        return jsonify({'success': True, 'data': []}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': 'Error interno del servidor'}), 500


@clima_bp.route('/analisis-ia', methods=['POST'])
def analisis_clima_ia():
    try:
        data = request.get_json() or {}
        cultivos = data.get('cultivos', [])
        clima_data = data.get('clima')

        if not clima_data:
            lat = data.get('lat', -15.8422)
            lon = data.get('lon', -70.0199)
            url = f'{OPENWEATHER_BASE_URL}/weather'
            params = {
                'lat': lat, 'lon': lon,
                'appid': OPENWEATHER_API_KEY,
                'units': 'metric', 'lang': 'es'
            }
            resp = requests.get(url, params=params, timeout=8)
            if resp.status_code == 200:
                raw = resp.json()
                clima_data = {
                    'temperatura': round(raw['main']['temp'], 1),
                    'sensacion_termica': round(raw['main']['feels_like'], 1),
                    'humedad': raw['main']['humidity'],
                    'velocidad_viento': round(raw['wind']['speed'] * 3.6, 1),
                    'nubosidad': raw['clouds']['all'],
                    'descripcion': raw['weather'][0]['description']
                }
            else:
                return jsonify({'success': False, 'message': 'No se pudo obtener el clima actual'}), 502

        resultado = analizar_clima_agricola(clima_data, cultivos)

        if not resultado['success']:
            return jsonify({'success': False, 'message': resultado['error']}), 503

        return jsonify({
            'success': True,
            'clima': clima_data,
            'analisis_ia': resultado['analisis'],
            'modelo': 'llama-3.3-70b-versatile'
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'message': 'Error interno del servidor'}), 500


@clima_bp.route('/plan-semanal', methods=['POST'])
def plan_semanal_ia():
    try:
        data = request.get_json() or {}
        lat = data.get('lat', -15.8422)
        lon = data.get('lon', -70.0199)
        cultivos = data.get('cultivos', [])

        url = f'{OPENWEATHER_BASE_URL}/forecast'
        params = {
            'lat': lat, 'lon': lon,
            'appid': OPENWEATHER_API_KEY,
            'units': 'metric', 'lang': 'es'
        }
        resp = requests.get(url, params=params, timeout=8)
        if resp.status_code != 200:
            return jsonify({'success': False, 'message': 'No se pudo obtener el pronóstico'}), 502

        pronostico = []
        for item in resp.json()['list']:
            pronostico.append({
                'fecha_hora': item['dt_txt'],
                'temperatura': round(item['main']['temp'], 1),
                'humedad': item['main']['humidity'],
                'probabilidad_lluvia': round(item.get('pop', 0) * 100),
                'descripcion': item['weather'][0]['description']
            })

        resultado = analizar_pronostico_agricola(pronostico, cultivos)

        if not resultado['success']:
            return jsonify({'success': False, 'message': resultado['error']}), 503

        return jsonify({
            'success': True,
            'plan_semanal': resultado['plan'],
            'pronostico_base': pronostico[:8],
            'modelo': 'llama-3.3-70b-versatile'
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'message': 'Error interno del servidor'}), 500
