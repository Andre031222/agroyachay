use serde::{Deserialize, Serialize};

use crate::i18n::Locale;

pub const FROST_THRESHOLD_C: f64 = 2.0;
pub const SEVERE_FROST_THRESHOLD_C: f64 = -2.0;
pub const HEAT_STRESS_THRESHOLD_C: f64 = 28.0;
pub const SPRAY_MAX_WIND_KMH: f64 = 15.0;
pub const SPRAY_MAX_RAIN_PROBABILITY: f64 = 30.0;
pub const SPRAY_FIRST_HOUR: u32 = 8;
pub const SPRAY_LAST_HOUR: u32 = 17;

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct DailyForecast {
    pub date: String,
    pub weather_code: Option<i64>,
    pub temperature_min: Option<f64>,
    pub temperature_max: Option<f64>,
    pub precipitation_mm: Option<f64>,
    pub precipitation_probability: Option<f64>,
    pub et0_mm: Option<f64>,
    pub wind_max_kmh: Option<f64>,
    pub uv_index_max: Option<f64>,
    pub sunrise: Option<String>,
    pub sunset: Option<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct HourlyForecast {
    pub time: String,
    pub temperature: Option<f64>,
    pub humidity: Option<f64>,
    pub precipitation_mm: Option<f64>,
    pub precipitation_probability: Option<f64>,
    pub wind_kmh: Option<f64>,
    pub weather_code: Option<i64>,
}

#[derive(Clone, Debug, Serialize, PartialEq)]
pub struct FrostRisk {
    pub risk: bool,
    pub level: &'static str,
    pub min_temperature: Option<f64>,
    pub days: Vec<String>,
}

#[derive(Clone, Debug, Serialize, PartialEq)]
pub struct HeatStress {
    pub risk: bool,
    pub max_temperature: Option<f64>,
    pub days: Vec<String>,
}

#[derive(Clone, Debug, Serialize, PartialEq)]
pub struct SprayWindow {
    pub start: String,
    pub end: String,
    pub hours: u32,
}

#[derive(Clone, Debug, Serialize, PartialEq)]
pub struct IrrigationHint {
    pub code: &'static str,
    pub balance_mm: f64,
    pub message: String,
}

#[derive(Clone, Debug, Serialize, PartialEq)]
pub struct AgroIndicators {
    pub frost_risk: FrostRisk,
    pub heat_stress: HeatStress,
    pub rain_7d_mm: f64,
    pub et0_7d_mm: f64,
    pub spray_windows: Vec<SprayWindow>,
    pub irrigation_hint: IrrigationHint,
}

fn round1(value: f64) -> f64 {
    (value * 10.0).round() / 10.0
}

fn hour_of(time: &str) -> Option<u32> {
    time.split('T').nth(1)?.get(0..2)?.parse().ok()
}

fn is_sprayable(hour: &HourlyForecast) -> bool {
    let Some(clock) = hour_of(&hour.time) else {
        return false;
    };
    let in_daylight = (SPRAY_FIRST_HOUR..SPRAY_LAST_HOUR).contains(&clock);
    let calm = hour.wind_kmh.is_some_and(|wind| wind < SPRAY_MAX_WIND_KMH);
    let dry = hour.precipitation_mm.unwrap_or(0.0) <= 0.0
        && hour
            .precipitation_probability
            .is_none_or(|probability| probability < SPRAY_MAX_RAIN_PROBABILITY);
    in_daylight && calm && dry
}

fn end_of_hour(time: &str) -> String {
    match (time.split_once('T'), hour_of(time)) {
        (Some((date, _)), Some(hour)) => format!("{date}T{:02}:00", hour + 1),
        _ => time.to_string(),
    }
}

pub fn spray_windows(hours: &[HourlyForecast]) -> Vec<SprayWindow> {
    let mut windows: Vec<SprayWindow> = Vec::new();
    let mut current: Option<(String, String, u32)> = None;
    let mut previous_date: Option<String> = None;
    for hour in hours {
        let date = hour.time.split('T').next().unwrap_or("").to_string();
        let continues_same_day = previous_date.as_deref() == Some(date.as_str());
        if is_sprayable(hour) {
            current = match current.take() {
                Some((start, _, count)) if continues_same_day => {
                    Some((start, end_of_hour(&hour.time), count + 1))
                }
                Some((start, end, count)) => {
                    windows.push(SprayWindow {
                        start,
                        end,
                        hours: count,
                    });
                    Some((hour.time.clone(), end_of_hour(&hour.time), 1))
                }
                None => Some((hour.time.clone(), end_of_hour(&hour.time), 1)),
            };
        } else if let Some((start, end, count)) = current.take() {
            windows.push(SprayWindow {
                start,
                end,
                hours: count,
            });
        }
        previous_date = Some(date);
    }
    if let Some((start, end, count)) = current {
        windows.push(SprayWindow {
            start,
            end,
            hours: count,
        });
    }
    windows.retain(|window| window.hours >= 2);
    windows
}

pub fn irrigation_hint(rain_mm: f64, et0_mm: f64, locale: Locale) -> IrrigationHint {
    let balance = round1(rain_mm - et0_mm);
    let (code, es, en) = if balance < -15.0 {
        (
            "irrigate",
            "Déficit hídrico: programa riego esta semana.",
            "Water deficit: schedule irrigation this week.",
        )
    } else if balance < -5.0 {
        (
            "monitor",
            "Balance ligeramente negativo: revisa la humedad del suelo.",
            "Slightly negative balance: check soil moisture.",
        )
    } else {
        (
            "not_needed",
            "La lluvia prevista cubre la demanda; no se requiere riego.",
            "Expected rain covers crop demand; no irrigation needed.",
        )
    };
    IrrigationHint {
        code,
        balance_mm: balance,
        message: match locale {
            Locale::En => en.to_string(),
            _ => es.to_string(),
        },
    }
}

pub fn indicators(
    daily: &[DailyForecast],
    next_hours: &[HourlyForecast],
    locale: Locale,
) -> AgroIndicators {
    let week: Vec<&DailyForecast> = daily.iter().take(7).collect();
    let min_temperature = week
        .iter()
        .filter_map(|day| day.temperature_min)
        .reduce(f64::min);
    let max_temperature = week
        .iter()
        .filter_map(|day| day.temperature_max)
        .reduce(f64::max);
    let frost_days: Vec<String> = week
        .iter()
        .filter(|day| day.temperature_min.is_some_and(|t| t <= FROST_THRESHOLD_C))
        .map(|day| day.date.clone())
        .collect();
    let heat_days: Vec<String> = week
        .iter()
        .filter(|day| {
            day.temperature_max
                .is_some_and(|t| t >= HEAT_STRESS_THRESHOLD_C)
        })
        .map(|day| day.date.clone())
        .collect();
    let rain = round1(week.iter().filter_map(|day| day.precipitation_mm).sum());
    let et0 = round1(week.iter().filter_map(|day| day.et0_mm).sum());
    let frost_level = match min_temperature {
        Some(t) if t <= SEVERE_FROST_THRESHOLD_C => "severe",
        Some(t) if t <= FROST_THRESHOLD_C => "moderate",
        _ => "none",
    };
    AgroIndicators {
        frost_risk: FrostRisk {
            risk: !frost_days.is_empty(),
            level: frost_level,
            min_temperature,
            days: frost_days,
        },
        heat_stress: HeatStress {
            risk: !heat_days.is_empty(),
            max_temperature,
            days: heat_days,
        },
        rain_7d_mm: rain,
        et0_7d_mm: et0,
        spray_windows: spray_windows(next_hours),
        irrigation_hint: irrigation_hint(rain, et0, locale),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn hour(time: &str, wind: f64, rain: f64, probability: f64) -> HourlyForecast {
        HourlyForecast {
            time: time.to_string(),
            temperature: Some(12.0),
            humidity: Some(50.0),
            precipitation_mm: Some(rain),
            precipitation_probability: Some(probability),
            wind_kmh: Some(wind),
            weather_code: Some(0),
        }
    }

    fn day(date: &str, min: f64, max: f64, rain: f64, et0: f64) -> DailyForecast {
        DailyForecast {
            date: date.to_string(),
            weather_code: Some(1),
            temperature_min: Some(min),
            temperature_max: Some(max),
            precipitation_mm: Some(rain),
            precipitation_probability: Some(10.0),
            et0_mm: Some(et0),
            wind_max_kmh: Some(10.0),
            uv_index_max: Some(12.0),
            sunrise: None,
            sunset: None,
        }
    }

    #[test]
    fn spray_windows_group_calm_dry_daylight_hours() {
        let hours = vec![
            hour("2026-10-15T07:00", 5.0, 0.0, 0.0),
            hour("2026-10-15T08:00", 5.0, 0.0, 0.0),
            hour("2026-10-15T09:00", 8.0, 0.0, 10.0),
            hour("2026-10-15T10:00", 20.0, 0.0, 0.0),
            hour("2026-10-15T11:00", 6.0, 0.0, 0.0),
            hour("2026-10-15T12:00", 6.0, 0.4, 60.0),
            hour("2026-10-15T15:00", 4.0, 0.0, 0.0),
            hour("2026-10-15T16:00", 4.0, 0.0, 0.0),
            hour("2026-10-15T17:00", 4.0, 0.0, 0.0),
        ];
        let windows = spray_windows(&hours);
        assert_eq!(
            windows,
            vec![
                SprayWindow {
                    start: "2026-10-15T08:00".into(),
                    end: "2026-10-15T10:00".into(),
                    hours: 2
                },
                SprayWindow {
                    start: "2026-10-15T15:00".into(),
                    end: "2026-10-15T17:00".into(),
                    hours: 2
                },
            ]
        );
    }

    #[test]
    fn frost_heat_and_water_balance() {
        let daily = vec![
            day("2026-07-01", -4.0, 14.0, 0.0, 3.5),
            day("2026-07-02", 1.5, 15.0, 0.0, 3.5),
            day("2026-07-03", 4.0, 29.0, 0.0, 3.5),
            day("2026-07-04", 5.0, 16.0, 0.0, 3.5),
            day("2026-07-05", 5.0, 16.0, 0.0, 3.5),
            day("2026-07-06", 5.0, 16.0, 0.0, 3.5),
            day("2026-07-07", 5.0, 16.0, 0.0, 3.5),
        ];
        let result = indicators(&daily, &[], Locale::Es);
        assert!(result.frost_risk.risk);
        assert_eq!(result.frost_risk.level, "severe");
        assert_eq!(result.frost_risk.days.len(), 2);
        assert!(result.heat_stress.risk);
        assert_eq!(result.et0_7d_mm, 24.5);
        assert_eq!(result.irrigation_hint.code, "irrigate");
        assert_eq!(irrigation_hint(30.0, 25.0, Locale::En).code, "not_needed");
        assert_eq!(irrigation_hint(20.0, 30.0, Locale::En).code, "monitor");
    }
}
