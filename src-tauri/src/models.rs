use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GoaeItem {
    pub id: i64,
    pub number: String,
    pub parameter: String,
    pub sort_order: i64,
}

#[derive(Debug, Deserialize)]
pub struct CreateGoaeItemInput {
    pub number: String,
    pub parameter: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateGoaeItemInput {
    pub id: i64,
    pub number: String,
    pub parameter: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Service {
    pub id: i64,
    pub title: String,
    pub price_cents: i64,
    pub category: String,
    pub color: String,
    pub sort_order: i64,
    pub goae_items: Vec<GoaeItem>,
}

#[derive(Debug, Deserialize)]
pub struct CreateServiceInput {
    pub title: String,
    pub price_cents: i64,
    pub category: String,
    pub color: String,
    pub goae_ids: Vec<i64>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateServiceInput {
    pub id: i64,
    pub title: String,
    pub price_cents: i64,
    pub category: String,
    pub color: String,
    pub goae_ids: Vec<i64>,
}
