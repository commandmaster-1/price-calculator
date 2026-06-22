use std::path::PathBuf;

use serde::Serialize;
use tauri::{AppHandle, State};
use tauri_plugin_dialog::DialogExt;

use crate::db::DatabaseManager;

#[derive(Serialize)]
pub struct DatabaseStatus {
    pub configured: bool,
    pub path: Option<String>,
}

#[tauri::command]
pub fn get_database_status(manager: State<'_, DatabaseManager>) -> DatabaseStatus {
    DatabaseStatus {
        configured: manager.is_configured(),
        path: manager.get_database_path(),
    }
}

#[tauri::command]
pub async fn pick_database_file(app: AppHandle, mode: String) -> Result<Option<String>, String> {
    let dialog = app
        .dialog()
        .file()
        .add_filter("SQLite-Datenbank", &["db"])
        .set_title(if mode == "create" {
            "Neue Datenbank erstellen"
        } else {
            "Datenbank öffnen"
        });

    let picked = if mode == "create" {
        dialog.set_file_name("price-calculator.db").blocking_save_file()
    } else {
        dialog.blocking_pick_file()
    };

    Ok(picked.map(|path| path.to_string()))
}

#[tauri::command]
pub fn set_database_path(
    manager: State<'_, DatabaseManager>,
    path: String,
) -> Result<(), String> {
    let db_path = PathBuf::from(path.trim());
    if db_path.as_os_str().is_empty() {
        return Err("Datenbankpfad darf nicht leer sein.".to_string());
    }

    manager.initialize(db_path)
}

#[tauri::command]
pub fn change_database_path(
    manager: State<'_, DatabaseManager>,
    path: String,
) -> Result<(), String> {
    let db_path = PathBuf::from(path.trim());
    if db_path.as_os_str().is_empty() {
        return Err("Datenbankpfad darf nicht leer sein.".to_string());
    }

    manager.reinitialize(db_path)
}