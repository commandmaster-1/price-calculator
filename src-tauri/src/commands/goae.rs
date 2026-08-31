use tauri::State;

use crate::db::DatabaseManager;
use crate::models::{CreateGoaeItemInput, GoaeItem, UpdateGoaeItemInput};

fn map_db_error(error: crate::db::DbError) -> String {
    let message = error.to_string();
    if message.contains("UNIQUE constraint failed") {
        "Diese GOÄ-Ziffer existiert bereits.".to_string()
    } else {
        message
    }
}

#[tauri::command]
pub fn list_goae_items(manager: State<'_, DatabaseManager>) -> Result<Vec<GoaeItem>, String> {
    manager.with_db(|db| db.list_goae_items().map_err(map_db_error))
}

#[tauri::command]
pub fn create_goae_item(
    manager: State<'_, DatabaseManager>,
    input: CreateGoaeItemInput,
) -> Result<GoaeItem, String> {
    let number = input.number.trim();
    let parameter = input.parameter.trim();

    if number.is_empty() {
        return Err("Bitte eine GOÄ-Ziffer eingeben.".to_string());
    }
    if parameter.is_empty() {
        return Err("Bitte einen Parameter eingeben.".to_string());
    }

    manager.with_db(|db| db.create_goae_item(number, parameter).map_err(map_db_error))
}

#[tauri::command]
pub fn update_goae_item(
    manager: State<'_, DatabaseManager>,
    input: UpdateGoaeItemInput,
) -> Result<GoaeItem, String> {
    let number = input.number.trim();
    let parameter = input.parameter.trim();

    if number.is_empty() {
        return Err("Bitte eine GOÄ-Ziffer eingeben.".to_string());
    }
    if parameter.is_empty() {
        return Err("Bitte einen Parameter eingeben.".to_string());
    }

    manager.with_db(|db| {
        db.update_goae_item(input.id, number, parameter)
            .map_err(map_db_error)
    })
}

#[tauri::command]
pub fn delete_goae_item(manager: State<'_, DatabaseManager>, id: i64) -> Result<(), String> {
    manager.with_db(|db| db.delete_goae_item(id).map_err(map_db_error))
}
