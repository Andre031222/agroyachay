use chrono::{DateTime, Datelike, Duration, FixedOffset, NaiveDate, TimeZone, Timelike, Utc};
use serde::Serialize;

use super::astronomy::{self, PrincipalPhase, SeasonMarker};
use super::species;
use crate::i18n::Locale;

#[derive(Clone, Debug, Serialize)]
pub struct Label {
    pub code: &'static str,
    pub label: String,
}

#[derive(Clone, Debug, Serialize)]
pub struct Task {
    pub code: &'static str,
    pub label: String,
    pub traditional: bool,
}

#[derive(Clone, Debug, Serialize)]
pub struct PhaseInstant {
    pub name: &'static str,
    pub label: String,
    pub at: DateTime<FixedOffset>,
}

#[derive(Clone, Debug, Serialize)]
pub struct AlmanacDay {
    pub date: NaiveDate,
    pub phase: &'static str,
    pub phase_label: String,
    pub illumination: f64,
    pub moon_age_days: f64,
    pub sunrise: Option<String>,
    pub sunset: Option<String>,
    pub day_length_min: i64,
    pub tasks: Vec<Task>,
    pub events: Vec<Label>,
}

#[derive(Clone, Debug, Serialize)]
pub struct CalendarEntry {
    pub crop: &'static str,
    pub crop_label: String,
    pub stage: &'static str,
    pub stage_label: String,
    pub months: Vec<u32>,
}

#[derive(Clone, Debug, Serialize)]
pub struct Season {
    pub code: &'static str,
    pub name: String,
    pub native_name: &'static str,
    pub astronomical: &'static str,
    pub astronomical_label: String,
}

#[derive(Clone, Debug, Serialize)]
pub struct MonthInfo {
    pub year: i32,
    pub month: u32,
    pub name: String,
}

#[derive(Clone, Debug, Serialize)]
pub struct Almanac {
    pub month: MonthInfo,
    pub latitude: f64,
    pub longitude: f64,
    pub utc_offset_minutes: i32,
    pub season: Season,
    pub phases: Vec<PhaseInstant>,
    pub days: Vec<AlmanacDay>,
    pub month_tasks: Vec<Task>,
    pub calendar: Vec<CalendarEntry>,
    pub traditional_knowledge_note: String,
}

fn pick(locale: Locale, es: &str, en: &str) -> String {
    match locale {
        Locale::En => en.to_string(),
        _ => es.to_string(),
    }
}

pub fn phase_label(code: &str, locale: Locale) -> String {
    let (es, en) = match code {
        "new_moon" => ("Luna nueva", "New moon"),
        "waxing_crescent" => ("Luna creciente", "Waxing crescent"),
        "first_quarter" => ("Cuarto creciente", "First quarter"),
        "waxing_gibbous" => ("Gibosa creciente", "Waxing gibbous"),
        "full_moon" => ("Luna llena", "Full moon"),
        "waning_gibbous" => ("Gibosa menguante", "Waning gibbous"),
        "last_quarter" => ("Cuarto menguante", "Last quarter"),
        _ => ("Luna menguante", "Waning crescent"),
    };
    match locale {
        Locale::Qu => format!("{es} (killa)"),
        Locale::Ay => format!("{es} (phaxsi)"),
        _ => pick(locale, es, en),
    }
}

fn month_name(month: u32, locale: Locale) -> String {
    const SPANISH: [&str; 12] = [
        "enero",
        "febrero",
        "marzo",
        "abril",
        "mayo",
        "junio",
        "julio",
        "agosto",
        "septiembre",
        "octubre",
        "noviembre",
        "diciembre",
    ];
    const ENGLISH: [&str; 12] = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ];
    let index = (month.clamp(1, 12) - 1) as usize;
    pick(locale, SPANISH[index], ENGLISH[index])
}

pub fn season_for_month(month: u32, locale: Locale) -> Season {
    let (code, es, en, native) = match month {
        12 | 1..=3 => (
            "rainy",
            "Temporada de lluvias",
            "Rainy season",
            "Paray pacha / Jallu pacha",
        ),
        4 | 5 => (
            "harvest",
            "Temporada de cosecha",
            "Harvest season",
            "Aymuray pacha / Llamayu pacha",
        ),
        6..=8 => (
            "dry_frost",
            "Temporada seca y de heladas",
            "Dry and frost season",
            "Chiraw pacha / Juyphi pacha",
        ),
        _ => (
            "sowing",
            "Temporada de siembra",
            "Sowing season",
            "Tarpuy pacha / Sata pacha",
        ),
    };
    let (astronomical, astro_es, astro_en) = match month {
        12 | 1 | 2 => ("summer", "Verano austral", "Southern summer"),
        3..=5 => ("autumn", "Otoño austral", "Southern autumn"),
        6..=8 => ("winter", "Invierno austral", "Southern winter"),
        _ => ("spring", "Primavera austral", "Southern spring"),
    };
    Season {
        code,
        name: pick(locale, es, en),
        native_name: native,
        astronomical,
        astronomical_label: pick(locale, astro_es, astro_en),
    }
}

