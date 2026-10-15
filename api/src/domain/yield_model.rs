use serde::Serialize;

use super::species::{Species, Window};

pub const CLIMATE_FACTOR_MIN: f64 = 0.85;
pub const CLIMATE_FACTOR_MAX: f64 = 1.10;
pub const PHENOLOGY_FACTOR_MIN: f64 = 0.60;
pub const PHENOLOGY_FACTOR_MAX: f64 = 1.05;
pub const CONFIDENCE_BASE: f64 = 70.0;
pub const CONFIDENCE_CAP: f64 = 95.0;
pub const ASSUMED_DAYS_WITHOUT_SOWING_DATE: i64 = 90;
pub const SENSOR_READINGS_FOR_FULL_DATA_CREDIT: i64 = 100;

#[derive(Clone, Debug, Default, Serialize)]
pub struct ClimateObservation {
    pub mean_temperature_c: Option<f64>,
    pub mean_air_humidity_pct: Option<f64>,
    pub rainfall_30d_mm: Option<f64>,
    pub sensor_readings: i64,
    pub sources: Vec<&'static str>,
}

#[derive(Clone, Debug)]
pub struct YieldInputs<'a> {
    pub species: &'a Species,
    pub area_ha: f64,
    pub days_since_sowing: Option<i64>,
    pub climate: ClimateObservation,
}

#[derive(Clone, Debug, Serialize, PartialEq)]
pub struct WindowFactor {
    pub value: f64,
    pub observed: Option<f64>,
    pub window: [f64; 2],
}

#[derive(Clone, Debug, Serialize, PartialEq)]
pub struct PhenologyFactor {
    pub value: f64,
    pub days_since_sowing: i64,
    pub cycle_days: u32,
    pub progress: f64,
    pub assumed: bool,
}

#[derive(Clone, Debug, Serialize)]
pub struct YieldFactors {
    pub base_yield_t_ha: f64,
    pub f_cli: f64,
    pub g_temperature: WindowFactor,
    pub g_humidity: WindowFactor,
    pub g_rainfall: WindowFactor,
    pub f_phe: PhenologyFactor,
    pub f_area: f64,
    pub delta_data: f64,
    pub delta_phe: f64,
    pub sensor_readings: i64,
    pub data_sources: Vec<&'static str>,
}

#[derive(Clone, Debug, Serialize)]
pub struct YieldEstimate {
    pub species: &'static str,
    pub area_ha: f64,
    pub yield_t_ha: f64,
    pub total_t: f64,
    pub price_pen_kg: f64,
    pub revenue_pen: f64,
    pub confidence: f64,
    pub factors: YieldFactors,
}

fn round_to(value: f64, decimals: i32) -> f64 {
    let scale = 10f64.powi(decimals);
    (value * scale).round() / scale
}

pub fn window_factor(observed: Option<f64>, window: Window) -> WindowFactor {
    let value = match observed {
        None => 1.0,
        Some(x) => {
            let middle = (window.min + window.max) / 2.0;
            let half_width = ((window.max - window.min) / 2.0).max(f64::EPSILON);
            if x >= window.min && x <= window.max {
                let offset = (x - middle) / half_width;
                CLIMATE_FACTOR_MAX - 0.10 * offset * offset
            } else {
                let distance = if x < window.min {
                    window.min - x
                } else {
                    x - window.max
                };
                1.0 - (1.0 - CLIMATE_FACTOR_MIN) * (distance / half_width).min(1.0)
            }
        }
    };
    WindowFactor {
        value: round_to(value.clamp(CLIMATE_FACTOR_MIN, CLIMATE_FACTOR_MAX), 4),
        observed: observed.map(|x| round_to(x, 2)),
        window: [window.min, window.max],
    }
}

pub fn phenology_factor(days_since_sowing: Option<i64>, cycle_days: u32) -> PhenologyFactor {
    let assumed = days_since_sowing.is_none();
    let days = days_since_sowing
        .unwrap_or(ASSUMED_DAYS_WITHOUT_SOWING_DATE)
        .max(0);
    let progress = (days as f64 / f64::from(cycle_days.max(1))).min(1.0);
    PhenologyFactor {
        value: round_to(
            PHENOLOGY_FACTOR_MIN + (PHENOLOGY_FACTOR_MAX - PHENOLOGY_FACTOR_MIN) * progress,
            4,
        ),
        days_since_sowing: days,
        cycle_days,
        progress: round_to(progress, 4),
        assumed,
    }
}

pub fn area_factor(area_ha: f64) -> f64 {
    if area_ha <= 1.0 {
        0.95
    } else if area_ha <= 5.0 {
        1.0
    } else if area_ha <= 10.0 {
        1.05
    } else {
        1.08
    }
}

pub fn data_confidence_delta(climate: &ClimateObservation) -> f64 {
    let has_any = climate.mean_temperature_c.is_some()
        || climate.mean_air_humidity_pct.is_some()
        || climate.rainfall_30d_mm.is_some();
    if climate.sensor_readings >= SENSOR_READINGS_FOR_FULL_DATA_CREDIT {
        10.0
    } else if has_any {
        5.0
    } else {
        0.0
    }
}

