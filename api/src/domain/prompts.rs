use crate::i18n::Locale;

use super::agro_weather::DailyForecast;
use super::ai_schema::{Diagnosis, VisionFinding};

pub fn reply_language(locale: Locale) -> &'static str {
    match locale {
        Locale::Es => "Responde siempre en español.",
        Locale::En => {
            "IMPORTANT: the farmer reads English. Write every sentence and every JSON text value in English (for example \"Water lightly in the afternoon\", \"Do not spray in the afternoon\"), translating any Spanish example given above. Never answer in Spanish."
        }
        Locale::Qu => {
            "Responde en quechua sureño (runasimi). Si no puedes hacerlo con fluidez, responde en español sencillo e incluye entre paréntesis los términos clave en quechua."
        }
        Locale::Ay => {
            "Responde en aimara (aymar aru). Si no puedes hacerlo con fluidez, responde en español sencillo e incluye entre paréntesis los términos clave en aimara."
        }
    }
}

const PLAIN_STYLE: &str = "Escribe para agricultores con poca experiencia técnica: frases cortas (máximo 15 palabras), palabras de uso diario, sin siglas ni términos técnicos sin explicar, sin markdown. \
En español trata siempre al agricultor de usted (riegue, revise, cubra; escriba \"riegue\", nunca \"regue\" ni \"rega\").";

const PRODUCT_RULES: &str = "Cuando recomiendes un producto, da el ingrediente activo, la dosis por mochila de 20 litros y cada cuántos días repetir; \
usa solo productos que se venden en el Perú y están registrados en SENASA.";

const ANDEAN_FACTS: &str = "Datos de referencia confiables: \
rancha o tizón tardío de la papa (Phytophthora infestans): aparece con lluvia y neblina, avanza en pocos días; \
saque las hojas o plantas enfermas y entiérrelas lejos de la chacra (no las deje en el suelo); \
con síntomas use un fungicida sistémico como cimoxanil + mancozeb (50 a 60 g por mochila de 20 L) o dimetomorf, \
alternando con uno de contacto como mancozeb 80 % (50 a 60 g por mochila de 20 L) o clorotalonil, cada 7 a 10 días mientras llueva; \
riegue temprano en la mañana para que las hojas sequen, nunca por la tarde; aporque alto para proteger los tubérculos; \
alternativa orgánica para la rancha: caldo bordelés (200 g de sulfato de cobre y 200 g de cal en 20 L de agua) cada 7 días; el guano y el compost no curan la rancha. \
Aporque de la papa: el primero cuando las plantas miden 20 a 30 cm (unos 30 a 45 días después de brotar), junto con el deshierbo y el abonado de nitrógeno; \
el segundo antes de la floración; un aporque alto protege los tubérculos del gorgojo, la polilla, la rancha y la helada. \
Heladas: riegue ligero la tarde anterior, cubra plantas pequeñas, haga humo al amanecer. \
Gorgojo de los Andes y polilla: rotación de cultivos, cosecha a tiempo, almacén limpio. \
Abonos orgánicos comunes: guano de islas, estiércol descompuesto, compost, biol.";

pub fn planner_system_prompt(locale: Locale) -> String {
    format!(
        "{language} Eres el planificador de labores de AgroYachay para pequeños productores de los Andes del Perú. \
Planificas con el pronóstico del tiempo: heladas, lluvia, viento y agua del suelo. {PLAIN_STYLE} {}",
        reply_language(locale),
        language = reply_language(locale)
    )
}

pub fn system_prompt(locale: Locale) -> String {
    format!(
        "{language} Eres el asistente agronómico de AgroYachay, una plataforma para pequeños productores de los Andes del Perú. \
Conoces bien la agricultura andina (papa, quinua, maíz, haba, oca, cañihua, cebada, trigo) del altiplano y los valles interandinos. \
Da consejos claros, prácticos y prudentes. {PLAIN_STYLE} {PRODUCT_RULES} {ANDEAN_FACTS} \
Recuerda el uso seguro de agroquímicos: guantes, mascarilla, no comer ni fumar al aplicar, y respetar los días antes de cosechar. \
Si no estás seguro, dilo y sugiere consultar a la agencia agraria o a un agrónomo. No inventes datos. {}",
        reply_language(locale),
        language = reply_language(locale)
    )
}

