use chrono::{DateTime, Duration, TimeZone, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value;

pub const EARLIEST_ACCEPTED_UNIX: i64 = 1_577_836_800;
pub const MAX_ESP32_ID_LENGTH: usize = 64;

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Metric {
    AirTemperature,
    AirHumidity,
    SoilMoisture,
}

impl Metric {
    pub const ALL: [Metric; 3] = [
        Metric::AirTemperature,
        Metric::AirHumidity,
        Metric::SoilMoisture,
    ];

    pub fn as_str(&self) -> &'static str {
        match self {
            Self::AirTemperature => "air_temperature",
            Self::AirHumidity => "air_humidity",
            Self::SoilMoisture => "soil_moisture",
        }
    }

    pub fn parse(name: &str) -> Option<Self> {
        match name.trim().to_ascii_lowercase().as_str() {
            "air_temperature" | "temperatura" | "temperatura_aire" | "temperature" => {
                Some(Self::AirTemperature)
            }
            "air_humidity" | "humedad_aire" | "humidity" => Some(Self::AirHumidity),
            "soil_moisture" | "humedad_suelo" => Some(Self::SoilMoisture),
            _ => None,
        }
    }

    pub fn legacy_name(&self) -> &'static str {
        match self {
            Self::AirTemperature => "temperatura_aire",
            Self::AirHumidity => "humedad_aire",
            Self::SoilMoisture => "humedad_suelo",
        }
    }

    pub fn legacy_unit(&self) -> &'static str {
        match self {
            Self::AirTemperature => "Celsius",
            Self::AirHumidity | Self::SoilMoisture => "%",
        }
    }

    pub fn unit(&self) -> &'static str {
        match self {
            Self::AirTemperature => "°C",
            Self::AirHumidity | Self::SoilMoisture => "%",
        }
    }

    pub fn plausible_range(&self) -> (f64, f64) {
        match self {
            Self::AirTemperature => (-40.0, 80.0),
            Self::AirHumidity | Self::SoilMoisture => (0.0, 100.0),
        }
    }

    pub fn is_plausible(&self, value: f64) -> bool {
        let (min, max) = self.plausible_range();
        value.is_finite() && value >= min && value <= max
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct Telemetry {
    pub esp32_id: String,
    pub recorded_at: DateTime<Utc>,
    pub values: Vec<(Metric, f64)>,
    pub rejected: Vec<String>,
}

#[derive(Debug, Clone, PartialEq)]
pub enum TelemetryError {
    NoData,
    MissingEsp32Id,
    NoValidReadings(Vec<String>),
}

fn numeric(value: &Value) -> Option<f64> {
    match value {
        Value::Number(number) => number.as_f64(),
        Value::String(text) => text.trim().replace(',', ".").parse::<f64>().ok(),
        _ => None,
    }
}

fn esp32_identifier(value: Option<&Value>) -> Option<String> {
    let text = match value? {
        Value::String(text) => text.trim().to_string(),
        Value::Number(number) => number.to_string(),
        _ => return None,
    };
    if text.is_empty() || text.len() > MAX_ESP32_ID_LENGTH || text.chars().any(char::is_control) {
        None
    } else {
        Some(text)
    }
}

pub fn resolve_timestamp(raw: Option<&Value>, now: DateTime<Utc>) -> DateTime<Utc> {
    let latest_accepted = now + Duration::days(1);
    raw.and_then(numeric)
        .filter(|seconds| seconds.is_finite())
        .map(|seconds| seconds.trunc() as i64)
        .filter(|seconds| *seconds >= EARLIEST_ACCEPTED_UNIX)
        .and_then(|seconds| Utc.timestamp_opt(seconds, 0).single())
        .filter(|instant| *instant <= latest_accepted)
        .unwrap_or(now)
}

fn push_value(
    metric: Metric,
    raw: &Value,
    values: &mut Vec<(Metric, f64)>,
    rejected: &mut Vec<String>,
) {
    if raw.is_null() {
        return;
    }
    match numeric(raw) {
        Some(value) if metric.is_plausible(value) => {
            values.retain(|(existing, _)| *existing != metric);
            values.push((metric, value));
        }
        Some(value) => {
            let (min, max) = metric.plausible_range();
            rejected.push(format!(
                "{}: {value} fuera de rango [{min}, {max}]",
                metric.legacy_name()
            ));
        }
        None => rejected.push(format!("{}: valor no numérico", metric.legacy_name())),
    }
}

pub fn parse_payload(payload: &Value, now: DateTime<Utc>) -> Result<Telemetry, TelemetryError> {
    let object = match payload {
        Value::Object(object) if !object.is_empty() => object,
        _ => return Err(TelemetryError::NoData),
    };
    let esp32_id =
        esp32_identifier(object.get("esp32_id")).ok_or(TelemetryError::MissingEsp32Id)?;
    let recorded_at = resolve_timestamp(object.get("timestamp"), now);

    let mut values = Vec::new();
    let mut rejected = Vec::new();

    for key in [
        "temperatura",
        "temperatura_aire",
        "humedad_aire",
        "humedad_suelo",
    ] {
        if let (Some(raw), Some(metric)) = (object.get(key), Metric::parse(key)) {
            push_value(metric, raw, &mut values, &mut rejected);
        }
    }

    if let Some(Value::Array(items)) = object.get("lecturas") {
        for item in items {
            let kind = item.get("tipo").and_then(Value::as_str).unwrap_or("");
            let raw = item.get("valor").unwrap_or(&Value::Null);
            match Metric::parse(kind) {
                Some(metric) => push_value(metric, raw, &mut values, &mut rejected),
                None if !kind.is_empty() => {
                    rejected.push(format!("{kind}: tipo de lectura no admitido"))
                }
                None => rejected.push("lectura sin tipo".to_string()),
            }
        }
    }

    if values.is_empty() {
        return Err(TelemetryError::NoValidReadings(rejected));
    }
    Ok(Telemetry {
        esp32_id,
        recorded_at,
        values,
        rejected,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn now() -> DateTime<Utc> {
        Utc.with_ymd_and_hms(2026, 10, 15, 12, 0, 0).unwrap()
    }

    #[test]
    fn firmware_payload_is_parsed() {
        let payload = json!({
            "esp32_id": "AGV-0001",
            "temperatura": 14.5,
            "humedad_aire": 61.0,
            "humedad_suelo": 43,
            "timestamp": 1_791_000_000
        });
        let telemetry = parse_payload(&payload, now()).unwrap();
        assert_eq!(telemetry.esp32_id, "AGV-0001");
        assert_eq!(telemetry.values.len(), 3);
        assert_eq!(telemetry.recorded_at.timestamp(), 1_791_000_000);
        assert!(telemetry.rejected.is_empty());
    }

    #[test]
    fn readings_array_is_parsed() {
        let payload = json!({
            "esp32_id": "AGV-0002",
            "lecturas": [
                {"tipo": "temperatura_aire", "valor": 9.25, "unidad": "C"},
                {"tipo": "humedad_suelo", "valor": "55", "unidad": "%"},
                {"tipo": "ph", "valor": 6.5}
            ]
        });
        let telemetry = parse_payload(&payload, now()).unwrap();
        assert_eq!(
            telemetry.values,
            vec![(Metric::AirTemperature, 9.25), (Metric::SoilMoisture, 55.0)]
        );
        assert_eq!(telemetry.rejected.len(), 1);
        assert_eq!(telemetry.recorded_at, now());
    }

    #[test]
    fn implausible_values_are_rejected_individually() {
        let payload = json!({
            "esp32_id": "AGV-3",
            "temperatura": 120.0,
            "humedad_aire": 50.0,
            "humedad_suelo": -4
        });
        let telemetry = parse_payload(&payload, now()).unwrap();
        assert_eq!(telemetry.values, vec![(Metric::AirHumidity, 50.0)]);
        assert_eq!(telemetry.rejected.len(), 2);
    }

    #[test]
    fn missing_identifier_and_empty_values_fail() {
        assert_eq!(
            parse_payload(&json!({"temperatura": 10}), now()),
            Err(TelemetryError::MissingEsp32Id)
        );
        assert_eq!(
            parse_payload(&json!({"esp32_id": "  "}), now()),
            Err(TelemetryError::MissingEsp32Id)
        );
        assert_eq!(
            parse_payload(&json!({}), now()),
            Err(TelemetryError::NoData)
        );
        assert!(matches!(
            parse_payload(&json!({"esp32_id": "X", "temperatura": 200}), now()),
            Err(TelemetryError::NoValidReadings(_))
        ));
    }

    #[test]
    fn timestamps_before_2020_or_far_future_use_server_time() {
        assert_eq!(resolve_timestamp(Some(&json!(1234)), now()), now());
        assert_eq!(
            resolve_timestamp(Some(&json!(4_102_444_800_i64)), now()),
            now()
        );
        assert_eq!(resolve_timestamp(None, now()), now());
        assert_eq!(
            resolve_timestamp(Some(&json!(1_700_000_000)), now()).timestamp(),
            1_700_000_000
        );
    }

    #[test]
    fn plausibility_limits_follow_the_contract() {
        assert!(Metric::AirTemperature.is_plausible(-40.0));
        assert!(Metric::AirTemperature.is_plausible(80.0));
        assert!(!Metric::AirTemperature.is_plausible(80.1));
        assert!(!Metric::SoilMoisture.is_plausible(100.5));
        assert!(!Metric::AirHumidity.is_plausible(f64::NAN));
    }
}
