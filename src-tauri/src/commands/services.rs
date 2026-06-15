use tauri::State;

use crate::db::DbState;
use crate::models::{CreateServiceInput, Service, UpdateServiceInput};

#[tauri::command]
pub fn list_services(state: State<'_, DbState>) -> Result<Vec<Service>, String> {
    state.list_services().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_service(
    state: State<'_, DbState>,
    input: CreateServiceInput,
) -> Result<Service, String> {
    if input.title.trim().is_empty() {
        return Err("Titel darf nicht leer sein.".to_string());
    }
    if input.price_cents < 0 {
        return Err("Preis darf nicht negativ sein.".to_string());
    }

    state
        .create_service(
            input.title.trim(),
            input.price_cents,
            input.category.trim(),
        )
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_service(
    state: State<'_, DbState>,
    input: UpdateServiceInput,
) -> Result<Service, String> {
    if input.title.trim().is_empty() {
        return Err("Titel darf nicht leer sein.".to_string());
    }
    if input.price_cents < 0 {
        return Err("Preis darf nicht negativ sein.".to_string());
    }

    state
        .update_service(
            input.id,
            input.title.trim(),
            input.price_cents,
            input.category.trim(),
        )
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_service(state: State<'_, DbState>, id: i64) -> Result<(), String> {
    state.delete_service(id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn reorder_services(
    state: State<'_, DbState>,
    ordered_ids: Vec<i64>,
) -> Result<Vec<Service>, String> {
    state.reorder_services(&ordered_ids).map_err(|e| e.to_string())
}