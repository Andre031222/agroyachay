use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, Instant};

use serde::Serialize;
use serde_json::Value;
use tokio::sync::Mutex;

use crate::domain::agro_weather::{DailyForecast, HourlyForecast};
use crate::error::AppError;

pub const CACHE_TTL: Duration = Duration::from_secs(600);
pub const CLIMATE_CACHE_TTL: Duration = Duration::from_secs(3600);

#[derive(Clone, Debug, Serialize)]
pub struct CurrentWeather {
    pub time: String,
    pub temperature: Option<f64>,
    pub apparent_temperature: Option<f64>,
    pub humidity: Option<f64>,
    pub precipitation_mm: Option<f64>,
    pub weather_code: Option<i64>,
    pub cloud_cover: Option<f64>,
    pub wind_kmh: Option<f64>,
    pub wind_direction: Option<f64>,
    pub is_day: Option<bool>,
}

#[derive(Clone, Debug, Serialize)]
pub struct Forecast {
    pub latitude: f64,
    pub longitude: f64,
    pub elevation: Option<f64>,
    pub timezone: String,
    pub utc_offset_seconds: i64,
    pub current: CurrentWeather,
    pub hourly: Vec<HourlyForecast>,
    pub daily: Vec<DailyForecast>,
}

impl Forecast {
    pub fn next_hours(&self, count: usize) -> Vec<HourlyForecast> {
        let current_hour: String = self.current.time.chars().take(13).collect();
        let start = self
            .hourly
            .iter()
            .position(|hour| hour.time.as_str() >= current_hour.as_str())
            .unwrap_or(0);
        self.hourly
            .iter()
            .skip(start)
            .take(count)
            .cloned()
            .collect()
    }
}

#[derive(Clone, Debug, Default, Serialize)]
pub struct ClimateSummary {
    pub mean_temperature_c: Option<f64>,
    pub mean_air_humidity_pct: Option<f64>,
    pub rainfall_30d_mm: Option<f64>,
}

type CacheKey = (i32, i32);
type ForecastCache = HashMap<CacheKey, (Instant, Arc<Forecast>)>;
type ClimateCache = HashMap<CacheKey, (Instant, ClimateSummary)>;

#[derive(Clone)]
pub struct WeatherClient {
    http: reqwest::Client,
    base_url: String,
    forecasts: Arc<Mutex<ForecastCache>>,
    climates: Arc<Mutex<ClimateCache>>,
}

fn cache_key(latitude: f64, longitude: f64) -> CacheKey {
    (
        (latitude * 100.0).round() as i32,
        (longitude * 100.0).round() as i32,
    )
}

fn number_at(values: Option<&Value>, index: usize) -> Option<f64> {
    values?.as_array()?.get(index)?.as_f64()
}

fn integer_at(values: Option<&Value>, index: usize) -> Option<i64> {
    values?.as_array()?.get(index)?.as_f64().map(|v| v as i64)
}

fn text_at(values: Option<&Value>, index: usize) -> Option<String> {
    values?.as_array()?.get(index)?.as_str().map(str::to_string)
}

fn mean(values: &[f64]) -> Option<f64> {
    if values.is_empty() {
        None
    } else {
        Some(values.iter().sum::<f64>() / values.len() as f64)
    }
}

