"""Unit tests for the deterministic yield/revenue factor model.

These exercise the estimator without a database or hardware, so reviewers and
adopters can verify the core agronomic logic in isolation.
"""
from types import SimpleNamespace

from app.services.ml_prediccion import PrediccionService as PS


def _clima(temp, hum, precip, n=5):
    """Build a list of fake climate records with the fields the model reads."""
    return [SimpleNamespace(temperatura=temp, humedad=hum, precipitacion=precip)
            for _ in range(n)]


def test_climate_factor_potato_optimal_is_boosted():
    # Potato in its optimal temperature/humidity window -> factor above 1.
    f = PS._calcular_factor_clima(_clima(17, 70, 45), 'Papa')
    assert f > 1.0


def test_climate_factor_potato_cold_is_penalised():
    # Temperature below the potato window -> penalised.
    f = PS._calcular_factor_clima(_clima(6, 70, 45), 'Papa')
    assert f < 1.0


def test_climate_factor_is_clamped():
    # The factor must stay within the documented [0.5, 1.3] band.
    hot = PS._calcular_factor_clima(_clima(40, 10, 200), 'Papa')
    good = PS._calcular_factor_clima(_clima(17, 70, 45), 'Papa')
    assert 0.5 <= hot <= 1.3
    assert 0.5 <= good <= 1.3


def test_climate_factor_no_data_is_neutral():
    assert PS._calcular_factor_clima([], 'Papa') == 1.0


def test_temporal_factor_increases_with_progress():
    early = PS._calcular_factor_temporal(10, 'Papa')
    late = PS._calcular_factor_temporal(110, 'Papa')
    assert late > early


def test_temporal_factor_saturates_at_full_cycle():
    # Progress is capped at 1.0, so days beyond the cycle do not exceed the max.
    at_cycle = PS._calcular_factor_temporal(120, 'Papa')
    beyond = PS._calcular_factor_temporal(400, 'Papa')
    assert at_cycle == beyond
    assert beyond <= 1.0


def test_area_factor_is_piecewise_and_monotone():
    assert PS._calcular_factor_area(0.5) == 0.95
    assert PS._calcular_factor_area(3) == 1.0
    assert PS._calcular_factor_area(8) == 1.05
    assert PS._calcular_factor_area(50) == 1.08


def test_base_yield_and_price_lookups_exist_for_andean_crops():
    for crop in ('Papa', 'Quinua', 'Oca'):
        assert PS.RENDIMIENTOS_PROMEDIO.get(crop) is not None
        assert PS.PRECIOS_MERCADO.get(crop) is not None
