use axum::extract::Request;
use axum::http::HeaderMap;
use axum::middleware::Next;
use axum::response::Response;
use serde::{Deserialize, Serialize};

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize, Default)]
#[serde(rename_all = "lowercase")]
pub enum Locale {
    #[default]
    Es,
    En,
    Qu,
    Ay,
}

pub const SUPPORTED_LOCALES: [&str; 4] = ["es", "en", "qu", "ay"];

impl Locale {
    pub fn parse(tag: &str) -> Option<Self> {
        let primary = tag
            .trim()
            .split(['-', '_'])
            .next()
            .unwrap_or("")
            .to_ascii_lowercase();
        match primary.as_str() {
            "es" => Some(Self::Es),
            "en" => Some(Self::En),
            "qu" | "quz" | "que" => Some(Self::Qu),
            "ay" | "aym" => Some(Self::Ay),
            _ => None,
        }
    }

    pub fn from_accept_language(header: &str) -> Self {
        let mut candidates: Vec<(f32, Locale)> = header
            .split(',')
            .filter_map(|part| {
                let mut pieces = part.split(';');
                let tag = pieces.next()?;
                let quality = pieces
                    .find_map(|piece| piece.trim().strip_prefix("q="))
                    .and_then(|q| q.parse::<f32>().ok())
                    .unwrap_or(1.0);
                Locale::parse(tag).map(|locale| (quality, locale))
            })
            .collect();
        candidates.sort_by(|a, b| b.0.total_cmp(&a.0));
        candidates
            .first()
            .map(|(_, locale)| *locale)
            .unwrap_or_default()
    }

    pub fn from_headers(headers: &HeaderMap) -> Self {
        headers
            .get(axum::http::header::ACCEPT_LANGUAGE)
            .and_then(|value| value.to_str().ok())
            .map(Self::from_accept_language)
            .unwrap_or_default()
    }

    pub fn code(&self) -> &'static str {
        match self {
            Self::Es => "es",
            Self::En => "en",
            Self::Qu => "qu",
            Self::Ay => "ay",
        }
    }

    pub fn language_name(&self) -> &'static str {
        match self {
            Self::Es => "español",
            Self::En => "English",
            Self::Qu => "quechua (runasimi)",
            Self::Ay => "aimara (aymar aru)",
        }
    }

    pub fn current() -> Self {
        REQUEST_LOCALE
            .try_with(|locale| *locale)
            .unwrap_or_default()
    }
}

tokio::task_local! {
    static REQUEST_LOCALE: Locale;
}

pub async fn locale_scope(request: Request, next: Next) -> Response {
    let locale = Locale::from_headers(request.headers());
    REQUEST_LOCALE.scope(locale, next.run(request)).await
}