fn stage_label(stage: &str, locale: Locale) -> String {
    let (es, en) = match stage {
        "land_preparation" => ("Preparación del terreno (barbecho)", "Land preparation"),
        "sowing" => ("Siembra", "Sowing"),
        "hilling_weeding" => ("Aporque y deshierbo", "Hilling and weeding"),
        "weeding_thinning" => ("Deshierbo y raleo", "Weeding and thinning"),
        "harvest" => ("Cosecha", "Harvest"),
        "chuno_tunta_processing" => ("Elaboración de chuño y tunta", "Chuño and tunta processing"),
        "sun_curing" => ("Asoleado (caya)", "Sun curing (caya)"),
        "frost_season" => ("Temporada de heladas", "Frost season"),
        _ => ("Labores culturales", "Field work"),
    };
    pick(locale, es, en)
}

pub fn traditional_calendar() -> Vec<(&'static str, &'static str, Vec<u32>)> {
    vec![
        ("potato", "land_preparation", vec![8, 9]),
        ("potato", "sowing", vec![9, 10, 11, 12]),
        ("potato", "hilling_weeding", vec![12, 1, 2]),
        ("potato", "harvest", vec![4, 5, 6]),
        ("potato", "chuno_tunta_processing", vec![6, 7]),
        ("quinoa", "land_preparation", vec![8, 9]),
        ("quinoa", "sowing", vec![9, 10, 11]),
        ("quinoa", "weeding_thinning", vec![12, 1]),
        ("quinoa", "harvest", vec![4, 5]),
        ("maize", "sowing", vec![9, 10, 11]),
        ("maize", "hilling_weeding", vec![12, 1]),
        ("maize", "harvest", vec![4, 5, 6]),
        ("faba_bean", "sowing", vec![9, 10, 11]),
        ("faba_bean", "harvest", vec![3, 4, 5]),
        ("oca", "sowing", vec![9, 10, 11]),
        ("oca", "hilling_weeding", vec![12, 1, 2]),
        ("oca", "harvest", vec![5, 6]),
        ("oca", "sun_curing", vec![6, 7]),
        ("canihua", "sowing", vec![9, 10]),
        ("canihua", "harvest", vec![3, 4, 5]),
        ("barley", "sowing", vec![11, 12, 1]),
        ("barley", "harvest", vec![4, 5, 6]),
        ("wheat", "sowing", vec![11, 12, 1]),
        ("wheat", "harvest", vec![5, 6, 7]),
        ("all", "frost_season", vec![5, 6, 7, 8]),
    ]
}

fn crop_label(code: &str, locale: Locale) -> String {
    match species::find(code) {
        Some(found) => found.localized_name(locale).to_string(),
        None => pick(locale, "Todos los cultivos", "All crops"),
    }
}

fn month_tasks(month: u32, locale: Locale) -> Vec<Task> {
    let mut tasks = Vec::new();
    let mut add = |code: &'static str, es: &str, en: &str| {
        tasks.push(Task {
            code,
            label: pick(locale, es, en),
            traditional: false,
        })
    };
    if matches!(month, 8 | 9) {
        add(
            "land_preparation",
            "Preparar el terreno: barbecho, roturación y abonamiento de fondo",
            "Prepare the land: ploughing and basal manuring",
        );
    }
    if matches!(month, 9..=12) {
        add(
            "main_sowing",
            "Campaña grande de siembra (papa, quinua, haba, oca)",
            "Main sowing campaign (potato, quinoa, faba bean, oca)",
        );
    }
    if matches!(month, 12 | 1 | 2) {
        add(
            "hilling_weeding",
            "Aporque y deshierbo de papa, oca y maíz",
            "Hilling and weeding of potato, oca and maize",
        );
        add(
            "late_blight_watch",
            "Vigilar rancha (Phytophthora infestans) en días húmedos",
            "Watch for late blight (Phytophthora infestans) on humid days",
        );
    }
    if matches!(month, 4..=6) {
        add(
            "harvest",
            "Cosecha y selección de semilla",
            "Harvest and seed selection",
        );
    }
    if matches!(month, 6 | 7) {
        add(
            "chuno_tunta",
            "Elaboración de chuño y tunta aprovechando las heladas",
            "Chuño and tunta processing using night frosts",
        );
    }
    if matches!(month, 5..=8) {
        add(
            "frost_protection",
            "Proteger cultivos y almácigos de heladas nocturnas",
            "Protect crops and nurseries from night frosts",
        );
    }
    if matches!(month, 3) {
        add(
            "pre_harvest_monitoring",
            "Monitorear madurez y gorgojo de los Andes antes de la cosecha",
            "Monitor maturity and Andean weevil before harvest",
        );
    }
    tasks
}