pub fn parse_forecast(payload: &Value) -> Result<Forecast, String> {
    let current = payload.get("current").ok_or("missing current block")?;
    let hourly = payload.get("hourly").ok_or("missing hourly block")?;
    let daily = payload.get("daily").ok_or("missing daily block")?;

    let hourly_times = hourly
        .get("time")
        .and_then(Value::as_array)
        .ok_or("missing hourly time")?;
    let hourly_rows = hourly_times
        .iter()
        .enumerate()
        .filter_map(|(index, time)| {
            Some(HourlyForecast {
                time: time.as_str()?.to_string(),
                temperature: number_at(hourly.get("temperature_2m"), index),
                humidity: number_at(hourly.get("relative_humidity_2m"), index),
                precipitation_mm: number_at(hourly.get("precipitation"), index),
                precipitation_probability: number_at(
                    hourly.get("precipitation_probability"),
                    index,
                ),
                wind_kmh: number_at(hourly.get("wind_speed_10m"), index),
                weather_code: integer_at(hourly.get("weather_code"), index),
            })
        })
        .collect();

    let daily_times = daily
        .get("time")
        .and_then(Value::as_array)
        .ok_or("missing daily time")?;
    let daily_rows = daily_times
        .iter()
        .enumerate()
        .filter_map(|(index, date)| {
            Some(DailyForecast {
                date: date.as_str()?.to_string(),
                weather_code: integer_at(daily.get("weather_code"), index),
                temperature_min: number_at(daily.get("temperature_2m_min"), index),
                temperature_max: number_at(daily.get("temperature_2m_max"), index),
                precipitation_mm: number_at(daily.get("precipitation_sum"), index),
                precipitation_probability: number_at(
                    daily.get("precipitation_probability_max"),
                    index,
                ),
                et0_mm: number_at(daily.get("et0_fao_evapotranspiration"), index),
                wind_max_kmh: number_at(daily.get("wind_speed_10m_max"), index),
                uv_index_max: number_at(daily.get("uv_index_max"), index),
                sunrise: text_at(daily.get("sunrise"), index),
                sunset: text_at(daily.get("sunset"), index),
            })
        })
        .collect();

    let current_number = |key: &str| current.get(key).and_then(Value::as_f64);
    Ok(Forecast {
        latitude: payload
            .get("latitude")
            .and_then(Value::as_f64)
            .unwrap_or_default(),
        longitude: payload
            .get("longitude")
            .and_then(Value::as_f64)
            .unwrap_or_default(),
        elevation: payload.get("elevation").and_then(Value::as_f64),
        timezone: payload
            .get("timezone")
            .and_then(Value::as_str)
            .unwrap_or("UTC")
            .to_string(),
        utc_offset_seconds: payload
            .get("utc_offset_seconds")
            .and_then(Value::as_i64)
            .unwrap_or_default(),
        current: CurrentWeather {
            time: current
                .get("time")
                .and_then(Value::as_str)
                .unwrap_or_default()
                .to_string(),
            temperature: current_number("temperature_2m"),
            apparent_temperature: current_number("apparent_temperature"),
            humidity: current_number("relative_humidity_2m"),
            precipitation_mm: current_number("precipitation"),
            weather_code: current_number("weather_code").map(|code| code as i64),
            cloud_cover: current_number("cloud_cover"),
            wind_kmh: current_number("wind_speed_10m"),
            wind_direction: current_number("wind_direction_10m"),
            is_day: current_number("is_day").map(|flag| flag >= 1.0),
        },
        hourly: hourly_rows,
        daily: daily_rows,
    })
}

pub fn parse_climate(payload: &Value) -> ClimateSummary {
    let daily = payload.get("daily");
    let collect = |key: &str| -> Vec<f64> {
        daily
            .and_then(|block| block.get(key))
            .and_then(Value::as_array)
            .map(|values| values.iter().filter_map(Value::as_f64).collect())
            .unwrap_or_default()
    };
    let temperatures = collect("temperature_2m_mean");
    let humidities = collect("relative_humidity_2m_mean");
    let rainfall = collect("precipitation_sum");
    ClimateSummary {
        mean_temperature_c: mean(&temperatures),
        mean_air_humidity_pct: mean(&humidities),
        rainfall_30d_mm: if rainfall.is_empty() {
            None
        } else {
            Some(rainfall.iter().sum())
        },
    }
}

