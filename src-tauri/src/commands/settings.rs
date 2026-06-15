use tauri::State;

use crate::db::DbState;

const TEMPLATE_KEY: &str = "template_html";

const DEFAULT_TEMPLATE: &str = r#"<p>Sehr geehrte Damen und Herren,</p><p>folgende Leistungen: {services}</p><p>Gesamtpreis: {price}</p>"#;

#[tauri::command]
pub fn get_template(state: State<'_, DbState>) -> Result<String, String> {
    match state.get_setting(TEMPLATE_KEY).map_err(|e| e.to_string())? {
        Some(value) => Ok(value),
        None => Ok(DEFAULT_TEMPLATE.to_string()),
    }
}

#[tauri::command]
pub fn save_template(state: State<'_, DbState>, html: String) -> Result<(), String> {
    state
        .set_setting(TEMPLATE_KEY, &html)
        .map_err(|e| e.to_string())
}