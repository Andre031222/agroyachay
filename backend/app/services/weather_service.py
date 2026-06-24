import requests
import os
from datetime import datetime
from app.models.sensor import DatoClimatico
from app.models import db

class WeatherService:
    BASE_URL = "https://api.openweathermap.org/data/2.5"
    API_KEY = os.getenv('OPENWEATHER_API_KEY')

    @staticmethod
    def get_current_weather(lat, lon, ciudad="Puno"):
        try:
            url = f"{WeatherService.BASE_URL}/weather"
            params = {
                'lat': lat,
                'lon': lon,
                'appid': WeatherService.API_KEY,
                'units': 'metric',
                'lang': 'es'
            }

            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()

            dato_climatico = DatoClimatico(
                ubicacion=ciudad,
                latitud=lat,
                longitud=lon,
                temperatura=data['main']['temp'],
                humedad=data['main']['humidity'],
                precipitacion=data.get('rain', {}).get('1h', 0),
                velocidad_viento=data['wind']['speed'],
                presion_atmosferica=data['main']['pressure'],
                descripcion=data['weather'][0]['description'],
                icono=data['weather'][0]['icon']
            )
            db.session.add(dato_climatico)
            db.session.commit()

            return {
                'temperatura': data['main']['temp'],
                'sensacion_termica': data['main']['feels_like'],
                'temp_min': data['main']['temp_min'],
                'temp_max': data['main']['temp_max'],
                'presion': data['main']['pressure'],
                'humedad': data['main']['humidity'],
                'velocidad_viento': data['wind']['speed'],
                'direccion_viento': data['wind'].get('deg', 0),
                'nubosidad': data['clouds']['all'],
                'precipitacion': data.get('rain', {}).get('1h', 0),
                'descripcion': data['weather'][0]['description'],
                'icono': data['weather'][0]['icon'],
                'amanecer': datetime.fromtimestamp(data['sys']['sunrise']).isoformat(),
                'atardecer': datetime.fromtimestamp(data['sys']['sunset']).isoformat(),
                'ubicacion': data['name']
            }
        except Exception:
            return None

    @staticmethod
    def get_forecast(lat, lon):
        try:
            url = f"{WeatherService.BASE_URL}/forecast"
            params = {
                'lat': lat,
                'lon': lon,
                'appid': WeatherService.API_KEY,
                'units': 'metric',
                'lang': 'es'
            }

            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()

            forecast = []
            for item in data['list']:
                forecast.append({
                    'fecha_hora': datetime.fromtimestamp(item['dt']).isoformat(),
                    'temperatura': item['main']['temp'],
                    'temp_min': item['main']['temp_min'],
                    'temp_max': item['main']['temp_max'],
                    'humedad': item['main']['humidity'],
                    'precipitacion': item.get('rain', {}).get('3h', 0),
                    'velocidad_viento': item['wind']['speed'],
                    'descripcion': item['weather'][0]['description'],
                    'icono': item['weather'][0]['icon']
                })

            return forecast
        except Exception:
            return []

    @staticmethod
    def get_weather_alerts(lat, lon):
        weather = WeatherService.get_current_weather(lat, lon)
        if not weather:
            return []

        alerts = []

        if weather['temperatura'] < 5:
            alerts.append({
                'tipo': 'helada',
                'severidad': 'alta',
                'mensaje': f"Temperatura mínima esperada: {weather['temp_min']}°C esta noche",
                'recomendacion': 'Proteger cultivos sensibles a heladas'
            })

        if weather['humedad'] < 40:
            alerts.append({
                'tipo': 'sequia',
                'severidad': 'media',
                'mensaje': 'Condiciones secas - Revisar riego de cultivos',
                'recomendacion': 'Aumentar frecuencia de riego'
            })

        if weather['precipitacion'] > 10:
            alerts.append({
                'tipo': 'lluvia',
                'severidad': 'media',
                'mensaje': 'Precipitaciones intensas esperadas',
                'recomendacion': 'Revisar drenaje de parcelas'
            })

        if weather['velocidad_viento'] > 30:
            alerts.append({
                'tipo': 'viento',
                'severidad': 'alta',
                'mensaje': f'Vientos fuertes de {weather["velocidad_viento"]} km/h',
                'recomendacion': 'Reforzar estructuras y tutores'
            })

        return alerts