impl WeatherClient {
    pub fn new(http: reqwest::Client, base_url: &str) -> Self {
        Self {
            http,
            base_url: base_url.to_string(),
            forecasts: Arc::new(Mutex::new(HashMap::new())),
            climates: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    async fn fetch(&self, query: &[(&str, String)]) -> Result<Value, AppError> {
        let response = self
            .http
            .get(&self.base_url)
            .query(query)
            .timeout(Duration::from_secs(12))
            .send()
            .await
            .map_err(|error| AppError::WeatherUnavailable(error.to_string()))?;
        if !response.status().is_success() {
            return Err(AppError::WeatherUnavailable(format!(
                "open-meteo status {}",
                response.status()
            )));
        }
        response
            .json::<Value>()
            .await
            .map_err(|error| AppError::WeatherUnavailable(error.to_string()))
    }

    pub async fn forecast(&self, latitude: f64, longitude: f64) -> Result<Arc<Forecast>, AppError> {
        let key = cache_key(latitude, longitude);
        if let Some((stored_at, forecast)) = self.forecasts.lock().await.get(&key)
            && stored_at.elapsed() < CACHE_TTL
        {
            return Ok(forecast.clone());
        }
        let query = [
            ("latitude", format!("{:.2}", latitude)),
            ("longitude", format!("{:.2}", longitude)),
            (
                "current",
                "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,is_day".to_string(),
            ),
            (
                "hourly",
                "temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m".to_string(),
            ),
            (
                "daily",
                "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,et0_fao_evapotranspiration,wind_speed_10m_max,uv_index_max,sunrise,sunset".to_string(),
            ),
            ("timezone", "auto".to_string()),
            ("forecast_days", "7".to_string()),
            ("wind_speed_unit", "kmh".to_string()),
        ];
        let payload = self.fetch(&query).await?;
        let forecast = Arc::new(parse_forecast(&payload).map_err(AppError::WeatherUnavailable)?);
        let mut cache = self.forecasts.lock().await;
        cache.retain(|_, (stored_at, _)| stored_at.elapsed() < CACHE_TTL);
        cache.insert(key, (Instant::now(), forecast.clone()));
        Ok(forecast)
    }

    pub async fn recent_climate(
        &self,
        latitude: f64,
        longitude: f64,
    ) -> Result<ClimateSummary, AppError> {
        let key = cache_key(latitude, longitude);
        if let Some((stored_at, summary)) = self.climates.lock().await.get(&key)
            && stored_at.elapsed() < CLIMATE_CACHE_TTL
        {
            return Ok(summary.clone());
        }
        let query = [
            ("latitude", format!("{:.2}", latitude)),
            ("longitude", format!("{:.2}", longitude)),
            (
                "daily",
                "temperature_2m_mean,relative_humidity_2m_mean,precipitation_sum".to_string(),
            ),
            ("past_days", "30".to_string()),
            ("forecast_days", "1".to_string()),
            ("timezone", "auto".to_string()),
        ];
        let payload = self.fetch(&query).await?;
        let summary = parse_climate(&payload);
        let mut cache = self.climates.lock().await;
        cache.retain(|_, (stored_at, _)| stored_at.elapsed() < CLIMATE_CACHE_TTL);
        cache.insert(key, (Instant::now(), summary.clone()));
        Ok(summary)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn open_meteo_payload_is_parsed() {
        let payload = json!({
            "latitude": -15.84, "longitude": -70.02, "elevation": 3827.0,
            "timezone": "America/Lima", "utc_offset_seconds": -18000,
            "current": {"time": "2026-10-15T10:15", "temperature_2m": 11.2, "relative_humidity_2m": 40,
                        "wind_speed_10m": 9.4, "weather_code": 2, "is_day": 1},
            "hourly": {"time": ["2026-10-15T09:00", "2026-10-15T10:00", "2026-10-15T11:00"],
                       "temperature_2m": [9.0, 11.0, 12.5], "wind_speed_10m": [5.0, 6.0, 7.0],
                       "precipitation": [0.0, 0.0, 0.0], "precipitation_probability": [0, 5, 10]},
            "daily": {"time": ["2026-10-15"], "temperature_2m_min": [-1.5], "temperature_2m_max": [17.0],
                      "precipitation_sum": [0.2], "et0_fao_evapotranspiration": [4.1]}
        });
        let forecast = parse_forecast(&payload).unwrap();
        assert_eq!(forecast.daily[0].temperature_min, Some(-1.5));
        assert_eq!(forecast.current.is_day, Some(true));
        assert_eq!(forecast.next_hours(24).len(), 2);
        assert_eq!(forecast.next_hours(24)[0].time, "2026-10-15T10:00");
    }

    #[test]
    fn climate_summary_averages_and_sums() {
        let payload = json!({"daily": {
            "temperature_2m_mean": [10.0, 12.0, null],
            "relative_humidity_2m_mean": [60.0, 70.0],
            "precipitation_sum": [1.0, 2.5, 0.5]
        }});
        let summary = parse_climate(&payload);
        assert_eq!(summary.mean_temperature_c, Some(11.0));
        assert_eq!(summary.rainfall_30d_mm, Some(4.0));
    }
}