fn moon_tasks(phase: &str, locale: Locale) -> Vec<Task> {
    let mut tasks = Vec::new();
    let mut add = |code: &'static str, es: &str, en: &str| {
        tasks.push(Task {
            code,
            label: pick(locale, es, en),
            traditional: true,
        })
    };
    if phase == "new_moon" {
        add(
            "rest_and_soil_work",
            "Descanso de siembra; labores de suelo y abonamiento",
            "No sowing; soil work and manuring",
        );
    } else if astronomy::is_waxing(phase) {
        add(
            "sow_above_ground",
            "Sembrar cultivos de fruto aéreo (quinua, maíz, haba, cereales)",
            "Sow crops harvested above ground (quinoa, maize, faba bean, cereals)",
        );
    } else if phase == "full_moon" {
        add(
            "harvest_for_storage",
            "Cosechar granos destinados a almacenamiento",
            "Harvest grain intended for storage",
        );
    } else if astronomy::is_waning(phase) {
        add(
            "sow_tubers",
            "Sembrar tubérculos y raíces (papa, oca); deshierbar",
            "Sow tubers and roots (potato, oca); weed",
        );
    }
    tasks
}

fn fixed_observances(date: NaiveDate, locale: Locale) -> Vec<Label> {
    let mut events = Vec::new();
    match (date.month(), date.day()) {
        (2, 2) => events.push(Label {
            code: "candelaria",
            label: pick(
                locale,
                "Fiesta de la Virgen de la Candelaria",
                "Feast of the Virgin of Candelaria",
            ),
        }),
        (6, 24) => events.push(Label {
            code: "inti_raymi",
            label: pick(locale, "Inti Raymi", "Inti Raymi (Festival of the Sun)"),
        }),
        (8, 1) => events.push(Label {
            code: "pachamama",
            label: pick(
                locale,
                "Ofrenda a la Pachamama",
                "Offering to the Pachamama",
            ),
        }),
        _ => {}
    }
    events
}

fn season_marker_label(marker: SeasonMarker, locale: Locale) -> Label {
    let (code, es, en) = match marker {
        SeasonMarker::MarchEquinox => (
            "march_equinox",
            "Equinoccio de otoño austral",
            "Southern autumn equinox",
        ),
        SeasonMarker::JuneSolstice => (
            "june_solstice",
            "Solsticio de invierno austral; Willkakuti, Año Nuevo Andino",
            "Southern winter solstice; Willkakuti, Andean New Year",
        ),
        SeasonMarker::SeptemberEquinox => (
            "september_equinox",
            "Equinoccio de primavera austral",
            "Southern spring equinox",
        ),
        SeasonMarker::DecemberSolstice => (
            "december_solstice",
            "Solsticio de verano austral",
            "Southern summer solstice",
        ),
    };
    Label {
        code,
        label: pick(locale, es, en),
    }
}

pub fn default_utc_offset_minutes(longitude: f64) -> i32 {
    ((longitude / 15.0).round() as i32 * 60).clamp(-720, 840)
}

