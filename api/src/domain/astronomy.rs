use std::f64::consts::PI;

use chrono::{DateTime, Datelike, NaiveDate, TimeZone, Utc};

pub const SYNODIC_MONTH_DAYS: f64 = 29.530588853;
pub const UNIX_EPOCH_JULIAN_DAY: f64 = 2440587.5;
pub const DELTA_T_SECONDS: f64 = 69.0;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum PrincipalPhase {
    NewMoon,
    FirstQuarter,
    FullMoon,
    LastQuarter,
}

impl PrincipalPhase {
    pub const ALL: [PrincipalPhase; 4] = [
        PrincipalPhase::NewMoon,
        PrincipalPhase::FirstQuarter,
        PrincipalPhase::FullMoon,
        PrincipalPhase::LastQuarter,
    ];

    pub fn fraction(&self) -> f64 {
        match self {
            Self::NewMoon => 0.0,
            Self::FirstQuarter => 0.25,
            Self::FullMoon => 0.5,
            Self::LastQuarter => 0.75,
        }
    }

    pub fn code(&self) -> &'static str {
        match self {
            Self::NewMoon => "new_moon",
            Self::FirstQuarter => "first_quarter",
            Self::FullMoon => "full_moon",
            Self::LastQuarter => "last_quarter",
        }
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum SeasonMarker {
    MarchEquinox,
    JuneSolstice,
    SeptemberEquinox,
    DecemberSolstice,
}

impl SeasonMarker {
    pub const ALL: [SeasonMarker; 4] = [
        SeasonMarker::MarchEquinox,
        SeasonMarker::JuneSolstice,
        SeasonMarker::SeptemberEquinox,
        SeasonMarker::DecemberSolstice,
    ];
}

fn radians(degrees: f64) -> f64 {
    degrees * PI / 180.0
}

fn degrees(radians: f64) -> f64 {
    radians * 180.0 / PI
}

fn normalize_degrees(value: f64) -> f64 {
    value.rem_euclid(360.0)
}

pub fn julian_day(instant: DateTime<Utc>) -> f64 {
    instant.timestamp_millis() as f64 / 86400000.0 + UNIX_EPOCH_JULIAN_DAY
}

pub fn instant_from_julian_day(julian_day: f64) -> DateTime<Utc> {
    let millis = ((julian_day - UNIX_EPOCH_JULIAN_DAY) * 86400000.0).round() as i64;
    Utc.timestamp_millis_opt(millis)
        .single()
        .unwrap_or_else(Utc::now)
}

fn terrestrial_to_universal(julian_ephemeris_day: f64) -> DateTime<Utc> {
    instant_from_julian_day(julian_ephemeris_day - DELTA_T_SECONDS / 86400.0)
}

pub fn moon_phase_instant(k: f64) -> DateTime<Utc> {
    let phase_fraction = k - k.floor();
    let t = k / 1236.85;
    let t2 = t * t;
    let t3 = t2 * t;
    let t4 = t3 * t;

    let mut jde =
        2451550.09766 + 29.530588861 * k + 0.00015437 * t2 - 0.000000150 * t3 + 0.00000000073 * t4;
    let e = 1.0 - 0.002516 * t - 0.0000074 * t2;
    let m = radians(normalize_degrees(
        2.5534 + 29.10535670 * k - 0.0000014 * t2 - 0.00000011 * t3,
    ));
    let mp = radians(normalize_degrees(
        201.5643 + 385.81693528 * k + 0.0107582 * t2 + 0.00001238 * t3 - 0.000000058 * t4,
    ));
    let f = radians(normalize_degrees(
        160.7108 + 390.67050284 * k - 0.0016118 * t2 - 0.00000227 * t3 + 0.000000011 * t4,
    ));
    let omega = radians(normalize_degrees(
        124.7746 - 1.56375588 * k + 0.0020672 * t2 + 0.00000215 * t3,
    ));

    let sin = f64::sin;
    let cos = f64::cos;
    let is_new = phase_fraction < 0.125 || phase_fraction >= 0.875;
    let is_full = (0.375..0.625).contains(&phase_fraction);

    let correction = if is_new || is_full {
        let (a, b, c, d, g) = if is_new {
            (-0.40720, 0.17241, 0.01608, 0.01039, 0.00739)
        } else {
            (-0.40614, 0.17302, 0.01614, 0.01043, 0.00734)
        };
        let (h, i) = if is_new {
            (-0.00514, 0.00208)
        } else {
            (-0.00515, 0.00209)
        };
        a * sin(mp)
            + b * e * sin(m)
            + c * sin(2.0 * mp)
            + d * sin(2.0 * f)
            + g * e * sin(mp - m)
            + h * e * sin(mp + m)
            + i * e * e * sin(2.0 * m)
            - 0.00111 * sin(mp - 2.0 * f)
            - 0.00057 * sin(mp + 2.0 * f)
            + 0.00056 * e * sin(2.0 * mp + m)
            - 0.00042 * sin(3.0 * mp)
            + 0.00042 * e * sin(m + 2.0 * f)
            + 0.00038 * e * sin(m - 2.0 * f)
            - 0.00024 * e * sin(2.0 * mp - m)
            - 0.00017 * sin(omega)
            - 0.00007 * sin(mp + 2.0 * m)
            + 0.00004 * sin(2.0 * mp - 2.0 * f)
            + 0.00004 * sin(3.0 * m)
            + 0.00003 * sin(mp + m - 2.0 * f)
            + 0.00003 * sin(2.0 * mp + 2.0 * f)
            - 0.00003 * sin(mp + m + 2.0 * f)
            + 0.00003 * sin(mp - m + 2.0 * f)
            - 0.00002 * sin(mp - m - 2.0 * f)
            - 0.00002 * sin(3.0 * mp + m)
            + 0.00002 * sin(4.0 * mp)
    } else {
        let quarter = -0.62801 * sin(mp) + 0.17172 * e * sin(m) - 0.01183 * e * sin(mp + m)
            + 0.00862 * sin(2.0 * mp)
            + 0.00804 * sin(2.0 * f)
            + 0.00454 * e * sin(mp - m)
            + 0.00204 * e * e * sin(2.0 * m)
            - 0.00180 * sin(mp - 2.0 * f)
            - 0.00070 * sin(mp + 2.0 * f)
            - 0.00040 * sin(3.0 * mp)
            - 0.00034 * e * sin(2.0 * mp - m)
            + 0.00032 * e * sin(m + 2.0 * f)
            + 0.00032 * e * sin(m - 2.0 * f)
            - 0.00028 * e * e * sin(mp + 2.0 * m)
            + 0.00027 * e * sin(2.0 * mp + m)
            - 0.00017 * sin(omega)
            - 0.00005 * sin(mp - m - 2.0 * f)
            + 0.00004 * sin(2.0 * mp + 2.0 * f)
            - 0.00004 * sin(mp + m + 2.0 * f)
            + 0.00004 * sin(mp - 2.0 * m)
            + 0.00003 * sin(mp + m - 2.0 * f)
            + 0.00003 * sin(3.0 * m)
            + 0.00002 * sin(2.0 * mp - 2.0 * f)
            + 0.00002 * sin(mp - m + 2.0 * f)
            - 0.00002 * sin(3.0 * mp + m);
        let w = 0.00306 - 0.00038 * e * cos(m) + 0.00026 * cos(mp) - 0.00002 * cos(mp - m)
            + 0.00002 * cos(mp + m)
            + 0.00002 * cos(2.0 * f);
        if phase_fraction < 0.5 {
            quarter + w
        } else {
            quarter - w
        }
    };
    jde += correction;

    let planetary: [(f64, f64, f64, f64); 14] = [
        (325.0, 299.77, 0.107408, -0.009173),
        (165.0, 251.88, 0.016321, 0.0),
        (164.0, 251.83, 26.651886, 0.0),
        (126.0, 349.42, 36.412478, 0.0),
        (110.0, 84.66, 18.206239, 0.0),
        (62.0, 141.74, 53.303771, 0.0),
        (60.0, 207.14, 2.453732, 0.0),
        (56.0, 154.84, 7.306860, 0.0),
        (47.0, 34.52, 27.261239, 0.0),
        (42.0, 207.19, 0.121824, 0.0),
        (40.0, 291.34, 1.844379, 0.0),
        (37.0, 161.72, 24.198154, 0.0),
        (35.0, 239.56, 25.513099, 0.0),
        (23.0, 331.55, 3.592518, 0.0),
    ];
    jde += planetary
        .iter()
        .map(|(coefficient, base, rate, quadratic)| {
            coefficient * 1e-6 * sin(radians(base + rate * k + quadratic * t2))
        })
        .sum::<f64>();

    terrestrial_to_universal(jde)
}

pub fn principal_phases_between(
    start: DateTime<Utc>,
    end: DateTime<Utc>,
) -> Vec<(PrincipalPhase, DateTime<Utc>)> {
    let years_since_2000 = (julian_day(start) - 2451545.0) / 365.25;
    let first_k = (years_since_2000 * 12.3685).floor() - 2.0;
    let mut phases = Vec::new();
    for lunation in 0..6 {
        for phase in PrincipalPhase::ALL {
            let k = first_k + f64::from(lunation) + phase.fraction();
            let instant = moon_phase_instant(k);
            if instant >= start && instant < end {
                phases.push((phase, instant));
            }
        }
    }
    phases.sort_by_key(|(_, instant)| *instant);
    phases
}

pub fn reference_new_moon() -> DateTime<Utc> {
    Utc.with_ymd_and_hms(2000, 1, 6, 18, 14, 0)
        .single()
        .unwrap_or_else(Utc::now)
}

pub fn moon_age_days(instant: DateTime<Utc>) -> f64 {
    let elapsed_days = (instant - reference_new_moon()).num_milliseconds() as f64 / 86400000.0;
    elapsed_days.rem_euclid(SYNODIC_MONTH_DAYS)
}

pub fn illumination_fraction(age_days: f64) -> f64 {
    (1.0 - (2.0 * PI * age_days / SYNODIC_MONTH_DAYS).cos()) / 2.0
}

pub fn phase_code_from_age(age_days: f64) -> &'static str {
    let octant = ((age_days / SYNODIC_MONTH_DAYS) * 8.0 + 0.5).floor() as i64 % 8;
    match octant {
        0 => "new_moon",
        1 => "waxing_crescent",
        2 => "first_quarter",
        3 => "waxing_gibbous",
        4 => "full_moon",
        5 => "waning_gibbous",
        6 => "last_quarter",
        _ => "waning_crescent",
    }
}

