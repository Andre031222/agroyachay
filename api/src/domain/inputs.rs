use serde::Serialize;

use super::species::Species;

pub const UREA_N_FRACTION: f64 = 0.46;
pub const DAP_N_FRACTION: f64 = 0.18;
pub const DAP_P2O5_FRACTION: f64 = 0.46;
pub const KCL_K2O_FRACTION: f64 = 0.60;
pub const BAG_KG: f64 = 50.0;
pub const LIME_KG_HA: f64 = 500.0;
pub const TARGET_SCALE_MIN: f64 = 0.5;
pub const TARGET_SCALE_MAX: f64 = 2.0;

#[derive(Clone, Debug)]
pub struct CatalogPrice {
    pub product_id: Option<i64>,
    pub name: String,
    pub unit: String,
    pub price_pen: f64,
}

pub trait PriceBook {
    fn price(&self, sku: &str) -> Option<CatalogPrice>;
}

#[derive(Clone, Debug, Serialize)]
pub struct NutrientTotals {
    pub n_kg: f64,
    pub p2o5_kg: f64,
    pub k2o_kg: f64,
}

#[derive(Clone, Debug, Serialize)]
pub struct InputItem {
    pub code: &'static str,
    pub kind: &'static str,
    pub product_id: Option<i64>,
    pub name: String,
    pub quantity: f64,
    pub unit: String,
    pub unit_price_pen: f64,
    pub subtotal_pen: f64,
    pub amount_kg: Option<f64>,
}

#[derive(Clone, Debug, Serialize)]
pub struct InputPlan {
    pub species: &'static str,
    pub area_ha: f64,
    pub target_yield_t_ha: f64,
    pub scale: f64,
    pub nutrient_demand: NutrientTotals,
    pub items: Vec<InputItem>,
    pub total_pen: f64,
    pub cost_per_ha_pen: f64,
    pub notes: Vec<&'static str>,
}

fn round2(value: f64) -> f64 {
    (value * 100.0).round() / 100.0
}

fn bags(kg: f64) -> f64 {
    if kg <= 0.0 {
        0.0
    } else {
        (kg / BAG_KG * 2.0).ceil() / 2.0
    }
}

fn fallback(sku: &str) -> CatalogPrice {
    let (name, unit, price) = match sku {
        "fert-urea" => ("Urea 46 % N", "saco 50 kg", 145.0),
        "fert-dap" => ("Fosfato diamónico 18-46-0", "saco 50 kg", 175.0),
        "fert-kcl" => ("Cloruro de potasio 60 % K2O", "saco 50 kg", 140.0),
        "amend-lime" => ("Cal agrícola", "saco 50 kg", 25.0),
        _ => ("Semilla", "kg", 5.0),
    };
    CatalogPrice {
        product_id: None,
        name: name.to_string(),
        unit: unit.to_string(),
        price_pen: price,
    }
}

pub fn seed_sku(species: &Species) -> String {
    format!("seed-{}", species.code.replace('_', "-"))
}

fn item(
    code: &'static str,
    kind: &'static str,
    price: CatalogPrice,
    quantity: f64,
    amount_kg: Option<f64>,
) -> InputItem {
    InputItem {
        code,
        kind,
        product_id: price.product_id,
        name: price.name,
        quantity: round2(quantity),
        unit: price.unit,
        unit_price_pen: round2(price.price_pen),
        subtotal_pen: round2(quantity * price.price_pen),
        amount_kg: amount_kg.map(round2),
    }
}