pub fn build(
    year: i32,
    month: u32,
    latitude: f64,
    longitude: f64,
    utc_offset_minutes: i32,
    locale: Locale,
) -> Option<Almanac> {
    let offset = FixedOffset::east_opt(utc_offset_minutes * 60)?;
    let first_day = NaiveDate::from_ymd_opt(year, month, 1)?;
    let next_month_first_day = if month == 12 {
        NaiveDate::from_ymd_opt(year + 1, 1, 1)?
    } else {
        NaiveDate::from_ymd_opt(year, month + 1, 1)?
    };
    let local_midnight = |date: NaiveDate| -> Option<DateTime<Utc>> {
        offset
            .from_local_datetime(&date.and_hms_opt(0, 0, 0)?)
            .single()
            .map(|instant| instant.with_timezone(&Utc))
    };
    let month_start = local_midnight(first_day)?;
    let month_end = local_midnight(next_month_first_day)?;

    let principal = astronomy::principal_phases_between(month_start, month_end);
    let phases: Vec<PhaseInstant> = principal
        .iter()
        .map(|(phase, instant)| PhaseInstant {
            name: phase.code(),
            label: phase_label(phase.code(), locale),
            at: instant
                .with_nanosecond(0)
                .unwrap_or(*instant)
                .with_timezone(&offset),
        })
        .collect();

    let markers: Vec<(SeasonMarker, NaiveDate)> = SeasonMarker::ALL
        .iter()
        .map(|marker| {
            let local = astronomy::season_marker_instant(year, *marker).with_timezone(&offset);
            (*marker, local.date_naive())
        })
        .collect();

    let mut days = Vec::new();
    let mut date = first_day;
    while date < next_month_first_day {
        let day_start = local_midnight(date)?;
        let day_end = day_start + Duration::days(1);
        let local_noon = day_start + Duration::hours(12);
        let age = astronomy::moon_age_days(local_noon);
        let principal_today = principal
            .iter()
            .find(|(_, instant)| *instant >= day_start && *instant < day_end)
            .map(|(phase, _)| *phase);
        let phase_code = principal_today
            .map(|phase: PrincipalPhase| phase.code())
            .unwrap_or_else(|| astronomy::phase_code_from_age(age));

        let sun = astronomy::sun_events(date, latitude, longitude);
        let mut events = fixed_observances(date, locale);
        for (marker, marker_date) in &markers {
            if *marker_date == date {
                events.push(season_marker_label(*marker, locale));
            }
        }
        if let Some(phase) = principal_today {
            events.push(Label {
                code: phase.code(),
                label: phase_label(phase.code(), locale),
            });
        }

        days.push(AlmanacDay {
            date,
            phase: phase_code,
            phase_label: phase_label(phase_code, locale),
            illumination: (astronomy::illumination_fraction(age) * 1000.0).round() / 10.0,
            moon_age_days: (age * 10.0).round() / 10.0,
            sunrise: sun
                .sunrise_utc_minutes
                .map(|minutes| astronomy::format_clock(minutes, utc_offset_minutes)),
            sunset: sun
                .sunset_utc_minutes
                .map(|minutes| astronomy::format_clock(minutes, utc_offset_minutes)),
            day_length_min: sun.day_length_minutes.round() as i64,
            tasks: moon_tasks(phase_code, locale),
            events,
        });
        date = date.succ_opt()?;
    }

    let calendar = traditional_calendar()
        .into_iter()
        .map(|(crop, stage, months)| CalendarEntry {
            crop,
            crop_label: crop_label(crop, locale),
            stage,
            stage_label: stage_label(stage, locale),
            months,
        })
        .collect();

    Some(Almanac {
        month: MonthInfo {
            year,
            month,
            name: month_name(month, locale),
        },
        latitude,
        longitude,
        utc_offset_minutes,
        season: season_for_month(month, locale),
        phases,
        days,
        month_tasks: month_tasks(month, locale),
        calendar,
        traditional_knowledge_note: pick(
            locale,
            "Las prácticas asociadas a la luna son conocimiento tradicional andino, no evidencia agronómica.",
            "Moon-related practices are traditional Andean knowledge, not agronomic evidence.",
        ),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn october_2026_in_puno_has_every_day_and_four_phases() {
        let almanac = build(2026, 10, -15.84, -70.02, -300, Locale::Es).unwrap();
        assert_eq!(almanac.days.len(), 31);
        assert!(almanac.phases.len() >= 4);
        assert_eq!(almanac.season.code, "sowing");
        assert!(almanac.month_tasks.iter().any(|t| t.code == "main_sowing"));
        let principal_days = almanac
            .days
            .iter()
            .filter(|day| day.events.iter().any(|e| e.code == "full_moon"))
            .count();
        assert!(principal_days >= 1);
        assert!(almanac.days.iter().all(|day| day.sunrise.is_some()));
        assert!(
            almanac
                .days
                .iter()
                .flat_map(|day| day.tasks.iter())
                .all(|task| task.traditional)
        );
    }

    #[test]
    fn june_contains_inti_raymi_and_solstice() {
        let almanac = build(2026, 6, -15.84, -70.02, -300, Locale::En).unwrap();
        let events: Vec<&str> = almanac
            .days
            .iter()
            .flat_map(|day| day.events.iter().map(|event| event.code))
            .collect();
        assert!(events.contains(&"inti_raymi"));
        assert!(events.contains(&"june_solstice"));
        assert_eq!(almanac.season.code, "dry_frost");
    }

    #[test]
    fn offset_defaults_from_longitude() {
        assert_eq!(default_utc_offset_minutes(-70.02), -300);
        assert_eq!(default_utc_offset_minutes(-77.03), -300);
        assert_eq!(default_utc_offset_minutes(0.0), 0);
    }
}