pub fn is_waxing(phase_code: &str) -> bool {
    matches!(
        phase_code,
        "waxing_crescent" | "first_quarter" | "waxing_gibbous"
    )
}

pub fn is_waning(phase_code: &str) -> bool {
    matches!(
        phase_code,
        "waning_gibbous" | "last_quarter" | "waning_crescent"
    )
}

pub fn season_marker_instant(year: i32, marker: SeasonMarker) -> DateTime<Utc> {
    let y = (f64::from(year) - 2000.0) / 1000.0;
    let y2 = y * y;
    let y3 = y2 * y;
    let y4 = y3 * y;
    let mean = match marker {
        SeasonMarker::MarchEquinox => {
            2451623.80984 + 365242.37404 * y + 0.05169 * y2 - 0.00411 * y3 - 0.00057 * y4
        }
        SeasonMarker::JuneSolstice => {
            2451716.56767 + 365241.62603 * y + 0.00325 * y2 + 0.00888 * y3 - 0.00030 * y4
        }
        SeasonMarker::SeptemberEquinox => {
            2451810.21715 + 365242.01767 * y - 0.11575 * y2 + 0.00337 * y3 + 0.00078 * y4
        }
        SeasonMarker::DecemberSolstice => {
            2451900.05952 + 365242.74049 * y - 0.06223 * y2 - 0.00823 * y3 + 0.00032 * y4
        }
    };
    let t = (mean - 2451545.0) / 36525.0;
    let w = radians(35999.373 * t - 2.47);
    let delta_lambda = 1.0 + 0.0334 * w.cos() + 0.0007 * (2.0 * w).cos();
    let periodic: [(f64, f64, f64); 24] = [
        (485.0, 324.96, 1934.136),
        (203.0, 337.23, 32964.467),
        (199.0, 342.08, 20.186),
        (182.0, 27.85, 445267.112),
        (156.0, 73.14, 45036.886),
        (136.0, 171.52, 22518.443),
        (77.0, 222.54, 65928.934),
        (74.0, 296.72, 3034.906),
        (70.0, 243.58, 9037.513),
        (58.0, 119.81, 33718.147),
        (52.0, 297.17, 150.678),
        (50.0, 21.02, 2281.226),
        (45.0, 247.54, 29929.562),
        (44.0, 325.15, 31555.956),
        (29.0, 60.93, 4443.417),
        (18.0, 155.12, 67555.328),
        (17.0, 288.79, 4562.452),
        (16.0, 198.04, 62894.029),
        (14.0, 199.76, 31436.921),
        (12.0, 95.39, 14577.848),
        (12.0, 287.11, 31931.756),
        (12.0, 320.81, 34777.259),
        (9.0, 227.73, 1222.114),
        (8.0, 15.45, 16859.074),
    ];
    let s: f64 = periodic
        .iter()
        .map(|(a, b, c)| a * radians(b + c * t).cos())
        .sum();
    terrestrial_to_universal(mean + 0.00001 * s / delta_lambda)
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub struct SunEvents {
    pub sunrise_utc_minutes: Option<f64>,
    pub sunset_utc_minutes: Option<f64>,
    pub solar_noon_utc_minutes: f64,
    pub day_length_minutes: f64,
}

pub fn sun_events(date: NaiveDate, latitude: f64, longitude: f64) -> SunEvents {
    let noon_utc = Utc
        .with_ymd_and_hms(date.year(), date.month(), date.day(), 12, 0, 0)
        .single()
        .unwrap_or_else(Utc::now);
    let jd = julian_day(noon_utc) - longitude / 360.0;
    let jc = (jd - 2451545.0) / 36525.0;

    let mean_longitude = normalize_degrees(280.46646 + jc * (36000.76983 + jc * 0.0003032));
    let mean_anomaly = 357.52911 + jc * (35999.05029 - 0.0001537 * jc);
    let eccentricity = 0.016708634 - jc * (0.000042037 + 0.0000001267 * jc);
    let anomaly_rad = radians(mean_anomaly);
    let center = anomaly_rad.sin() * (1.914602 - jc * (0.004817 + 0.000014 * jc))
        + (2.0 * anomaly_rad).sin() * (0.019993 - 0.000101 * jc)
        + (3.0 * anomaly_rad).sin() * 0.000289;
    let true_longitude = mean_longitude + center;
    let omega = 125.04 - 1934.136 * jc;
    let apparent_longitude = true_longitude - 0.00569 - 0.00478 * radians(omega).sin();
    let mean_obliquity =
        23.0 + (26.0 + (21.448 - jc * (46.815 + jc * (0.00059 - jc * 0.001813))) / 60.0) / 60.0;
    let obliquity = mean_obliquity + 0.00256 * radians(omega).cos();
    let declination = (radians(obliquity).sin() * radians(apparent_longitude).sin()).asin();
    let y = (radians(obliquity) / 2.0).tan().powi(2);
    let l0 = radians(mean_longitude);
    let equation_of_time = 4.0
        * degrees(
            y * (2.0 * l0).sin() - 2.0 * eccentricity * anomaly_rad.sin()
                + 4.0 * eccentricity * y * anomaly_rad.sin() * (2.0 * l0).cos()
                - 0.5 * y * y * (4.0 * l0).sin()
                - 1.25 * eccentricity * eccentricity * (2.0 * anomaly_rad).sin(),
        );

    let solar_noon = 720.0 - 4.0 * longitude - equation_of_time;
    let latitude_rad = radians(latitude);
    let cos_hour_angle = radians(90.833).cos() / (latitude_rad.cos() * declination.cos())
        - latitude_rad.tan() * declination.tan();

    if cos_hour_angle > 1.0 {
        return SunEvents {
            sunrise_utc_minutes: None,
            sunset_utc_minutes: None,
            solar_noon_utc_minutes: solar_noon,
            day_length_minutes: 0.0,
        };
    }
    if cos_hour_angle < -1.0 {
        return SunEvents {
            sunrise_utc_minutes: None,
            sunset_utc_minutes: None,
            solar_noon_utc_minutes: solar_noon,
            day_length_minutes: 1440.0,
        };
    }
    let hour_angle = degrees(cos_hour_angle.acos());
    SunEvents {
        sunrise_utc_minutes: Some(solar_noon - 4.0 * hour_angle),
        sunset_utc_minutes: Some(solar_noon + 4.0 * hour_angle),
        solar_noon_utc_minutes: solar_noon,
        day_length_minutes: 8.0 * hour_angle,
    }
}

pub fn format_clock(utc_minutes: f64, offset_minutes: i32) -> String {
    let local = (utc_minutes + f64::from(offset_minutes)).rem_euclid(1440.0);
    let rounded = local.round() as i64 % 1440;
    format!("{:02}:{:02}", rounded / 60, rounded % 60)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn assert_close(actual: DateTime<Utc>, expected: DateTime<Utc>, tolerance_minutes: i64) {
        let difference = (actual - expected).num_minutes().abs();
        assert!(
            difference <= tolerance_minutes,
            "expected {expected}, got {actual}"
        );
    }

    #[test]
    fn meeus_example_49a_new_moon_february_1977() {
        let instant = moon_phase_instant(-283.0);
        let expected = Utc.with_ymd_and_hms(1977, 2, 18, 3, 37, 0).unwrap();
        assert_close(instant, expected, 2);
    }

    #[test]
    fn eclipse_new_moon_april_2024() {
        let start = Utc.with_ymd_and_hms(2024, 4, 1, 0, 0, 0).unwrap();
        let end = Utc.with_ymd_and_hms(2024, 5, 1, 0, 0, 0).unwrap();
        let phases = principal_phases_between(start, end);
        let new_moon = phases
            .iter()
            .find(|(phase, _)| *phase == PrincipalPhase::NewMoon)
            .unwrap();
        assert_close(
            new_moon.1,
            Utc.with_ymd_and_hms(2024, 4, 8, 18, 21, 0).unwrap(),
            3,
        );
        let full_moon = phases
            .iter()
            .find(|(phase, _)| *phase == PrincipalPhase::FullMoon)
            .unwrap();
        assert_close(
            full_moon.1,
            Utc.with_ymd_and_hms(2024, 4, 23, 23, 49, 0).unwrap(),
            3,
        );
        assert_eq!(phases.len(), 4);
    }

    #[test]
    fn quarter_phase_in_january_2025() {
        let start = Utc.with_ymd_and_hms(2025, 1, 1, 0, 0, 0).unwrap();
        let end = Utc.with_ymd_and_hms(2025, 2, 1, 0, 0, 0).unwrap();
        let phases = principal_phases_between(start, end);
        let first_quarter = phases
            .iter()
            .find(|(phase, _)| *phase == PrincipalPhase::FirstQuarter)
            .unwrap();
        assert_close(
            first_quarter.1,
            Utc.with_ymd_and_hms(2025, 1, 6, 23, 56, 0).unwrap(),
            3,
        );
    }

    #[test]
    fn equinox_and_solstice_2024() {
        assert_close(
            season_marker_instant(2024, SeasonMarker::MarchEquinox),
            Utc.with_ymd_and_hms(2024, 3, 20, 3, 6, 0).unwrap(),
            3,
        );
        assert_close(
            season_marker_instant(2024, SeasonMarker::JuneSolstice),
            Utc.with_ymd_and_hms(2024, 6, 20, 20, 51, 0).unwrap(),
            3,
        );
        assert_close(
            season_marker_instant(2024, SeasonMarker::DecemberSolstice),
            Utc.with_ymd_and_hms(2024, 12, 21, 9, 20, 0).unwrap(),
            3,
        );
    }

    #[test]
    fn moon_age_and_illumination() {
        let reference = reference_new_moon();
        assert!(moon_age_days(reference) < 1e-6);
        assert_eq!(phase_code_from_age(0.2), "new_moon");
        assert_eq!(phase_code_from_age(SYNODIC_MONTH_DAYS / 2.0), "full_moon");
        assert!((illumination_fraction(SYNODIC_MONTH_DAYS / 2.0) - 1.0).abs() < 1e-9);
        assert_eq!(phase_code_from_age(SYNODIC_MONTH_DAYS * 0.99), "new_moon");
    }

    #[test]
    fn noaa_sunrise_for_puno_and_equator() {
        let date = NaiveDate::from_ymd_opt(2026, 10, 15).unwrap();
        let puno = sun_events(date, -15.84, -70.02);
        let sunrise = format_clock(puno.sunrise_utc_minutes.unwrap(), -300);
        let sunset = format_clock(puno.sunset_utc_minutes.unwrap(), -300);
        assert!(("05:10".."05:25").contains(&sunrise.as_str()), "{sunrise}");
        assert!(("17:30".."17:50").contains(&sunset.as_str()), "{sunset}");
        assert!(puno.day_length_minutes > 740.0 && puno.day_length_minutes < 760.0);

        let equinox = NaiveDate::from_ymd_opt(2026, 3, 20).unwrap();
        let equator = sun_events(equinox, 0.0, 0.0);
        assert!((equator.day_length_minutes - 727.0).abs() < 3.0);
    }

    #[test]
    fn polar_night_has_no_sunrise() {
        let date = NaiveDate::from_ymd_opt(2026, 12, 21).unwrap();
        let events = sun_events(date, 80.0, 0.0);
        assert!(events.sunrise_utc_minutes.is_none());
        assert_eq!(events.day_length_minutes, 0.0);
    }
}