pub fn calculate(
    species: &Species,
    area_ha: f64,
    target_yield_t_ha: Option<f64>,
    labour_day_pen: f64,
    prices: &dyn PriceBook,
) -> InputPlan {
    let area = area_ha.max(0.0);
    let target = target_yield_t_ha
        .filter(|target| target.is_finite() && *target > 0.0)
        .unwrap_or(species.base_yield_t_ha);
    let scale = (target / species.base_yield_t_ha).clamp(TARGET_SCALE_MIN, TARGET_SCALE_MAX);

    let n_total = species.nutrients.n_kg_ha * scale * area;
    let p_total = species.nutrients.p2o5_kg_ha * scale * area;
    let k_total = species.nutrients.k2o_kg_ha * scale * area;

    let dap_kg = p_total / DAP_P2O5_FRACTION;
    let urea_kg = ((n_total - dap_kg * DAP_N_FRACTION) / UREA_N_FRACTION).max(0.0);
    let kcl_kg = k_total / KCL_K2O_FRACTION;
    let lime_kg = LIME_KG_HA * area;
    let seed_kg = species.seed_rate_kg_ha * area;
    let labour_days = species.labour_days_ha * area;

    let price_of = |sku: &str| prices.price(sku).unwrap_or_else(|| fallback(sku));

    let mut items = vec![
        item(
            "urea",
            "fertilizer",
            price_of("fert-urea"),
            bags(urea_kg),
            Some(urea_kg),
        ),
        item(
            "dap",
            "fertilizer",
            price_of("fert-dap"),
            bags(dap_kg),
            Some(dap_kg),
        ),
        item(
            "kcl",
            "fertilizer",
            price_of("fert-kcl"),
            bags(kcl_kg),
            Some(kcl_kg),
        ),
        item(
            "seed",
            "seed",
            price_of(&seed_sku(species)),
            seed_kg,
            Some(seed_kg),
        ),
        item(
            "lime",
            "amendment",
            price_of("amend-lime"),
            bags(lime_kg),
            Some(lime_kg),
        ),
        item(
            "labour",
            "labour",
            CatalogPrice {
                product_id: None,
                name: "Jornal agrícola".to_string(),
                unit: "jornal".to_string(),
                price_pen: labour_day_pen,
            },
            labour_days,
            None,
        ),
    ];
    items.retain(|entry| entry.quantity > 0.0);

    let total: f64 = items.iter().map(|entry| entry.subtotal_pen).sum();
    InputPlan {
        species: species.code,
        area_ha: area,
        target_yield_t_ha: round2(target),
        scale: round2(scale),
        nutrient_demand: NutrientTotals {
            n_kg: round2(n_total),
            p2o5_kg: round2(p_total),
            k2o_kg: round2(k_total),
        },
        items,
        total_pen: round2(total),
        cost_per_ha_pen: if area > 0.0 {
            round2(total / area)
        } else {
            0.0
        },
        notes: vec![
            "soil_test_recommended",
            "split_nitrogen_application",
            "lime_only_if_ph_below_5_5",
        ],
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::species;

    struct EmptyBook;

    impl PriceBook for EmptyBook {
        fn price(&self, _sku: &str) -> Option<CatalogPrice> {
            None
        }
    }

    #[test]
    fn potato_plan_balances_nitrogen_from_dap_and_urea() {
        let potato = species::find("potato").unwrap();
        let plan = calculate(potato, 1.0, None, 50.0, &EmptyBook);
        let dap = plan.items.iter().find(|i| i.code == "dap").unwrap();
        let urea = plan.items.iter().find(|i| i.code == "urea").unwrap();
        let dap_kg: f64 = 120.0 / 0.46;
        let urea_kg: f64 = (160.0 - dap_kg * 0.18) / 0.46;
        assert!((dap.amount_kg.unwrap() - (dap_kg * 100.0).round() / 100.0).abs() < 0.01);
        assert!((urea.amount_kg.unwrap() - (urea_kg * 100.0).round() / 100.0).abs() < 0.01);
        assert_eq!(dap.quantity, 5.5);
        let labour = plan.items.iter().find(|i| i.code == "labour").unwrap();
        assert_eq!(labour.subtotal_pen, 6000.0);
        let sum: f64 = plan.items.iter().map(|i| i.subtotal_pen).sum();
        assert!((plan.total_pen - sum).abs() < 0.01);
    }

    #[test]
    fn target_yield_scales_nutrients_within_bounds() {
        let quinoa = species::find("quinoa").unwrap();
        let plan = calculate(quinoa, 2.0, Some(3.6), 50.0, &EmptyBook);
        assert_eq!(plan.scale, 2.0);
        assert_eq!(plan.nutrient_demand.n_kg, 320.0);
        let capped = calculate(quinoa, 2.0, Some(100.0), 50.0, &EmptyBook);
        assert_eq!(capped.scale, TARGET_SCALE_MAX);
    }

    #[test]
    fn faba_bean_needs_no_urea_when_dap_covers_nitrogen() {
        let faba = species::find("faba_bean").unwrap();
        let plan = calculate(faba, 1.0, None, 50.0, &EmptyBook);
        assert!(plan.items.iter().all(|i| i.code != "urea"));
    }
}
