use jsonwebtoken::{decode, encode, Algorithm, DecodingKey, EncodingKey, Header, Validation};
use rand::Rng;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::time::{SystemTime, UNIX_EPOCH};

use crate::error::{AppError, Result};
use crate::domain::users::entity::User;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub sub: String,
    pub email: String,
    pub name: Option<String>,
    pub admin: bool,
    pub notification_token: Option<String>,
    pub exp: usize,
    pub iat: usize,
    pub iss: String,
    pub aud: String,
}

pub fn create_token(user: &User, secret: &str) -> Result<String> {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|e| AppError::InternalServerError(e.to_string()))?
        .as_secs() as usize;

    let claims = Claims {
        sub: user.id.to_string(),
        email: user.email.clone(),
        name: user.name.clone(),
        admin: user.admin,
        notification_token: user.notification_token.clone(),
        exp: now + 900, // 15 minutes
        iat: now,
        iss: "shelfspot-api".to_string(),
        aud: "shelfspot-app".to_string(),
    };

    let key = EncodingKey::from_secret(secret.as_bytes());
    let header = Header::new(Algorithm::HS256);

    encode(&header, &claims, &key)
        .map_err(|e| AppError::InternalServerError(format!("JWT encode error: {}", e)))
}

/// Generate a random 64-char hex refresh token and return (raw_token, sha256_hash).
pub fn create_refresh_token() -> (String, String) {
    let raw: String = rand::thread_rng()
        .sample_iter(&rand::distributions::Standard)
        .take(32)
        .map(|b: u8| format!("{:02x}", b))
        .collect();
    let hash = format!("{:x}", Sha256::digest(raw.as_bytes()));
    (raw, hash)
}

pub fn hash_refresh_token(token: &str) -> String {
    format!("{:x}", Sha256::digest(token.as_bytes()))
}

pub fn decode_token(token: &str, secret: &str) -> Result<Claims> {
    let key = DecodingKey::from_secret(secret.as_bytes());
    let mut validation = Validation::new(Algorithm::HS256);
    validation.set_issuer(&["shelfspot-api"]);
    validation.set_audience(&["shelfspot-app"]);

    decode::<Claims>(token, &key, &validation)
        .map(|data| data.claims)
        .map_err(|_| AppError::Unauthorized)
}
