use serde::Serialize;

#[derive(Clone, Copy, Debug, Serialize)]
pub struct Window {
    pub min: f64,
    pub max: f64,
}

#[derive(Clone, Copy, Debug, Serialize)]
pub struct NutrientDemand {
    pub n_kg_ha: f64,
    pub p2o5_kg_ha: f64,
    pub k2o_kg_ha: f64,
}

#[derive(Clone, Copy, Debug, Serialize)]
pub struct Species {
    pub code: &'static str,
    pub name_es: &'static str,
    pub name_en: &'static str,
    pub name_qu: &'static str,
    pub name_ay: &'static str,
    pub scientific_name: &'static str,
    pub base_yield_t_ha: f64,
    pub price_pen_kg: f64,
    pub cycle_days: u32,
    pub temperature_c: Window,
    pub air_humidity_pct: Window,
    pub rainfall_30d_mm: Window,
    pub altitude_m: Window,
    pub nutrients: NutrientDemand,
    pub seed_rate_kg_ha: f64,
    pub labour_days_ha: f64,
    pub sowing_months: &'static [u32],
    pub harvest_months: &'static [u32],
}

const fn window(min: f64, max: f64) -> Window {
    Window { min, max }
}

const fn npk(n: f64, p: f64, k: f64) -> NutrientDemand {
    NutrientDemand {
        n_kg_ha: n,
        p2o5_kg_ha: p,
        k2o_kg_ha: k,
    }
}

pub const SPECIES: [Species; 8] = [
    Species {
        code: "potato",
        name_es: "Papa",
        name_en: "Potato",
        name_qu: "Papa",
        name_ay: "Ch'uqi",
        scientific_name: "Solanum tuberosum",
        base_yield_t_ha: 15.5,
        price_pen_kg: 2.40,
        cycle_days: 150,
        temperature_c: window(10.0, 20.0),
        air_humidity_pct: window(60.0, 85.0),
        rainfall_30d_mm: window(50.0, 120.0),
        altitude_m: window(2500.0, 4200.0),
        nutrients: npk(160.0, 120.0, 100.0),
        seed_rate_kg_ha: 1800.0,
        labour_days_ha: 120.0,
        sowing_months: &[9, 10, 11],
        harvest_months: &[4, 5, 6],
    },
    Species {
        code: "quinoa",
        name_es: "Quinua",
        name_en: "Quinoa",
        name_qu: "Kinwa",
        name_ay: "Jupha",
        scientific_name: "Chenopodium quinoa",
        base_yield_t_ha: 1.8,
        price_pen_kg: 8.50,
        cycle_days: 160,
        temperature_c: window(8.0, 20.0),
        air_humidity_pct: window(40.0, 75.0),
        rainfall_30d_mm: window(25.0, 90.0),
        altitude_m: window(2500.0, 4000.0),
        nutrients: npk(80.0, 60.0, 40.0),
        seed_rate_kg_ha: 10.0,
        labour_days_ha: 45.0,
        sowing_months: &[9, 10, 11],
        harvest_months: &[4, 5],
    },
    Species {
        code: "maize",
        name_es: "Maíz",
        name_en: "Maize",
        name_qu: "Sara",
        name_ay: "Tunqu",
        scientific_name: "Zea mays",
        base_yield_t_ha: 3.5,
        price_pen_kg: 1.80,
        cycle_days: 180,
        temperature_c: window(14.0, 26.0),
        air_humidity_pct: window(55.0, 85.0),
        rainfall_30d_mm: window(60.0, 150.0),
        altitude_m: window(1500.0, 3500.0),
        nutrients: npk(120.0, 80.0, 60.0),
        seed_rate_kg_ha: 30.0,
        labour_days_ha: 60.0,
        sowing_months: &[9, 10, 11],
        harvest_months: &[4, 5, 6],
    },
    Species {
        code: "faba_bean",
        name_es: "Haba",
        name_en: "Faba bean",
        name_qu: "Hawas",
        name_ay: "Jawasa",
        scientific_name: "Vicia faba",
        base_yield_t_ha: 2.0,
        price_pen_kg: 3.50,
        cycle_days: 170,
        temperature_c: window(8.0, 20.0),
        air_humidity_pct: window(55.0, 85.0),
        rainfall_30d_mm: window(40.0, 110.0),
        altitude_m: window(2500.0, 3900.0),
        nutrients: npk(20.0, 60.0, 40.0),
        seed_rate_kg_ha: 120.0,
        labour_days_ha: 55.0,
        sowing_months: &[9, 10, 11],
        harvest_months: &[3, 4, 5],
    },
    Species {
        code: "oca",
        name_es: "Oca",
        name_en: "Oca",
        name_qu: "Oqa",
        name_ay: "Apilla",
        scientific_name: "Oxalis tuberosa",
        base_yield_t_ha: 8.5,
        price_pen_kg: 2.00,
        cycle_days: 210,
        temperature_c: window(8.0, 18.0),
        air_humidity_pct: window(60.0, 85.0),
        rainfall_30d_mm: window(50.0, 120.0),
        altitude_m: window(3000.0, 4100.0),
        nutrients: npk(80.0, 60.0, 60.0),
        seed_rate_kg_ha: 1200.0,
        labour_days_ha: 100.0,
        sowing_months: &[9, 10, 11],
        harvest_months: &[5, 6],
    },
    Species {
        code: "canihua",
        name_es: "Cañihua",
        name_en: "Cañihua",
        name_qu: "Qañiwa",
        name_ay: "Qañawa",
        scientific_name: "Chenopodium pallidicaule",
        base_yield_t_ha: 1.0,
        price_pen_kg: 9.00,
        cycle_days: 150,
        temperature_c: window(5.0, 16.0),
        air_humidity_pct: window(40.0, 75.0),
        rainfall_30d_mm: window(20.0, 80.0),
        altitude_m: window(3600.0, 4400.0),
        nutrients: npk(40.0, 40.0, 20.0),
        seed_rate_kg_ha: 6.0,
        labour_days_ha: 40.0,
        sowing_months: &[9, 10, 11],
        harvest_months: &[3, 4, 5],
    },
    Species {
        code: "barley",
        name_es: "Cebada",
        name_en: "Barley",
        name_qu: "Siwara",
        name_ay: "Siwara",
        scientific_name: "Hordeum vulgare",
        base_yield_t_ha: 2.2,
        price_pen_kg: 1.50,
        cycle_days: 140,
        temperature_c: window(8.0, 20.0),
        air_humidity_pct: window(45.0, 80.0),
        rainfall_30d_mm: window(30.0, 100.0),
        altitude_m: window(2800.0, 4200.0),
        nutrients: npk(80.0, 60.0, 30.0),
        seed_rate_kg_ha: 100.0,
        labour_days_ha: 35.0,
        sowing_months: &[11, 12, 1],
        harvest_months: &[4, 5, 6],
    },
    Species {
        code: "wheat",
        name_es: "Trigo",
        name_en: "Wheat",
        name_qu: "Triwu",
        name_ay: "Triku",
        scientific_name: "Triticum aestivum",
        base_yield_t_ha: 2.0,
        price_pen_kg: 1.70,
        cycle_days: 150,
        temperature_c: window(10.0, 22.0),
        air_humidity_pct: window(45.0, 80.0),
        rainfall_30d_mm: window(30.0, 100.0),
        altitude_m: window(2500.0, 3800.0),
        nutrients: npk(90.0, 60.0, 30.0),
        seed_rate_kg_ha: 120.0,
        labour_days_ha: 35.0,
        sowing_months: &[11, 12, 1],
        harvest_months: &[5, 6, 7],
    },
];

