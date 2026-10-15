use lettre::message::header::ContentType;
use lettre::message::{Mailbox, MultiPart, SinglePart};
use lettre::transport::smtp::authentication::Credentials;
use lettre::{AsyncSmtpTransport, AsyncTransport, Message, Tokio1Executor};

use crate::config::SmtpConfig;
use crate::domain::emails::EmailContent;

#[derive(Clone)]
pub enum Mailer {
    Smtp {
        transport: AsyncSmtpTransport<Tokio1Executor>,
        from: Mailbox,
    },
    Disabled,
}

impl Mailer {
    pub fn from_config(config: &SmtpConfig) -> Result<Self, String> {
        if !config.is_configured() {
            return Ok(Self::Disabled);
        }
        let from: Mailbox = config
            .from
            .parse()
            .map_err(|error| format!("SMTP_FROM is not a valid mailbox: {error}"))?;
        let builder = if config.port == 465 {
            AsyncSmtpTransport::<Tokio1Executor>::relay(&config.host)
        } else {
            AsyncSmtpTransport::<Tokio1Executor>::starttls_relay(&config.host)
        }
        .map_err(|error| format!("invalid SMTP_HOST: {error}"))?
        .port(config.port);
        let builder = if config.username.is_empty() {
            builder
        } else {
            builder.credentials(Credentials::new(
                config.username.clone(),
                config.password.clone(),
            ))
        };
        Ok(Self::Smtp {
            transport: builder.build(),
            from,
        })
    }

    pub fn is_enabled(&self) -> bool {
        matches!(self, Self::Smtp { .. })
    }

    pub async fn send(&self, to: &str, email: &EmailContent) -> Result<(), String> {
        let Self::Smtp { transport, from } = self else {
            return Err("SMTP is not configured".into());
        };
        let to: Mailbox = to
            .parse()
            .map_err(|error| format!("invalid recipient: {error}"))?;
        let message = Message::builder()
            .from(from.clone())
            .to(to)
            .subject(&email.subject)
            .multipart(
                MultiPart::alternative()
                    .singlepart(
                        SinglePart::builder()
                            .header(ContentType::TEXT_PLAIN)
                            .body(email.text.clone()),
                    )
                    .singlepart(
                        SinglePart::builder()
                            .header(ContentType::TEXT_HTML)
                            .body(email.html.clone()),
                    ),
            )
            .map_err(|error| error.to_string())?;
        transport
            .send(message)
            .await
            .map(|_| ())
            .map_err(|error| error.to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn empty_host_disables_mail_and_bad_sender_is_rejected() {
        assert!(
            !Mailer::from_config(&SmtpConfig::default())
                .unwrap()
                .is_enabled()
        );
        let config = SmtpConfig {
            host: "smtp.example.org".into(),
            port: 587,
            username: "user".into(),
            password: "secret".into(),
            from: "AgroYachay <no-reply@ginit.dev>".into(),
        };
        assert!(Mailer::from_config(&config).unwrap().is_enabled());
        let implicit = SmtpConfig {
            port: 465,
            ..config.clone()
        };
        assert!(Mailer::from_config(&implicit).unwrap().is_enabled());
        let broken = SmtpConfig {
            from: "not a mailbox".into(),
            ..config
        };
        assert!(Mailer::from_config(&broken).is_err());
    }
}