pub fn assistant_style() -> &'static str {
    "Responde en 3 a 6 frases cortas o en una lista breve de pasos numerados. Ve directo a lo que el agricultor debe hacer. \
Si la pregunta no trata de agricultura, responde con amabilidad que solo ayudas con temas del campo."
}

pub fn vision_prompt(crop: Option<&str>) -> String {
    let crop_context = crop
        .filter(|name| !name.trim().is_empty())
        .map(|name| format!(" The farmer says the crop is: {}.", name.trim()))
        .unwrap_or_default();
    format!(
        "You are a plant pathologist for Andean crops in Peru (potato, quinoa, maize, faba bean, oca, cañihua, barley, wheat).{crop_context} Look at the photo carefully.
1. \"plant\": name the plant from its leaves or panicles.
2. \"symptoms\": describe only what you clearly see: spots (colour, border, rings), mould, insects, holes, wilting. If leaves are uniformly green and panicles are normal, write \"no visible damage\". Natural red or purple colour of quinoa panicles is NOT a disease.
3. Decide. Use healthy=true when there is no clear damage. If the photo does not show a plant, use healthy=false, disease=\"invalid image\" and confidence below 20.
Guide for diseased leaves:
- Potato, brown-black patch with pale water-soaked halo and white downy mould at the edge: late blight (Phytophthora infestans).
- Potato, small brown spots with concentric rings and yellow halo: early blight (Alternaria solani).
- Quinoa, yellow or pink patches on top of the leaf with grey-violet mould underneath: downy mildew (Peronospora variabilis).
- Orange or brown powder pustules: rust.
- Small insects on leaves or shoots: aphids or thrips; tunnels in tubers: Andean potato weevil (Premnotrypes spp.) or potato tuber moth.
Answer ONLY with JSON: {{\"plant\": \"...\", \"symptoms\": \"...\", \"healthy\": true, \"disease\": \"common name or null\", \"scientific_name\": \"or null\", \"confidence\": 0, \"severity\": \"none|low|moderate|high\"}}
confidence is an integer 0-100: 85-100 when the symptoms are typical and clear, 60-84 when likely, below 60 when unsure."
    )
}

pub fn diagnosis_advice_prompt(
    finding: &VisionFinding,
    crop: Option<&str>,
    locale: Locale,
) -> String {
    let status = if finding.healthy {
        "planta sana, sin daño visible".to_string()
    } else {
        format!(
            "{} ({}), severidad {}, confianza {:.0} %",
            finding
                .disease
                .as_deref()
                .unwrap_or("problema no identificado"),
            finding
                .scientific_name
                .as_deref()
                .unwrap_or("agente desconocido"),
            finding.severity,
            finding.confidence
        )
    };
    format!(
        "Un modelo de visión revisó la foto de una planta de un pequeño productor andino del Perú:
- Planta vista: {}
- Cultivo indicado por el agricultor: {}
- Lo que se ve (en inglés): {}
- Resultado: {status}
Explique el resultado al agricultor. Responda SOLO con un objeto JSON con estas claves exactas:
{{
  \"disease\": \"nombre común del problema en el idioma pedido, o null si está sana\",
  \"description\": \"1 o 2 frases cortas sobre lo que se ve en la foto\",
  \"causes\": [\"por qué aparece, en palabras sencillas\"],
  \"treatment\": [\"qué hacer ahora\"],
  \"prevention\": [\"qué hacer para que no vuelva\"]
}}
Reglas: de 1 a 3 elementos por lista; si la planta está sana, causes y treatment van vacíos y prevention tiene 1 o 2 consejos de cuidado. \
En treatment, si usa un producto, dé el ingrediente activo y la dosis por mochila de 20 L. No cambie el diagnóstico. \
{PLAIN_STYLE} {PRODUCT_RULES} {}",
        finding.plant.as_deref().unwrap_or("no identificada"),
        crop.unwrap_or("no indicado"),
        finding.symptoms.as_deref().unwrap_or("sin descripción"),
        reply_language(locale)
    )
}

pub fn pest_plan_prompt(
    diagnosis: &Diagnosis,
    crop: Option<&str>,
    catalogue: &[String],
    locale: Locale,
) -> String {
    let catalogue_text = if catalogue.is_empty() {
        String::from("(sin catálogo)")
    } else {
        catalogue.join("; ")
    };
    format!(
        "Un pequeño productor andino del Perú tiene este problema en su cultivo:
- Diagnóstico: {}
- Nombre científico: {}
- Confianza del diagnóstico: {:.0} %
- Severidad: {}
- Cultivo: {}
- Lo que se ve: {}
Productos del catálogo local: {catalogue_text}.
Prepara un plan de manejo sencillo y responde SOLO con un objeto JSON con estas claves exactas:
{{
  \"urgency\": \"immediate | 24h | this_week | monitor\",
  \"steps\": [\"paso 1\", \"paso 2\", \"paso 3\"],
  \"products\": [{{\"name\": \"ingrediente activo (ejemplo de producto comercial)\", \"dose\": \"cantidad por mochila de 20 L, cada cuántos días y cuántas veces\"}}],
  \"organic_alternative\": \"una alternativa orgánica que se consigue en el Perú, con su dosis\",
  \"consult_agronomist\": \"cuándo debe llamar a un agrónomo o a la agencia agraria\"
}}
Reglas: de 3 a 5 pasos, en orden, cada uno una acción concreta; de 1 a 3 productos. \
Para hongos como la rancha alterna un producto sistémico y uno de contacto para evitar resistencia. \
Usa dosis realistas de etiqueta (por ejemplo, mancozeb 80 % PM: 50 a 60 g por mochila de 20 L). \
Prioriza las labores culturales, respeta los días antes de cosecha y no recomiendes productos prohibidos en el Perú. \
Si la severidad es high o la enfermedad avanza rápido (como la rancha), la urgencia es immediate o 24h. \
{PLAIN_STYLE} {PRODUCT_RULES} {}",
        diagnosis.disease.as_deref().unwrap_or("planta sana"),
        diagnosis.scientific_name.as_deref().unwrap_or("desconocido"),
        diagnosis.confidence,
        diagnosis.severity,
        crop.unwrap_or("no especificado"),
        diagnosis.description,
        reply_language(locale)
    )
}

fn day_notes(day: &DailyForecast) -> String {
    let mut notes = Vec::new();
    match day.temperature_min {
        Some(min) if min <= -2.0 => {
            notes.push(format!("HELADA FUERTE en la madrugada ({min:.0} °C)"))
        }
        Some(min) if min <= 2.0 => {
            notes.push(format!("riesgo de helada en la madrugada ({min:.0} °C)"))
        }
        _ => {}
    }
    if day.temperature_max.is_some_and(|max| max >= 28.0) {
        notes.push("mucho calor al mediodía".to_string());
    }
    let rain = day.precipitation_mm.unwrap_or(0.0);
    let probability = day.precipitation_probability.unwrap_or(0.0);
    notes.push(
        if rain >= 5.0 || probability >= 60.0 {
            "lluvia probable"
        } else if rain >= 1.0 || probability >= 30.0 {
            "posible lluvia ligera"
        } else {
            "día seco"
        }
        .to_string(),
    );
    notes.push(
        if day.wind_max_kmh.is_some_and(|wind| wind >= 15.0) {
            "viento fuerte por la tarde (fumigar solo temprano, con calma)"
        } else {
            "viento suave (se puede fumigar si hace falta y no llueve)"
        }
        .to_string(),
    );
    notes.join("; ")
}

pub fn weather_plan_prompt(
    place: &str,
    days: &[DailyForecast],
    crops: &[String],
    locale: Locale,
) -> String {
    let forecast = days
        .iter()
        .take(7)
        .map(|day| {
            format!(
                "  {}: mín {} °C, máx {} °C, lluvia {} mm (prob. {} %), viento máx {} km/h. Notas: {}",
                day.date,
                fmt_option(day.temperature_min),
                fmt_option(day.temperature_max),
                fmt_option(day.precipitation_mm),
                fmt_option(day.precipitation_probability),
                fmt_option(day.wind_max_kmh),
                day_notes(day)
            )
        })
        .collect::<Vec<_>>()
        .join("\n");
    let rain: f64 = days
        .iter()
        .take(7)
        .filter_map(|day| day.precipitation_mm)
        .sum();
    let water_loss: f64 = days.iter().take(7).filter_map(|day| day.et0_mm).sum();
    let water_note = if rain - water_loss < -15.0 {
        format!(
            "falta agua: la lluvia de la semana ({rain:.0} mm) es mucho menor que lo que el suelo pierde ({water_loss:.0} mm); hay que regar si el cultivo lo necesita"
        )
    } else if rain - water_loss < 0.0 {
        format!(
            "agua algo justa: lluvia {rain:.0} mm frente a {water_loss:.0} mm que pierde el suelo; revisar la humedad del suelo antes de regar"
        )
    } else {
        format!("agua suficiente: lluvia {rain:.0} mm; no hace falta regar")
    };
    let crops_text = if crops.is_empty() {
        "cultivos andinos en general".to_string()
    } else {
        crops.join(", ")
    };
    format!(
        "Planifica las labores del campo de los próximos 7 días para un productor en {place}.
PRONÓSTICO (las notas ya están calculadas, respétalas):
{forecast}
AGUA EN LA SEMANA: {water_note}.
CULTIVOS: {crops_text}
Responde SOLO con un objeto JSON con estas claves exactas:
{{
  \"summary\": \"2 frases cortas: cómo será la semana y lo más importante que debe hacer\",
  \"risk_level\": \"low | medium | high | critical\",
  \"days\": [{{\"date\": \"YYYY-MM-DD\", \"activities\": [\"tarea recomendada\"], \"avoid\": [\"qué no hacer\"]}}]
}}
Reglas:
- Un elemento en days por cada fecha del pronóstico, en el mismo orden.
- De 1 a 3 tareas y de 0 a 2 cosas a evitar por día; cada una de máximo 12 palabras.
- Las tareas son acciones positivas que empiezan con un verbo (Riegue, Revise, Cubra). Las prohibiciones van solo en avoid y empiezan con \"No\".
- Este plan es solo de labores: no nombres productos químicos ni dosis. Si hace falta fumigar, diga \"Fumigue temprano si ve plagas\".
- Si hay riesgo de helada: indica proteger el cultivo (regar ligero la tarde anterior, cubrir plantas pequeñas, hacer humo al amanecer) y no regar de noche.
- Si hay lluvia probable: no fumigar ni abonar ese día. Si hay viento fuerte: fumigar solo temprano.
- Varíe las tareas: no repita la misma tarea más de 3 días; reparta riego, deshierbo, aporque, revisión de plagas y abonado según el cultivo y el tiempo.
- Si el día es seco y sin helada, es buen día para deshierbar, aporcar o abonar; no prohíba abonar en días secos.
- No uses siglas (como ET0) ni cifras de viento en las tareas.
- risk_level: critical si hay helada fuerte; high si hay helada en 2 o más días; medium si hay helada en 1 día, lluvia fuerte o falta agua; low en otro caso.
{PLAIN_STYLE} {}",
        reply_language(locale)
    )
}

fn fmt_option(value: Option<f64>) -> String {
    value
        .map(|number| format!("{number:.1}"))
        .unwrap_or_else(|| "s/d".to_string())
}

pub struct FarmContext {
    pub user_name: String,
    pub place: Option<String>,
    pub crops: Vec<String>,
    pub latest_readings: Vec<String>,
}

pub fn assistant_context(context: &FarmContext) -> String {
    let mut lines = vec![format!("Agricultor: {}", context.user_name)];
    if let Some(place) = &context.place {
        lines.push(format!("Región: {place}"));
    }
    if context.crops.is_empty() {
        lines.push("Cultivos registrados: ninguno".to_string());
    } else {
        lines.push(format!(
            "Cultivos registrados: {}",
            context.crops.join("; ")
        ));
    }
    if !context.latest_readings.is_empty() {
        lines.push(format!(
            "Últimas lecturas de sensores: {}",
            context.latest_readings.join("; ")
        ));
    }
    format!(
        "CONTEXTO DEL AGRICULTOR (úsalo solo si es pertinente):\n{}",
        lines.join("\n")
    )
}

pub fn advisory_draft_prompt(
    topic: &str,
    priority: &str,
    description: &str,
    crop: Option<&str>,
    locale: Locale,
) -> String {
    format!(
        "Redacta un borrador de respuesta de un agrónomo para la siguiente consulta de un pequeño productor andino.
Tema: {topic}
Prioridad: {priority}
Cultivo: {}
Consulta: \"{description}\"
Escribe en texto plano, sin markdown, máximo 6 oraciones: evaluación inicial, recomendaciones concretas con dosis y productos disponibles en el Perú, y próximos pasos. \
El borrador será revisado por un agrónomo humano antes de enviarse. {}",
        crop.unwrap_or("no especificado"),
        reply_language(locale)
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn prompts_carry_the_requested_language() {
        assert!(system_prompt(Locale::En).contains("English"));
        assert!(planner_system_prompt(Locale::En).contains("English"));
        assert!(vision_prompt(Some("papa")).contains("papa"));
        assert!(vision_prompt(None).contains("\"healthy\""));
        let finding = VisionFinding {
            plant: Some("potato".into()),
            symptoms: Some("white mould".into()),
            healthy: false,
            disease: Some("late blight".into()),
            scientific_name: Some("Phytophthora infestans".into()),
            confidence: 80.0,
            severity: "moderate".into(),
        };
        assert!(diagnosis_advice_prompt(&finding, None, Locale::Qu).contains("quechua"));
    }

    #[test]
    fn weather_prompt_flags_frost_wind_and_water() {
        let day = DailyForecast {
            date: "2026-10-15".into(),
            weather_code: None,
            temperature_min: Some(1.0),
            temperature_max: Some(21.6),
            precipitation_mm: Some(0.0),
            precipitation_probability: Some(0.0),
            et0_mm: Some(6.4),
            wind_max_kmh: Some(18.6),
            uv_index_max: None,
            sunrise: None,
            sunset: None,
        };
        let notes = day_notes(&day);
        assert!(notes.contains("riesgo de helada"));
        assert!(notes.contains("día seco"));
        assert!(notes.contains("viento fuerte"));
        let prompt = weather_plan_prompt("Puno", &[day], &[], Locale::Es);
        assert!(prompt.contains("hay que regar") || prompt.contains("agua algo justa"));
        assert!(prompt.contains("español"));
    }

    #[test]
    fn assistant_context_lists_crops_and_readings() {
        let text = assistant_context(&FarmContext {
            user_name: "Rosa".into(),
            place: Some("Puno".into()),
            crops: vec!["Papa (potato), 1.5 ha".into()],
            latest_readings: vec!["air_temperature 12.5 °C".into()],
        });
        assert!(text.contains("Puno"));
        assert!(text.contains("air_temperature"));
    }
}
