use std::path::PathBuf;
use std::sync::Mutex;

use crate::config::AppConfig;

use super::DbState;

pub struct DatabaseManager {
    config_file: PathBuf,
    app_data_dir: PathBuf,
    db: Mutex<Option<DbState>>,
}

impl DatabaseManager {
    pub fn new(app_data_dir: PathBuf) -> Self {
        let config_file = app_data_dir.join("config.json");
        let manager = Self {
            config_file,
            app_data_dir,
            db: Mutex::new(None),
        };

        manager.try_legacy_migration();

        if let Some(path) = manager.configured_path() {
            let _ = manager.open_database(path);
        }

        manager
    }

    fn try_legacy_migration(&self) {
        let config = AppConfig::load(&self.config_file);
        if config.database_path.is_some() {
            return;
        }

        let legacy_db = self.app_data_dir.join("price-calculator.db");
        if !legacy_db.exists() {
            return;
        }

        let migrated = AppConfig {
            database_path: Some(legacy_db.to_string_lossy().to_string()),
        };
        let _ = migrated.save(&self.config_file);
    }

    fn configured_path(&self) -> Option<PathBuf> {
        AppConfig::load(&self.config_file)
            .database_path
            .map(PathBuf::from)
    }

    pub fn is_configured(&self) -> bool {
        self.db.lock().unwrap().is_some()
    }

    pub fn get_database_path(&self) -> Option<String> {
        AppConfig::load(&self.config_file).database_path
    }

    fn open_database(&self, path: PathBuf) -> Result<(), String> {
        let db = DbState::new(path).map_err(|e| e.to_string())?;
        *self.db.lock().unwrap() = Some(db);
        Ok(())
    }

    pub fn initialize(&self, path: PathBuf) -> Result<(), String> {
        self.open_database(path.clone())?;

        let config = AppConfig {
            database_path: Some(path.to_string_lossy().to_string()),
        };
        config.save(&self.config_file)
    }

    pub fn reinitialize(&self, path: PathBuf) -> Result<(), String> {
        *self.db.lock().unwrap() = None;
        self.initialize(path)
    }

    pub fn with_db<F, T>(&self, f: F) -> Result<T, String>
    where
        F: FnOnce(&DbState) -> Result<T, String>,
    {
        let guard = self.db.lock().unwrap();
        let db = guard
            .as_ref()
            .ok_or_else(|| "Datenbank ist nicht konfiguriert.".to_string())?;
        f(db)
    }
}