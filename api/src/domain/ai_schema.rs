use serde::{Deserialize, Serialize};
use serde_json::Value;

pub fn strip_reasoning(text: &str) -> String {
    let mut rest = text;
    let mut kept = String::new();
    while let Some(start) = rest.find("<think>") {
        kept.push_str(&rest[..start]);
        match rest[start..].find("</think>") {
            Some(end) => rest = &rest[start + end + "</think>".len()..],
            None => {
                rest = "";
                break;
            }
        }
    }
    kept.push_str(rest);
    let kept = match kept.find("</think>") {
        Some(end) => kept[end + "</think>".len()..].to_string(),
        None => kept,
    };
    kept.trim().to_string()
}

pub fn extract_json_object(text: &str) -> Option<Value> {
    let cleaned = strip_reasoning(text);
    if let Ok(value @ Value::Object(_)) = serde_json::from_str::<Value>(&cleaned) {
        return Some(value);
    }
    cleaned.match_indices('{').find_map(|(start, _)| {
        serde_json::Deserializer::from_str(&cleaned[start..])
            .into_iter::<Value>()
            .next()
            .and_then(Result::ok)
            .filter(Value::is_object)
    })
}

fn text_field(object: &Value, keys: &[&str]) -> Option<String> {
    keys.iter().find_map(|key| match object.get(*key) {
        Some(Value::String(text)) if !text.trim().is_empty() => Some(text.trim().to_string()),
        Some(Value::Number(number)) => Some(number.to_string()),
        _ => None,
    })
}

fn list_field(object: &Value, keys: &[&str]) -> Vec<String> {
    keys.iter()
        .find_map(|key| match object.get(*key) {
            Some(Value::Array(items)) => Some(
                items
                    .iter()
                    .filter_map(|item| match item {
                        Value::String(text) if !text.trim().is_empty() => {
                            Some(text.trim().to_string())
                        }
                        Value::Object(_) => text_field(item, &["text", "step", "name", "action"]),
                        _ => None,
                    })
                    .collect(),
            ),
            Some(Value::String(text)) if !text.trim().is_empty() => {
                Some(vec![text.trim().to_string()])
            }
            _ => None,
        })
        .unwrap_or_default()
}

fn bool_field(object: &Value, keys: &[&str]) -> Option<bool> {
    keys.iter().find_map(|key| match object.get(*key) {
        Some(Value::Bool(flag)) => Some(*flag),
        Some(Value::String(text)) => match text.trim().to_lowercase().as_str() {
            "true" | "yes" | "si" | "sí" => Some(true),
            "false" | "no" => Some(false),
            _ => None,
        },
        _ => None,
    })
}

fn number_field(object: &Value, keys: &[&str]) -> Option<f64> {
    keys.iter().find_map(|key| match object.get(*key) {
        Some(Value::Number(number)) => number.as_f64(),
        Some(Value::String(text)) => text.trim().trim_end_matches('%').parse().ok(),
        _ => None,
    })
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct Diagnosis {
    pub healthy: bool,
    pub disease: Option<String>,
    pub scientific_name: Option<String>,
    pub confidence: f64,
    pub severity: String,
    pub description: String,
    pub causes: Vec<String>,
    pub treatment: Vec<String>,
    pub prevention: Vec<String>,
}

pub fn normalize_severity(raw: &str, healthy: bool) -> Option<&'static str> {
    if healthy {
        return Some("none");
    }
    match raw.trim().to_lowercase().as_str() {
        "none" | "ninguna" | "sin daño" => Some("none"),
        "low" | "mild" | "leve" | "baja" => Some("low"),
        "moderate" | "medium" | "moderada" | "media" => Some("moderate"),
        "high" | "severe" | "severa" | "alta" | "grave" | "critical" | "crítica" => Some("high"),
        _ => None,
    }
}

