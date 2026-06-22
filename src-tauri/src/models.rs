use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Service {
    pub id: i64,
    pub title: String,
    pub price_cents: i64,
    pub category: String,
    pub color: String,
    pub sort_order: i64,
    pub goae: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateServiceInput {
    pub title: String,
    pub price_cents: i64,
    pub category: String,
    pub color: String,
    pub goae: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateServiceInput {
    pub id: i64,
    pub title: String,
    pub price_cents: i64,
    pub category: String,
    pub color: String,
    pub goae: String,
}
