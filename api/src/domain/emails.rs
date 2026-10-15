use crate::i18n::Locale;

#[derive(Clone, Debug, PartialEq)]
pub struct EmailContent {
    pub subject: String,
    pub text: String,
    pub html: String,
}

struct ResetCopy {
    subject: &'static str,
    greeting: &'static str,
    intro: &'static str,
    action: &'static str,
    button: &'static str,
    fallback: &'static str,
    validity: &'static str,
    ignore: &'static str,
    signature: &'static str,
}

const SPANISH: ResetCopy = ResetCopy {
    subject: "AgroYachay: cambie su contraseña",
    greeting: "Hola, {name}:",
    intro: "Recibimos un pedido para cambiar la contraseña de su cuenta de AgroYachay.",
    action: "Para poner una contraseña nueva, toque el botón verde:",
    button: "Poner contraseña nueva",
    fallback: "Si el botón no funciona, copie esta dirección en su navegador:",
    validity: "Este enlace sirve solo una vez y por 60 minutos.",
    ignore: "Si usted no pidió esto, ignore este correo. Su contraseña no cambiará.",
    signature: "Equipo AgroYachay",
};

const ENGLISH: ResetCopy = ResetCopy {
    subject: "AgroYachay: change your password",
    greeting: "Hello {name},",
    intro: "We received a request to change the password of your AgroYachay account.",
    action: "To choose a new password, tap the green button:",
    button: "Choose a new password",
    fallback: "If the button does not work, copy this address into your browser:",
    validity: "This link works only once and for 60 minutes.",
    ignore: "If you did not ask for this, ignore this e-mail. Your password will not change.",
    signature: "The AgroYachay team",
};

const QUECHUA: ResetCopy = ResetCopy {
    subject: "AgroYachay: musuq contraseñata churay",
    greeting: "Napaykullayki, {name}:",
    intro: "AgroYachay cuentaykipaq musuq contraseñata mañakurqanki.",
    action: "Musuq contraseñata churanaykipaq, q'omer botónta ñit'iy:",
    button: "Musuq contraseñata churay",
    fallback: "Botón mana llamk'anchu chayqa, kay direccionta navegadorniykiman qillqay:",
    validity: "Kay enlaceqa huk kutillapaq, 60 minutollapaqmi.",
    ignore: "Mana qamchu mañakurqanki chayqa, kay correota qunqay. Contraseñaykiqa manam tikrakunqachu.",
    signature: "AgroYachay llamk'aqkuna",
};

const AYMARA: ResetCopy = ResetCopy {
    subject: "AgroYachay: machaq contraseña uchaña",
    greeting: "Kamisaki, {name}:",
    intro: "AgroYachay cuentamatakix machaq contraseña mayitawa.",
    action: "Machaq contraseña uchañataki, ch'uxña botón ch'iqt'am:",
    button: "Machaq contraseña uchaña",
    fallback: "Botón jan irnaqkchi ukhax, aka direccion navegadorar qillqt'am:",
    validity: "Aka enlacex mä kutikiw, 60 minutokiw walïni.",
    ignore: "Jumax janiw mayktati ukhax, aka correo armasim. Contraseñamax janiw mayjt'kaniti.",
    signature: "AgroYachay irnaqirinaka",
};

fn copies(locale: Locale) -> Vec<&'static ResetCopy> {
    match locale {
        Locale::Es => vec![&SPANISH],
        Locale::En => vec![&ENGLISH],
        Locale::Qu => vec![&QUECHUA, &SPANISH],
        Locale::Ay => vec![&AYMARA, &SPANISH],
    }
}

pub fn escape_html(text: &str) -> String {
    text.chars()
        .map(|character| match character {
            '&' => "&amp;".to_string(),
            '<' => "&lt;".to_string(),
            '>' => "&gt;".to_string(),
            '"' => "&quot;".to_string(),
            '\'' => "&#39;".to_string(),
            other => other.to_string(),
        })
        .collect()
}

fn text_section(copy: &ResetCopy, name: &str, link: &str) -> String {
    [
        copy.greeting.replace("{name}", name),
        String::new(),
        copy.intro.to_string(),
        String::new(),
        copy.action.to_string(),
        link.to_string(),
        String::new(),
        copy.validity.to_string(),
        String::new(),
        copy.ignore.to_string(),
        String::new(),
        copy.signature.to_string(),
    ]
    .join("\n")
}

