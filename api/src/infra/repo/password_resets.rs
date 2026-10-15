use chrono::{Duration, Utc};
use sha2::{Digest, Sha256};
use sqlx::PgPool;

use crate::error::AppResult;

pub const VALIDITY_MINUTES: i64 = 60;

pub fn hash_token(token: &str) -> String {
    Sha256::digest(token.trim().as_bytes())
        .iter()
        .map(|byte| format!("{byte:02x}"))
        .collect()
}

pub async fn replace_for_user(db: &PgPool, user_id: i64, token_hash: &str) -> AppResult<()> {
    let mut transaction = db.begin().await?;
    sqlx::query(
        "UPDATE password_resets SET used_at = now() WHERE user_id = $1 AND used_at IS NULL",
    )
    .bind(user_id)
    .execute(&mut *transaction)
    .await?;
    sqlx::query(
        "INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
    )
    .bind(user_id)
    .bind(token_hash)
    .bind(Utc::now() + Duration::minutes(VALIDITY_MINUTES))
    .execute(&mut *transaction)
    .await?;
    transaction.commit().await?;
    Ok(())
}

pub async fn consume(db: &PgPool, token_hash: &str) -> AppResult<Option<i64>> {
    Ok(sqlx::query_scalar(
        "UPDATE password_resets SET used_at = now() \
         WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now() RETURNING user_id",
    )
    .bind(token_hash)
    .fetch_optional(db)
    .await?)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn token_hash_is_lowercase_sha256_hex() {
        assert_eq!(
            hash_token("abc"),
            "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
        );
    }
}
