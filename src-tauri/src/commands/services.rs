use tauri::State;

use crate::db::DatabaseManager;
use crate::models::{CreateServiceInput, Service, UpdateServiceInput};

#[tauri::command]
pub fn list_services(manager: State<'_, DatabaseManager>) -> Result<Vec<Service>, String> {
    manager.with_db(|db| db.list_services().map_err(|e| e.to_string()))
}

#[tauri::command]
pub fn create_service(
    manager: State<'_, DatabaseManager>,
    input: CreateServiceInput,
) -> Result<Service, String> {
    if input.title.trim().is_empty() {
        return Err("Titel darf nicht leer sein.".to_string());
    }
    if input.price_cents < 0 {
        return Err("Preis darf nicht negativ sein.".to_string());
    }

    manager.with_db(|db| {
        db.create_service(
            input.title.trim(),
            input.price_cents,
            input.category.trim(),
            input.color.trim(),
            input.goae.trim(),
        )
        .map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn update_service(
    manager: State<'_, DatabaseManager>,
    input: UpdateServiceInput,
) -> Result<Service, String> {
    if input.title.trim().is_empty() {
        return Err("Titel darf nicht leer sein.".to_string());
    }
    if input.price_cents < 0 {
        return Err("Preis darf nicht negativ sein.".to_string());
    }

    manager.with_db(|db| {
        db.update_service(
            input.id,
            input.title.trim(),
            input.price_cents,
            input.category.trim(),
            input.color.trim(),
            input.goae.trim(),
        )
        .map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn delete_service(manager: State<'_, DatabaseManager>, id: i64) -> Result<(), String> {
    manager.with_db(|db| db.delete_service(id).map_err(|e| e.to_string()))
}

#[tauri::command]
pub fn reorder_services(
    manager: State<'_, DatabaseManager>,
    ordered_ids: Vec<i64>,
) -> Result<Vec<Service>, String> {
    manager.with_db(|db| db.reorder_services(&ordered_ids).map_err(|e| e.to_string()))
}