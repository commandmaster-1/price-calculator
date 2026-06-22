use rusqlite::{params, Connection};
use std::path::PathBuf;
use std::sync::Mutex;
use thiserror::Error;

use crate::models::Service;

#[derive(Error, Debug)]
pub enum DbError {
    #[error("database error: {0}")]
    Sqlite(#[from] rusqlite::Error),
}

pub struct DbState {
    pub conn: Mutex<Connection>,
}

impl DbState {
    pub fn new(db_path: PathBuf) -> Result<Self, DbError> {
        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent).ok();
        }

        let conn = Connection::open(db_path)?;
        let state = Self {
            conn: Mutex::new(conn),
        };
        state.migrate()?;
        Ok(state)
    }

    fn migrate(&self) -> Result<(), DbError> {
        let conn = self.conn.lock().unwrap();
        conn.execute_batch(
            "
            CREATE TABLE IF NOT EXISTS services (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                price_cents INTEGER NOT NULL,
                category TEXT NOT NULL DEFAULT '',
                color TEXT NOT NULL DEFAULT '',
                sort_order INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );
            ",
        )?;

        let mut has_color_column = false;
        let mut columns = conn.prepare("PRAGMA table_info(services)")?;
        let column_names = columns.query_map([], |row| row.get::<_, String>(1))?;
        for name in column_names {
            if name? == "color" {
                has_color_column = true;
                break;
            }
        }

        if !has_color_column {
            conn.execute(
                "ALTER TABLE services ADD COLUMN color TEXT NOT NULL DEFAULT ''",
                [],
            )?;
        }

        Ok(())
    }

    fn map_service(row: &rusqlite::Row<'_>) -> rusqlite::Result<Service> {
        Ok(Service {
            id: row.get(0)?,
            title: row.get(1)?,
            price_cents: row.get(2)?,
            category: row.get(3)?,
            color: row.get(4)?,
            sort_order: row.get(5)?,
        })
    }

    pub fn list_services(&self) -> Result<Vec<Service>, DbError> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, title, price_cents, category, color, sort_order
             FROM services
             ORDER BY sort_order ASC, id ASC",
        )?;

        let services = stmt
            .query_map([], Self::map_service)?
            .collect::<Result<Vec<_>, _>>()?;

        Ok(services)
    }

    pub fn create_service(
        &self,
        title: &str,
        price_cents: i64,
        category: &str,
        color: &str,
    ) -> Result<Service, DbError> {
        let conn = self.conn.lock().unwrap();
        let sort_order: i64 = conn.query_row(
            "SELECT COALESCE(MAX(sort_order), -1) + 1 FROM services",
            [],
            |row| row.get(0),
        )?;

        conn.execute(
            "INSERT INTO services (title, price_cents, category, color, sort_order)
             VALUES (?1, ?2, ?3, ?4, ?5)",
            params![title, price_cents, category, color, sort_order],
        )?;

        let id = conn.last_insert_rowid();
        Ok(Service {
            id,
            title: title.to_string(),
            price_cents,
            category: category.to_string(),
            color: color.to_string(),
            sort_order,
        })
    }

    pub fn update_service(
        &self,
        id: i64,
        title: &str,
        price_cents: i64,
        category: &str,
        color: &str,
    ) -> Result<Service, DbError> {
        let conn = self.conn.lock().unwrap();
        let rows = conn.execute(
            "UPDATE services
             SET title = ?1, price_cents = ?2, category = ?3, color = ?4
             WHERE id = ?5",
            params![title, price_cents, category, color, id],
        )?;

        if rows == 0 {
            return Err(DbError::Sqlite(rusqlite::Error::QueryReturnedNoRows));
        }

        let service = conn.query_row(
            "SELECT id, title, price_cents, category, color, sort_order
             FROM services WHERE id = ?1",
            params![id],
            Self::map_service,
        )?;

        Ok(service)
    }

    pub fn delete_service(&self, id: i64) -> Result<(), DbError> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM services WHERE id = ?1", params![id])?;

        let mut stmt = conn.prepare("SELECT id FROM services ORDER BY sort_order ASC, id ASC")?;
        let ids = stmt
            .query_map([], |row| row.get::<_, i64>(0))?
            .collect::<Result<Vec<_>, _>>()?;

        for (index, service_id) in ids.iter().enumerate() {
            conn.execute(
                "UPDATE services SET sort_order = ?1 WHERE id = ?2",
                params![index as i64, service_id],
            )?;
        }

        Ok(())
    }

    pub fn reorder_services(&self, ordered_ids: &[i64]) -> Result<Vec<Service>, DbError> {
        let conn = self.conn.lock().unwrap();
        for (index, id) in ordered_ids.iter().enumerate() {
            conn.execute(
                "UPDATE services SET sort_order = ?1 WHERE id = ?2",
                params![index as i64, id],
            )?;
        }
        drop(conn);
        self.list_services()
    }

    pub fn get_setting(&self, key: &str) -> Result<Option<String>, DbError> {
        let conn = self.conn.lock().unwrap();
        let result = conn.query_row(
            "SELECT value FROM settings WHERE key = ?1",
            params![key],
            |row| row.get::<_, String>(0),
        );

        match result {
            Ok(value) => Ok(Some(value)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(err) => Err(DbError::Sqlite(err)),
        }
    }

    pub fn set_setting(&self, key: &str, value: &str) -> Result<(), DbError> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO settings (key, value) VALUES (?1, ?2)
             ON CONFLICT(key) DO UPDATE SET value = excluded.value",
            params![key, value],
        )?;
        Ok(())
    }
}
