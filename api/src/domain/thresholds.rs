use serde::{Deserialize, Serialize};

use super::telemetry::Metric;

#[derive(Clone, Copy, Debug, PartialEq, Serialize, Deserialize)]
pub struct Threshold {
    pub metric: Metric,
    pub min: f64,
    pub max: f64,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AlertKind {
    Low,
    High,
    Offline,
}

impl AlertKind {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Low => "low",
            Self::High => "high",
            Self::Offline => "offline",
        }
    }

    pub fn legacy_level(&self) -> &'static str {
        match self {
            Self::Low => "bajo",
            Self::High => "alto",
            Self::Offline => "sin_conexion",
        }
    }
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Breach {
    pub metric: Metric,
    pub kind: AlertKind,
    pub value: f64,
    pub threshold: f64,
}

pub fn default_thresholds() -> [Threshold; 3] {
    [
        Threshold {
            metric: Metric::AirTemperature,
            min: 2.0,
            max: 28.0,
        },
        Threshold {
            metric: Metric::AirHumidity,
            min: 40.0,
            max: 85.0,
        },
        Threshold {
            metric: Metric::SoilMoisture,
            min: 30.0,
            max: 80.0,
        },
    ]
}

impl Threshold {
    pub fn validate(&self) -> Result<(), String> {
        let (low, high) = self.metric.plausible_range();
        if !(self.min.is_finite() && self.max.is_finite()) {
            return Err("threshold values must be finite numbers".into());
        }
        if self.min >= self.max {
            return Err(format!(
                "{}: min must be lower than max",
                self.metric.as_str()
            ));
        }
        if self.min < low || self.max > high {
            return Err(format!(
                "{}: thresholds must be within [{low}, {high}]",
                self.metric.as_str()
            ));
        }
        Ok(())
    }

    pub fn evaluate(&self, value: f64) -> Option<Breach> {
        let (kind, threshold) = if value < self.min {
            (AlertKind::Low, self.min)
        } else if value > self.max {
            (AlertKind::High, self.max)
        } else {
            return None;
        };
        Some(Breach {
            metric: self.metric,
            kind,
            value,
            threshold,
        })
    }
}

pub fn evaluate_all(thresholds: &[Threshold], values: &[(Metric, f64)]) -> Vec<Breach> {
    values
        .iter()
        .filter_map(|(metric, value)| {
            thresholds
                .iter()
                .find(|threshold| threshold.metric == *metric)
                .and_then(|threshold| threshold.evaluate(*value))
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn values_outside_the_window_breach() {
        let thresholds = default_thresholds();
        let breaches = evaluate_all(
            &thresholds,
            &[
                (Metric::AirTemperature, -1.5),
                (Metric::AirHumidity, 60.0),
                (Metric::SoilMoisture, 92.0),
            ],
        );
        assert_eq!(breaches.len(), 2);
        assert_eq!(breaches[0].kind, AlertKind::Low);
        assert_eq!(breaches[0].threshold, 2.0);
        assert_eq!(breaches[1].kind, AlertKind::High);
        assert_eq!(breaches[1].threshold, 80.0);
    }

    #[test]
    fn boundaries_are_inclusive() {
        let threshold = default_thresholds()[0];
        assert!(threshold.evaluate(2.0).is_none());
        assert!(threshold.evaluate(28.0).is_none());
    }

    #[test]
    fn validation_rejects_inverted_or_implausible_windows() {
        let mut threshold = default_thresholds()[1];
        threshold.min = 90.0;
        assert!(threshold.validate().is_err());
        threshold.min = -5.0;
        threshold.max = 50.0;
        assert!(threshold.validate().is_err());
        assert!(default_thresholds()[2].validate().is_ok());
    }
}