pub const OTHER_SPECIES: &str = "other";

pub fn find(code: &str) -> Option<&'static Species> {
    let normalized = normalize(code);
    SPECIES.iter().find(|species| species.code == normalized)
}

pub fn is_known_or_other(code: &str) -> bool {
    find(code).is_some() || normalize(code) == OTHER_SPECIES
}

pub fn normalize(raw: &str) -> String {
    let lowered = raw.trim().to_lowercase();
    let mapped = match lowered.as_str() {
        "papa" | "patata" | "ch'uqi" => "potato",
        "quinua" | "quinoa" | "kinwa" => "quinoa",
        "maíz" | "maiz" | "corn" | "sara" => "maize",
        "haba" | "habas" | "faba" | "faba bean" | "faba_bean" | "broad bean" => "faba_bean",
        "oca" | "oqa" => "oca",
        "cañihua" | "canihua" | "kañiwa" | "qañiwa" => "canihua",
        "cebada" | "barley" => "barley",
        "trigo" | "wheat" => "wheat",
        other => other,
    };
    mapped.to_string()
}

impl Species {
    pub fn localized_name(&self, locale: crate::i18n::Locale) -> &'static str {
        match locale {
            crate::i18n::Locale::Es => self.name_es,
            crate::i18n::Locale::En => self.name_en,
            crate::i18n::Locale::Qu => self.name_qu,
            crate::i18n::Locale::Ay => self.name_ay,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn spanish_names_map_to_codes() {
        assert_eq!(find("Papa").map(|s| s.code), Some("potato"));
        assert_eq!(find("Habas").map(|s| s.code), Some("faba_bean"));
        assert_eq!(find("CAÑIHUA").map(|s| s.code), Some("canihua"));
        assert!(find("tomato").is_none());
        assert!(is_known_or_other("other"));
    }

    #[test]
    fn seed_parameters_match_the_paper_table() {
        let potato = find("potato").unwrap();
        assert_eq!(
            (
                potato.base_yield_t_ha,
                potato.price_pen_kg,
                potato.cycle_days
            ),
            (15.5, 2.40, 150)
        );
        let oca = find("oca").unwrap();
        assert_eq!(
            (oca.base_yield_t_ha, oca.price_pen_kg, oca.cycle_days),
            (8.5, 2.00, 210)
        );
    }
}
