mod commands;
mod config;
mod db;
mod models;

use tauri::Manager;

use commands::database::{
    change_database_path, get_database_status, pick_database_file, set_database_path,
};
use commands::services::{
    create_service, delete_service, list_services, reorder_services, update_service,
};
use commands::settings::{get_color_presets, get_template, save_color_presets, save_template};
use db::DatabaseManager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("failed to resolve app data directory");

            let database_manager = DatabaseManager::new(app_data_dir);
            app.manage(database_manager);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_database_status,
            pick_database_file,
            set_database_path,
            change_database_path,
            list_services,
            create_service,
            update_service,
            delete_service,
            reorder_services,
            get_template,
            save_template,
            get_color_presets,
            save_color_presets,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}