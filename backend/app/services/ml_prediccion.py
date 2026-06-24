import numpy as np
from datetime import datetime, timedelta
from app.models.cultivo import Cultivo
from app.models.sensor import DatoClimatico

class PrediccionService:

    RENDIMIENTOS_PROMEDIO = {
        'Papa': 15.5,
        'Maíz': 4.2,
        'Trigo': 2.8,
        'Soja': 2.5,
        'Arroz': 7.5,
        'Tomate': 45.0,
        'Quinua': 1.8,
        'Oca': 8.5,
        'Habas': 3.5,
        'Otro': 5.0
    }

    PRECIOS_MERCADO = {
        'Papa': 2.40,
        'Maíz': 1.80,
        'Trigo': 1.50,
        'Soja': 2.20,
        'Arroz': 3.50,
        'Tomate': 3.80,
        'Quinua': 8.50,
        'Oca': 2.00,
        'Habas': 3.20,
        'Otro': 2.50
    }

    @staticmethod
    def predecir_rendimiento(cultivo_id):
        try:
            cultivo = Cultivo.query.get(cultivo_id)
            if not cultivo:
                return None

            if cultivo.fecha_siembra:
                dias_crecimiento = (datetime.utcnow().date() - cultivo.fecha_siembra).days
            else:
                dias_crecimiento = 90

            clima_query = DatoClimatico.query
            if cultivo.latitud:
                lat = float(cultivo.latitud)
                clima_query = clima_query.filter(
                    DatoClimatico.latitud.between(lat - 0.5, lat + 0.5)
                )
            datos_clima = clima_query.order_by(DatoClimatico.fecha_hora.desc()).limit(30).all()

            factor_clima = PrediccionService._calcular_factor_clima(datos_clima, cultivo.tipo_cultivo)
            factor_temporal = PrediccionService._calcular_factor_temporal(dias_crecimiento, cultivo.tipo_cultivo)
            area = float(cultivo.area_hectareas) if cultivo.area_hectareas else 1.0
            factor_area = PrediccionService._calcular_factor_area(area)

            rendimiento_base = PrediccionService.RENDIMIENTOS_PROMEDIO.get(cultivo.tipo_cultivo, 5.0)

            rendimiento_hectarea = rendimiento_base * factor_clima * factor_temporal
            rendimiento_total = rendimiento_hectarea * area * factor_area

            precio_unitario = PrediccionService.PRECIOS_MERCADO.get(cultivo.tipo_cultivo, 2.50)

            ingreso_estimado = (rendimiento_total * 1000) * precio_unitario

            confianza = PrediccionService._calcular_confianza(len(datos_clima), dias_crecimiento)

            return {
                'rendimiento_estimado': round(rendimiento_total, 2),
                'unidad': 'toneladas',
                'rendimiento_por_hectarea': round(rendimiento_hectarea, 2),
                'precio_mercado': precio_unitario,
                'ingreso_estimado': round(ingreso_estimado, 2),
                'confianza_prediccion': confianza,
                'factores': {
                    'factor_clima': round(factor_clima, 2),
                    'factor_temporal': round(factor_temporal, 2),
                    'factor_area': round(factor_area, 2),
                    'dias_crecimiento': dias_crecimiento
                }
            }

        except Exception:
            return None

    @staticmethod
    def _calcular_factor_clima(datos_clima, tipo_cultivo):
        if not datos_clima:
            return 1.0

        temp_promedio = np.mean([float(d.temperatura) for d in datos_clima if d.temperatura])
        humedad_promedio = np.mean([float(d.humedad) for d in datos_clima if d.humedad])
        precipitacion_total = np.sum([float(d.precipitacion) for d in datos_clima if d.precipitacion])

        factor = 1.0

        if tipo_cultivo == 'Papa':
            if 15 <= temp_promedio <= 20:
                factor *= 1.1
            elif temp_promedio < 10 or temp_promedio > 25:
                factor *= 0.85
        elif tipo_cultivo == 'Maíz':
            if 20 <= temp_promedio <= 30:
                factor *= 1.1
            elif temp_promedio < 15:
                factor *= 0.8

        if 60 <= humedad_promedio <= 80:
            factor *= 1.05
        elif humedad_promedio < 40 or humedad_promedio > 90:
            factor *= 0.9

        if 30 <= precipitacion_total <= 60:
            factor *= 1.05
        elif precipitacion_total < 15:
            factor *= 0.85
        elif precipitacion_total > 100:
            factor *= 0.9

        return max(0.5, min(1.3, factor))

    @staticmethod
    def _calcular_factor_temporal(dias_crecimiento, tipo_cultivo):
        ciclos = {
            'Papa': 120,
            'Maíz': 140,
            'Trigo': 150,
            'Quinua': 180,
            'Oca': 210
        }

        ciclo_esperado = ciclos.get(tipo_cultivo, 120)
        progreso = min(dias_crecimiento / ciclo_esperado, 1.0)

        factor = 0.3 + (0.7 * progreso)

        return factor

    @staticmethod
    def _calcular_factor_area(area_hectareas):
        if area_hectareas <= 1:
            return 0.95
        elif area_hectareas <= 5:
            return 1.0
        elif area_hectareas <= 10:
            return 1.05
        else:
            return 1.08

    @staticmethod
    def _calcular_confianza(num_datos_clima, dias_crecimiento):
        confianza_base = 70.0

        if num_datos_clima >= 20:
            confianza_base += 10
        elif num_datos_clima >= 10:
            confianza_base += 5

        if dias_crecimiento >= 60:
            confianza_base += 10
        elif dias_crecimiento >= 30:
            confianza_base += 5

        return min(95.0, confianza_base)

    @staticmethod
    def generar_grafico_tendencia(cultivo_id):
        try:
            cultivo = Cultivo.query.get(cultivo_id)
            if not cultivo:
                return None

            prediccion_actual = PrediccionService.predecir_rendimiento(cultivo_id)
            if not prediccion_actual:
                return None

            fecha_inicio = cultivo.fecha_siembra
            fecha_fin = cultivo.fecha_cosecha_estimada or (fecha_inicio + timedelta(days=120))

            predicciones = []
            fecha_actual = fecha_inicio

            while fecha_actual <= fecha_fin:
                dias = (fecha_actual - fecha_inicio).days
                progreso = min(dias / 120, 1.0)
                rendimiento = prediccion_actual['rendimiento_estimado'] * (0.3 + 0.7 * progreso)

                predicciones.append({
                    'fecha': fecha_actual.isoformat(),
                    'rendimiento': round(rendimiento, 2)
                })

                fecha_actual += timedelta(days=10)

            return predicciones

        except Exception:
            return None