pub fn message(key: &str, locale: Locale) -> String {
    let (es, en, qu, ay) = match key {
        "bad_request" => (
            "Solicitud inválida.",
            "Invalid request.",
            "Mañakuyqa manam allinchu.",
            "Mayiwixa janiw walikiti.",
        ),
        "validation_error" => (
            "Algunos datos no son válidos.",
            "Some fields are not valid.",
            "Wakin willakuykunaqa manam allinchu.",
            "Yaqhip yatiyawinakax janiw walikiti.",
        ),
        "unauthorized" => (
            "Inicia sesión para continuar.",
            "Please sign in to continue.",
            "Yaykuy qatipanaykipaq.",
            "Mantaña sarantañataki.",
        ),
        "invalid_credentials" => (
            "Correo o contraseña incorrectos.",
            "Incorrect e-mail or password.",
            "Correo utaq yaykuna simi mana allinchu.",
            "Correo jan ukax imt'at aru janiw walikiti.",
        ),
        "token_invalid" => (
            "Tu sesión expiró. Vuelve a iniciar sesión.",
            "Your session has expired. Please sign in again.",
            "Sesioniyki tukurunña. Huktawan yaykuy.",
            "Sesionamax tukusxiwa. Wasitat mantam.",
        ),
        "forbidden" => (
            "No tienes permiso para esta acción.",
            "You are not allowed to perform this action.",
            "Manam kayta ruwayta atinkichu.",
            "Janiw akx luraña munañamakiti.",
        ),
        "account_disabled" => (
            "Tu cuenta está desactivada.",
            "Your account is disabled.",
            "Cuentaykiqa wañusqa kachkan.",
            "Cuentamax jark'atawa.",
        ),
        "not_found" => (
            "No se encontró el recurso.",
            "Resource not found.",
            "Manam tarikunchu.",
            "Janiw jikxataskiti.",
        ),
        "conflict" => (
            "El recurso ya existe o está en uso.",
            "The resource already exists or is in use.",
            "Kaqmi kachkanña.",
            "Ukax utjxiwa.",
        ),
        "email_taken" => (
            "El correo ya está registrado.",
            "This e-mail is already registered.",
            "Kay correoqa qillqasqañam.",
            "Aka correox qillqatawa.",
        ),
        "device_already_claimed" => (
            "El dispositivo ya está vinculado a otra cuenta.",
            "The device is already linked to another account.",
            "Kay dispositivoqa huk cuentawanñam.",
            "Aka dispositivox yaqha cuentampiwa.",
        ),
        "rate_limited" => (
            "Demasiados intentos. Espera un minuto.",
            "Too many attempts. Please wait a minute.",
            "Achka kutitam. Huk minutota suyay.",
            "Walja kutiwa. Mä minuto suyt'am.",
        ),
        "ai_unavailable" => (
            "El servicio de inteligencia artificial no está disponible en este momento.",
            "The artificial intelligence service is not available right now.",
            "IA yanapaqqa kunanqa manam kanchu.",
            "IA yanapirix jichhax janiw utjkiti.",
        ),
        "ai_invalid_response" => (
            "El modelo de IA devolvió una respuesta no válida. Inténtalo de nuevo.",
            "The AI model returned an invalid answer. Please try again.",
            "IA mana allin kutichirqan. Huktawan ruway.",
            "IA janiw walik kutt'aykiti. Wasitat yant'am.",
        ),
        "weather_unavailable" => (
            "El servicio meteorológico no responde.",
            "The weather service is not responding.",
            "Pacha willakuyqa manam kutichinchu.",
            "Pacha yatiyawix janiw kutt'aykiti.",
        ),
        "payload_too_large" => (
            "El archivo supera el tamaño máximo de 8 MB.",
            "The file exceeds the 8 MB limit.",
            "Archivoqa 8 MB-manta aswan hatunmi.",
            "Archivox 8 MB-at sipan jach'awa.",
        ),
        "unsupported_media_type" => (
            "Formato de imagen no admitido. Usa JPEG, PNG o WebP.",
            "Unsupported image format. Use JPEG, PNG or WebP.",
            "Manam chay rikchaqta chaskinchu. JPEG, PNG utaq WebP churay.",
            "Janiw uka uñacht'awix katuqatakiti. JPEG, PNG jan ukax WebP apnaqam.",
        ),
        "registration_closed" => (
            "El registro de nuevas cuentas está cerrado.",
            "New account registration is closed.",
            "Musuq cuentakunaqa wichqasqam.",
            "Machaq cuentanakax jist'antatawa.",
        ),
        "google_not_configured" => (
            "El inicio de sesión con Google no está configurado.",
            "Google sign-in is not configured.",
            "Google-wan yaykuyqa manam churasqachu.",
            "Google-mp mantañax janiw wakicht'atakiti.",
        ),
        "google_token_invalid" => (
            "No se pudo verificar la cuenta de Google.",
            "The Google account could not be verified.",
            "Google cuentataqa manam chiqanchayta atikunchu.",
            "Google cuentax janiw chiqanchatäkiti.",
        ),
        "reset_token_invalid" => (
            "El enlace para cambiar la contraseña ya no sirve. Pida uno nuevo.",
            "The password reset link is no longer valid. Please ask for a new one.",
            "Contraseña tikranapaq enlaceqa manañam llamk'anchu. Musuqta mañakuy.",
            "Contraseña mayjt'ayañataki enlacex janiw walïxiti. Machaqa mayim.",
        ),
        "reset_email_sent" => (
            "Si el correo está registrado, le enviamos un enlace para cambiar su contraseña.",
            "If the e-mail is registered, we sent you a link to change your password.",
            "Correo qillqasqa kaqtinqa, contraseña tikranapaq enlaceta apachimuyku.",
            "Correox qillqatächi ukhax, contraseña mayjt'ayañataki enlace apayañani.",
        ),
        "missing_esp32_id" => (
            "Falta el campo requerido esp32_id.",
            "The required field esp32_id is missing.",
            "esp32_id manam kanchu.",
            "esp32_id janiw utjkiti.",
        ),
        "no_data" => (
            "No se recibieron datos.",
            "No data received.",
            "Manam willakuykuna chayamunchu.",
            "Janiw yatiyawinakax purinkiti.",
        ),
        "no_valid_readings" => (
            "No se recibieron lecturas válidas.",
            "No valid readings were received.",
            "Manam allin tupuykuna chayamunchu.",
            "Janiw walik tupunakax purinkiti.",
        ),
        "readings_saved" => (
            "{count} lecturas guardadas.",
            "{count} readings saved.",
            "{count} tupuykuna waqaychasqa.",
            "{count} tupunakaw imatäxi.",
        ),
        "device_not_found" => (
            "Sensor no encontrado.",
            "Sensor not found.",
            "Sensorqa manam tarikunchu.",
            "Sensorax janiw jikxataskiti.",
        ),
        "login_ok" => (
            "Inicio de sesión exitoso.",
            "Signed in successfully.",
            "Allinmi yaykurqanki.",
            "Walikiw mantxtaxa.",
        ),
        _ => (
            "Error interno del servidor.",
            "Internal server error.",
            "Servidorpi pantay.",
            "Servidoran pantjasiwi.",
        ),
    };
    match locale {
        Locale::Es => es,
        Locale::En => en,
        Locale::Qu => qu,
        Locale::Ay => ay,
    }
    .to_string()
}

pub fn message_with_count(key: &str, locale: Locale, count: usize) -> String {
    message(key, locale).replace("{count}", &count.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accept_language_prefers_highest_quality_supported_tag() {
        assert_eq!(
            Locale::from_accept_language("fr-FR, en;q=0.8, qu;q=0.9"),
            Locale::Qu
        );
        assert_eq!(Locale::from_accept_language("en-US,en;q=0.9"), Locale::En);
        assert_eq!(Locale::from_accept_language("de"), Locale::Es);
        assert_eq!(Locale::from_accept_language(""), Locale::Es);
    }

    #[test]
    fn reset_messages_exist_in_every_language() {
        for locale in [Locale::Es, Locale::En, Locale::Qu, Locale::Ay] {
            assert_ne!(
                message("reset_token_invalid", locale),
                message("internal", locale)
            );
        }
    }

    #[test]
    fn unknown_keys_fall_back_to_internal_error() {
        assert_eq!(
            message("does_not_exist", Locale::En),
            "Internal server error."
        );
        assert_eq!(
            message_with_count("readings_saved", Locale::Es, 3),
            "3 lecturas guardadas."
        );
    }
}