fn html_section(copy: &ResetCopy, name: &str, link: &str) -> String {
    let link = escape_html(link);
    let paragraph = "margin:0 0 16px;font-size:18px;line-height:1.5;color:#1d1d1f;";
    format!(
        "<p style=\"{paragraph}\">{greeting}</p>\
<p style=\"{paragraph}\">{intro}</p>\
<p style=\"{paragraph}\">{action}</p>\
<p style=\"margin:0 0 24px;\"><a href=\"{link}\" style=\"display:inline-block;padding:16px 28px;background:#248a3d;color:#ffffff;font-size:20px;font-weight:bold;text-decoration:none;border-radius:12px;\">{button}</a></p>\
<p style=\"margin:0 0 8px;font-size:16px;line-height:1.5;color:#6e6e73;\">{fallback}</p>\
<p style=\"margin:0 0 16px;font-size:16px;line-height:1.5;word-break:break-all;\"><a href=\"{link}\" style=\"color:#0066cc;\">{link}</a></p>\
<p style=\"{paragraph}\"><strong>{validity}</strong></p>\
<p style=\"{paragraph}\">{ignore}</p>\
<p style=\"{paragraph}\">{signature}</p>",
        greeting = escape_html(&copy.greeting.replace("{name}", name)),
        intro = copy.intro,
        action = copy.action,
        button = copy.button,
        fallback = copy.fallback,
        validity = copy.validity,
        ignore = copy.ignore,
        signature = copy.signature,
    )
}

pub fn password_reset(locale: Locale, name: &str, link: &str) -> EmailContent {
    let sections = copies(locale);
    let name = name.trim();
    let text = sections
        .iter()
        .map(|copy| text_section(copy, name, link))
        .collect::<Vec<_>>()
        .join("\n\n------------------------------\n\n");
    let body = sections
        .iter()
        .map(|copy| html_section(copy, name, link))
        .collect::<Vec<_>>()
        .join("<hr style=\"border:none;border-top:1px solid #d2d2d7;margin:32px 0;\">");
    let html = format!(
        "<!doctype html><html lang=\"{lang}\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>{title}</title></head>\
<body style=\"margin:0;padding:0;background:#f5f5f7;font-family:Arial,Helvetica,sans-serif;\">\
<div style=\"max-width:560px;margin:0 auto;padding:24px 16px;\">\
<div style=\"background:#ffffff;border:1px solid #d2d2d7;border-radius:20px;padding:28px 24px;\">\
<p style=\"margin:0 0 24px;font-size:26px;font-weight:bold;color:#248a3d;\">AgroYachay</p>{body}</div></div></body></html>",
        lang = locale.code(),
        title = escape_html(sections[0].subject),
    );
    EmailContent {
        subject: sections[0].subject.to_string(),
        text,
        html,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const LINK: &str = "https://agroyachay.ginit.dev/reset-password#token=abc";

    #[test]
    fn reset_email_carries_link_validity_and_ignore_notice() {
        let email = password_reset(Locale::Es, "Rosa <b>", LINK);
        assert_eq!(email.subject, "AgroYachay: cambie su contraseña");
        assert!(email.text.contains(LINK));
        assert!(email.text.contains("60 minutos"));
        assert!(
            email
                .text
                .contains("Si usted no pidió esto, ignore este correo.")
        );
        assert!(
            email
                .html
                .contains("href=\"https://agroyachay.ginit.dev/reset-password#token=abc\"")
        );
        assert!(email.html.contains("Rosa &lt;b&gt;"));
        assert!(!email.html.contains("<img"));
        assert!(!email.html.contains("<link"));
    }

    #[test]
    fn native_languages_include_spanish_as_backup() {
        let quechua = password_reset(Locale::Qu, "Rosa", LINK);
        assert!(quechua.subject.contains("musuq"));
        assert!(quechua.text.contains("Napaykullayki"));
        assert!(quechua.text.contains("ignore este correo"));
        let aymara = password_reset(Locale::Ay, "Rosa", LINK);
        assert!(aymara.text.contains("Kamisaki"));
        let english = password_reset(Locale::En, "Rosa", LINK);
        assert!(english.text.contains("60 minutes"));
        assert!(!english.text.contains("minutos"));
    }
}
