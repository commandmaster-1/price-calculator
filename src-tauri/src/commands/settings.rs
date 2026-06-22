use tauri::State;

use crate::db::DatabaseManager;

const TEMPLATE_KEY: &str = "template_html";
const COLOR_PRESETS_KEY: &str = "color_presets";

const DEFAULT_TEMPLATE: &str = r#"<p>Sehr geehrte Damen und Herren,</p><p>folgende Leistungen: {services}</p><p>Gesamtpreis: {price}</p>"#;

const DEFAULT_COLOR_PRESETS: [&str; 10] = [
    "#E8F5E9", "#FFF3E0", "#E3F2FD", "#FCE4EC", "#F3E5F5", "#E0F7FA", "#FFFDE7", "#F1F8E9",
    "#ECEFF1", "#FFEBEE",
];

#[tauri::command]
pub fn get_template(manager: State<'_, DatabaseManager>) -> Result<String, String> {
    manager.with_db(|db| {
        match db.get_setting(TEMPLATE_KEY).map_err(|e| e.to_string())? {
            Some(value) => Ok(value),
            None => Ok(DEFAULT_TEMPLATE.to_string()),
        }
    })
}

#[tauri::command]
pub fn save_template(manager: State<'_, DatabaseManager>, html: String) -> Result<(), String> {
    manager.with_db(|db| {
        db.set_setting(TEMPLATE_KEY, &html)
            .map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn get_color_presets(manager: State<'_, DatabaseManager>) -> Result<Vec<String>, String> {
    manager.with_db(|db| {
        match db
            .get_setting(COLOR_PRESETS_KEY)
            .map_err(|e| e.to_string())?
        {
            Some(value) => serde_json::from_str(&value).map_err(|e| e.to_string()),
            None => Ok(DEFAULT_COLOR_PRESETS
                .iter()
                .map(|color| (*color).to_string())
                .collect()),
        }
    })
}

#[tauri::command]
pub fn save_color_presets(
    manager: State<'_, DatabaseManager>,
    presets: Vec<String>,
) -> Result<(), String> {
    if presets.len() != 10 {
        return Err("Es müssen genau 10 Farb-Presets übergeben werden.".to_string());
    }

    let serialized = serde_json::to_string(&presets).map_err(|e| e.to_string())?;
    manager.with_db(|db| {
        db.set_setting(COLOR_PRESETS_KEY, &serialized)
            .map_err(|e| e.to_string())
    })
}