pub fn parse_diagnosis(value: &Value) -> Result<Diagnosis, String> {
    let healthy = bool_field(value, &["healthy", "is_healthy"]).ok_or("missing healthy flag")?;
    let raw_confidence =
        number_field(value, &["confidence", "confianza"]).ok_or("missing confidence")?;
    let confidence = if raw_confidence <= 1.0 {
        raw_confidence * 100.0
    } else {
        raw_confidence
    };
    if !(0.0..=100.0).contains(&confidence) {
        return Err("confidence out of range".into());
    }
    let severity = normalize_severity(
        &text_field(value, &["severity", "severidad"]).unwrap_or_default(),
        healthy,
    )
    .ok_or("invalid severity")?;
    let disease = text_field(value, &["disease", "nombre", "name"]);
    if !healthy && disease.is_none() {
        return Err("missing disease name".into());
    }
    let description =
        text_field(value, &["description", "descripcion"]).ok_or("missing description")?;
    Ok(Diagnosis {
        healthy,
        disease: if healthy { None } else { disease },
        scientific_name: text_field(value, &["scientific_name", "nombre_cientifico"]),
        confidence: (confidence * 10.0).round() / 10.0,
        severity: severity.to_string(),
        description,
        causes: list_field(value, &["causes", "causas"]),
        treatment: list_field(value, &["treatment", "tratamiento"]),
        prevention: list_field(value, &["prevention", "prevencion"]),
    })
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct VisionFinding {
    pub plant: Option<String>,
    pub symptoms: Option<String>,
    pub healthy: bool,
    pub disease: Option<String>,
    pub scientific_name: Option<String>,
    pub confidence: f64,
    pub severity: String,
}

fn non_null_text(object: &Value, keys: &[&str]) -> Option<String> {
    text_field(object, keys).filter(|text| {
        !matches!(
            text.to_lowercase().as_str(),
            "null" | "none" | "n/a" | "ninguna" | "ninguno"
        )
    })
}

pub fn parse_vision_finding(value: &Value) -> Result<VisionFinding, String> {
    let healthy = bool_field(value, &["healthy", "is_healthy"]).ok_or("missing healthy flag")?;
    let raw_confidence = number_field(value, &["confidence"]).ok_or("missing confidence")?;
    let confidence = if raw_confidence <= 1.0 && raw_confidence > 0.0 {
        raw_confidence * 100.0
    } else {
        raw_confidence
    };
    if !(0.0..=100.0).contains(&confidence) {
        return Err("confidence out of range".into());
    }
    let disease = non_null_text(value, &["disease"]);
    if !healthy && disease.is_none() {
        return Err("missing disease name".into());
    }
    let severity = normalize_severity(
        &text_field(value, &["severity"]).unwrap_or_default(),
        healthy,
    )
    .unwrap_or("moderate");
    Ok(VisionFinding {
        plant: non_null_text(value, &["plant"]),
        symptoms: list_field(value, &["symptoms"])
            .into_iter()
            .reduce(|joined, item| format!("{joined}; {item}"))
            .filter(|text| !text.is_empty()),
        healthy,
        disease: if healthy { None } else { disease },
        scientific_name: if healthy {
            None
        } else {
            non_null_text(value, &["scientific_name"])
        },
        confidence: confidence.round(),
        severity: severity.to_string(),
    })
}

pub fn finding_only_diagnosis(finding: &VisionFinding) -> Diagnosis {
    Diagnosis {
        healthy: finding.healthy,
        disease: finding.disease.clone(),
        scientific_name: finding.scientific_name.clone(),
        confidence: finding.confidence,
        severity: finding.severity.clone(),
        description: finding.symptoms.clone().unwrap_or_default(),
        causes: Vec::new(),
        treatment: Vec::new(),
        prevention: Vec::new(),
    }
}

pub fn parse_diagnosis_advice(finding: &VisionFinding, value: &Value) -> Result<Diagnosis, String> {
    let description =
        text_field(value, &["description", "descripcion"]).ok_or("missing description")?;
    let disease = if finding.healthy {
        None
    } else {
        non_null_text(value, &["disease", "nombre"]).or_else(|| finding.disease.clone())
    };
    let treatment = list_field(value, &["treatment", "tratamiento"]);
    if !finding.healthy && treatment.is_empty() {
        return Err("missing treatment".into());
    }
    Ok(Diagnosis {
        healthy: finding.healthy,
        disease,
        scientific_name: finding.scientific_name.clone(),
        confidence: finding.confidence,
        severity: finding.severity.clone(),
        description,
        causes: list_field(value, &["causes", "causas"]),
        treatment,
        prevention: list_field(value, &["prevention", "prevencion"]),
    })
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct ProductDose {
    pub name: String,
    pub dose: String,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct PestPlan {
    pub urgency: String,
    pub steps: Vec<String>,
    pub products: Vec<ProductDose>,
    pub organic_alternative: Option<String>,
    pub consult_agronomist: Option<String>,
}

pub fn parse_pest_plan(value: &Value) -> Result<PestPlan, String> {
    let urgency = match text_field(value, &["urgency", "urgencia"])
        .unwrap_or_default()
        .to_lowercase()
        .as_str()
    {
        "immediate" | "inmediata" => "immediate",
        "24h" | "24 h" => "24h",
        "this_week" | "esta_semana" | "week" => "this_week",
        "monitor" | "monitorear" => "monitor",
        _ => return Err("invalid urgency".into()),
    }
    .to_string();
    let steps = list_field(value, &["steps", "plan_accion"]);
    if steps.is_empty() {
        return Err("missing steps".into());
    }
    let products = value
        .get("products")
        .or_else(|| value.get("productos_quimicos"))
        .and_then(Value::as_array)
        .map(|items| {
            items
                .iter()
                .filter_map(|item| {
                    Some(ProductDose {
                        name: text_field(item, &["name", "nombre"])?,
                        dose: text_field(item, &["dose", "dosis"]).unwrap_or_default(),
                    })
                })
                .collect()
        })
        .unwrap_or_default();
    Ok(PestPlan {
        urgency,
        steps,
        products,
        organic_alternative: text_field(value, &["organic_alternative", "alternativa_organica"]),
        consult_agronomist: text_field(
            value,
            &["consult_agronomist", "cuando_consultar_especialista"],
        ),
    })
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct PlanDay {
    pub date: String,
    pub activities: Vec<String>,
    pub avoid: Vec<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct WeatherPlan {
    pub summary: String,
    pub risk_level: String,
    pub days: Vec<PlanDay>,
}

pub fn parse_weather_plan(value: &Value) -> Result<WeatherPlan, String> {
    let summary = text_field(value, &["summary", "resumen"]).ok_or("missing summary")?;
    let risk_level = match text_field(value, &["risk_level", "riesgo_nivel"])
        .unwrap_or_default()
        .to_lowercase()
        .as_str()
    {
        "low" | "bajo" => "low",
        "medium" | "medio" | "moderate" => "medium",
        "high" | "alto" => "high",
        "critical" | "crítico" | "critico" => "critical",
        _ => return Err("invalid risk level".into()),
    }
    .to_string();
    let days: Vec<PlanDay> = value
        .get("days")
        .and_then(Value::as_array)
        .map(|items| {
            items
                .iter()
                .filter_map(|item| {
                    Some(PlanDay {
                        date: text_field(item, &["date", "fecha", "dia"])?,
                        activities: list_field(item, &["activities", "actividades"]),
                        avoid: list_field(item, &["avoid", "evitar"]),
                    })
                })
                .collect()
        })
        .unwrap_or_default();
    if days.is_empty() {
        return Err("missing days".into());
    }
    Ok(WeatherPlan {
        summary,
        risk_level,
        days,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn json_is_extracted_from_fenced_text() {
        let text = "Here you go:\n```json\n{\"healthy\": true}\n```";
        assert_eq!(extract_json_object(text), Some(json!({"healthy": true})));
        assert_eq!(extract_json_object("no json here"), None);
        let reasoning = "<think>maybe {\"healthy\": false}</think>\n```json\n{\"healthy\": true, \"note\": \"a } b\"}\n```\nDone {x}";
        assert_eq!(
            extract_json_object(reasoning),
            Some(json!({"healthy": true, "note": "a } b"}))
        );
        assert_eq!(strip_reasoning("</think> answer"), "answer");
        assert_eq!(strip_reasoning("a <think>b"), "a");
    }

    #[test]
    fn diagnosis_accepts_english_and_legacy_spanish_keys() {
        let english = json!({
            "healthy": false, "disease": "Late blight", "scientific_name": "Phytophthora infestans",
            "confidence": 0.82, "severity": "moderate", "description": "Dark lesions.",
            "causes": ["humidity"], "treatment": ["cymoxanil + mancozeb"], "prevention": "rotation"
        });
        let parsed = parse_diagnosis(&english).unwrap();
        assert_eq!(parsed.confidence, 82.0);
        assert_eq!(parsed.prevention, vec!["rotation".to_string()]);

        let legacy = json!({
            "is_healthy": true, "nombre": "Planta Saludable", "confianza": 92,
            "severidad": "leve", "descripcion": "Sin síntomas."
        });
        let parsed = parse_diagnosis(&legacy).unwrap();
        assert!(parsed.healthy);
        assert_eq!(parsed.severity, "none");
        assert_eq!(parsed.disease, None);
    }

    #[test]
    fn diagnosis_rejects_incomplete_answers() {
        assert!(parse_diagnosis(&json!({"healthy": false, "confidence": 50})).is_err());
        assert!(
            parse_diagnosis(&json!({
                "healthy": false, "disease": "x", "confidence": 500,
                "severity": "low", "description": "d"
            }))
            .is_err()
        );
    }

    #[test]
    fn vision_findings_feed_localized_advice() {
        let finding = parse_vision_finding(&json!({
            "plant": "potato", "symptoms": "brown patch with white mould", "healthy": false,
            "disease": "late blight", "scientific_name": "Phytophthora infestans",
            "confidence": 80, "severity": "moderate"
        }))
        .unwrap();
        assert_eq!(finding.plant.as_deref(), Some("potato"));
        let diagnosis = parse_diagnosis_advice(
            &finding,
            &json!({"disease": "Rancha", "description": "Mancha con moho.", "treatment": ["Saque las hojas"]}),
        )
        .unwrap();
        assert_eq!(diagnosis.disease.as_deref(), Some("Rancha"));
        assert_eq!(diagnosis.confidence, 80.0);
        assert!(parse_diagnosis_advice(&finding, &json!({"description": "x"})).is_err());

        let healthy = parse_vision_finding(&json!({
            "plant": "quinoa", "symptoms": ["no visible damage"], "healthy": true,
            "disease": null, "scientific_name": "Chenopodium quinoa", "confidence": 100, "severity": "None"
        }))
        .unwrap();
        assert_eq!(healthy.severity, "none");
        assert_eq!(healthy.scientific_name, None);
        assert_eq!(
            finding_only_diagnosis(&healthy).description,
            "no visible damage"
        );
        assert!(
            parse_vision_finding(&json!({"healthy": false, "disease": "null", "confidence": 50}))
                .is_err()
        );
    }

    #[test]
    fn plans_are_validated() {
        let plan = parse_pest_plan(&json!({
            "urgency": "24h", "steps": ["remove leaves"],
            "products": [{"name": "Mancozeb", "dose": "2.5 kg/ha"}],
            "organic_alternative": "caldo bordelés", "consult_agronomist": "if spreading"
        }))
        .unwrap();
        assert_eq!(plan.products.len(), 1);
        assert!(parse_pest_plan(&json!({"urgency": "later", "steps": ["x"]})).is_err());

        let weather = parse_weather_plan(&json!({
            "summary": "Dry week", "risk_level": "alto",
            "days": [{"date": "2026-10-15", "activities": ["sow"], "avoid": []}]
        }))
        .unwrap();
        assert_eq!(weather.risk_level, "high");
    }
}