pub fn phenology_confidence_delta(phenology: &PhenologyFactor) -> f64 {
    if phenology.assumed {
        0.0
    } else if phenology.days_since_sowing >= 60 {
        10.0
    } else if phenology.days_since_sowing >= 30 {
        5.0
    } else {
        0.0
    }
}

pub fn estimate(inputs: YieldInputs<'_>) -> YieldEstimate {
    let species = inputs.species;
    let area = inputs.area_ha.max(0.0);
    let g_temperature = window_factor(inputs.climate.mean_temperature_c, species.temperature_c);
    let g_humidity = window_factor(
        inputs.climate.mean_air_humidity_pct,
        species.air_humidity_pct,
    );
    let g_rainfall = window_factor(inputs.climate.rainfall_30d_mm, species.rainfall_30d_mm);
    let f_cli = g_temperature.value * g_humidity.value * g_rainfall.value;
    let f_phe = phenology_factor(inputs.days_since_sowing, species.cycle_days);
    let f_area = area_factor(area);

    let yield_t_ha = species.base_yield_t_ha * f_cli * f_phe.value;
    let total_t = yield_t_ha * area * f_area;
    let revenue_pen = 1000.0 * total_t * species.price_pen_kg;

    let delta_data = data_confidence_delta(&inputs.climate);
    let delta_phe = phenology_confidence_delta(&f_phe);
    let confidence = (CONFIDENCE_BASE + delta_data + delta_phe).min(CONFIDENCE_CAP);

    YieldEstimate {
        species: species.code,
        area_ha: area,
        yield_t_ha: round_to(yield_t_ha, 2),
        total_t: round_to(total_t, 2),
        price_pen_kg: species.price_pen_kg,
        revenue_pen: round_to(revenue_pen, 2),
        confidence,
        factors: YieldFactors {
            base_yield_t_ha: species.base_yield_t_ha,
            f_cli: round_to(f_cli, 4),
            g_temperature,
            g_humidity,
            g_rainfall,
            f_phe,
            f_area,
            delta_data,
            delta_phe,
            sensor_readings: inputs.climate.sensor_readings,
            data_sources: inputs.climate.sources,
        },
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::species;

    fn potato() -> &'static Species {
        species::find("potato").unwrap()
    }

    #[test]
    fn window_factor_is_bounded_and_peaks_at_the_centre() {
        let window = potato().temperature_c;
        assert_eq!(window_factor(Some(15.0), window).value, 1.10);
        assert_eq!(window_factor(Some(10.0), window).value, 1.0);
        assert_eq!(window_factor(Some(-30.0), window).value, 0.85);
        assert_eq!(window_factor(None, window).value, 1.0);
        for step in -40..60 {
            let value = window_factor(Some(f64::from(step)), window).value;
            assert!((CLIMATE_FACTOR_MIN..=CLIMATE_FACTOR_MAX).contains(&value));
        }
    }

    #[test]
    fn phenology_factor_maps_progress_to_range() {
        assert_eq!(phenology_factor(Some(0), 150).value, 0.60);
        assert_eq!(phenology_factor(Some(150), 150).value, 1.05);
        assert_eq!(phenology_factor(Some(400), 150).value, 1.05);
        assert_eq!(phenology_factor(Some(75), 150).value, 0.825);
        assert!(phenology_factor(None, 150).assumed);
    }

    #[test]
    fn area_factor_is_piecewise() {
        assert_eq!(area_factor(0.5), 0.95);
        assert_eq!(area_factor(3.0), 1.0);
        assert_eq!(area_factor(8.0), 1.05);
        assert_eq!(area_factor(25.0), 1.08);
    }

    #[test]
    fn neutral_climate_matured_crop_follows_equation_one() {
        let result = estimate(YieldInputs {
            species: potato(),
            area_ha: 2.0,
            days_since_sowing: Some(150),
            climate: ClimateObservation::default(),
        });
        let expected_per_ha: f64 = 15.5 * 1.05;
        assert!((result.yield_t_ha - (expected_per_ha * 100.0).round() / 100.0).abs() < 1e-9);
        assert!((result.total_t - (expected_per_ha * 2.0 * 100.0).round() / 100.0).abs() < 1e-9);
        assert!((result.revenue_pen - 1000.0 * expected_per_ha * 2.0 * 2.40).abs() < 1.0);
        assert_eq!(result.confidence, 80.0);
    }

    #[test]
    fn confidence_is_capped() {
        let result = estimate(YieldInputs {
            species: potato(),
            area_ha: 1.0,
            days_since_sowing: Some(100),
            climate: ClimateObservation {
                mean_temperature_c: Some(15.0),
                mean_air_humidity_pct: Some(72.0),
                rainfall_30d_mm: Some(85.0),
                sensor_readings: 500,
                sources: vec!["sensors"],
            },
        });
        assert_eq!(result.confidence, 90.0);
        assert!(result.factors.f_cli > 1.3);
        assert!(result.confidence <= CONFIDENCE_CAP);
    }
}
