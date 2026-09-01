pub mod manager;
mod migrations;

pub use manager::DatabaseManager;

use rusqlite::{params, Connection, Transaction};
use std::collections::{HashMap, HashSet};
use std::path::PathBuf;
use std::sync::Mutex;
use thiserror::Error;

use crate::models::{GoaeItem, Service};

#[derive(Error, Debug)]
pub enum DbError {
    #[error("database error: {0}")]
    Sqlite(#[from] rusqlite::Error),
    #[error("migration error: {0}")]
    Migration(#[from] refinery::Error),
    #[error("{0}")]
    Validation(String),
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
        conn.execute_batch("PRAGMA foreign_keys = ON;")?;
        let state = Self {
            conn: Mutex::new(conn),
        };
        state.migrate()?;
        Ok(state)
    }

    fn migrate(&self) -> Result<(), DbError> {
        let mut conn = self.conn.lock().unwrap();
        migrations::run(&mut conn)
    }

    fn unique_ids(ids: &[i64]) -> Vec<i64> {
        let mut seen = HashSet::new();
        ids.iter().copied().filter(|id| seen.insert(*id)).collect()
    }

    fn map_service_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<Service> {
        Ok(Service {
            id: row.get(0)?,
            title: row.get(1)?,
            price_cents: row.get(2)?,
            category: row.get(3)?,
            color: row.get(4)?,
            sort_order: row.get(5)?,
            goae_items: Vec::new(),
        })
    }

    fn map_goae_item(row: &rusqlite::Row<'_>) -> rusqlite::Result<GoaeItem> {
        Ok(GoaeItem {
            id: row.get(0)?,
            number: row.get(1)?,
            parameter: row.get(2)?,
            price_cents: row.get(3)?,
            sort_order: row.get(4)?,
        })
    }

    fn sum_goae_prices(items: &[GoaeItem]) -> i64 {
        items.iter().map(|item| item.price_cents).sum()
    }

    fn load_goae_items_by_service(
        conn: &Connection,
    ) -> Result<HashMap<i64, Vec<GoaeItem>>, DbError> {
        let mut stmt = conn.prepare(
            "SELECT sg.service_id, g.id, g.number, g.parameter, g.price_cents, g.sort_order
             FROM service_goae sg
             JOIN goae_items g ON g.id = sg.goae_item_id
             ORDER BY sg.service_id ASC, sg.sort_order ASC, g.id ASC",
        )?;

        let rows = stmt.query_map([], |row| {
            Ok((
                row.get::<_, i64>(0)?,
                GoaeItem {
                    id: row.get(1)?,
                    number: row.get(2)?,
                    parameter: row.get(3)?,
                    price_cents: row.get(4)?,
                    sort_order: row.get(5)?,
                },
            ))
        })?;

        let mut map: HashMap<i64, Vec<GoaeItem>> = HashMap::new();
        for row in rows {
            let (service_id, item) = row?;
            map.entry(service_id).or_default().push(item);
        }
        Ok(map)
    }

    fn load_goae_items_for_service(
        conn: &Connection,
        service_id: i64,
    ) -> Result<Vec<GoaeItem>, DbError> {
        let mut stmt = conn.prepare(
            "SELECT g.id, g.number, g.parameter, g.price_cents, g.sort_order
             FROM service_goae sg
             JOIN goae_items g ON g.id = sg.goae_item_id
             WHERE sg.service_id = ?1
             ORDER BY sg.sort_order ASC, g.id ASC",
        )?;

        let items = stmt
            .query_map(params![service_id], Self::map_goae_item)?
            .collect::<Result<Vec<_>, _>>()?;

        Ok(items)
    }

    fn replace_service_goae(
        tx: &Transaction<'_>,
        service_id: i64,
        goae_ids: &[i64],
    ) -> Result<(), DbError> {
        tx.execute(
            "DELETE FROM service_goae WHERE service_id = ?1",
            params![service_id],
        )?;

        for goae_id in goae_ids {
            let exists: i64 = tx.query_row(
                "SELECT COUNT(*) FROM goae_items WHERE id = ?1",
                params![goae_id],
                |row| row.get(0),
            )?;
            if exists == 0 {
                return Err(DbError::Validation(
                    "Eine ausgewählte GOÄ-Ziffer existiert nicht mehr.".to_string(),
                ));
            }
        }

        for (index, goae_id) in goae_ids.iter().enumerate() {
            tx.execute(
                "INSERT INTO service_goae (service_id, goae_item_id, sort_order)
                 VALUES (?1, ?2, ?3)",
                params![service_id, goae_id, index as i64],
            )?;
        }

        Ok(())
    }

    pub fn list_services(&self) -> Result<Vec<Service>, DbError> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, title, price_cents, category, color, sort_order
             FROM services
             ORDER BY sort_order ASC, id ASC",
        )?;

        let mut services = stmt
            .query_map([], Self::map_service_row)?
            .collect::<Result<Vec<_>, _>>()?;

        let mut items_by_service = Self::load_goae_items_by_service(&conn)?;
        for service in &mut services {
            service.goae_items = items_by_service.remove(&service.id).unwrap_or_default();
            service.price_cents = Self::sum_goae_prices(&service.goae_items);
        }

        Ok(services)
    }

    pub fn create_service(
        &self,
        title: &str,
        category: &str,
        color: &str,
        goae_ids: &[i64],
    ) -> Result<Service, DbError> {
        let goae_ids = Self::unique_ids(goae_ids);
        let mut conn = self.conn.lock().unwrap();
        let tx = conn.transaction()?;

        let sort_order: i64 = tx.query_row(
            "SELECT COALESCE(MAX(sort_order), -1) + 1 FROM services",
            [],
            |row| row.get(0),
        )?;

        tx.execute(
            "INSERT INTO services (title, price_cents, category, color, sort_order)
             VALUES (?1, ?2, ?3, ?4, ?5)",
            params![title, 0, category, color, sort_order],
        )?;

        let id = tx.last_insert_rowid();
        Self::replace_service_goae(&tx, id, &goae_ids)?;
        let goae_items = Self::load_goae_items_for_service(&tx, id)?;
        let price_cents = Self::sum_goae_prices(&goae_items);
        tx.execute(
            "UPDATE services SET price_cents = ?1 WHERE id = ?2",
            params![price_cents, id],
        )?;
        tx.commit()?;

        Ok(Service {
            id,
            title: title.to_string(),
            price_cents,
            category: category.to_string(),
            color: color.to_string(),
            sort_order,
            goae_items,
        })
    }

    pub fn update_service(
        &self,
        id: i64,
        title: &str,
        category: &str,
        color: &str,
        goae_ids: &[i64],
    ) -> Result<Service, DbError> {
        let goae_ids = Self::unique_ids(goae_ids);
        let mut conn = self.conn.lock().unwrap();
        let tx = conn.transaction()?;

        let rows = tx.execute(
            "UPDATE services
             SET title = ?1, category = ?2, color = ?3
             WHERE id = ?4",
            params![title, category, color, id],
        )?;

        if rows == 0 {
            return Err(DbError::Sqlite(rusqlite::Error::QueryReturnedNoRows));
        }

        Self::replace_service_goae(&tx, id, &goae_ids)?;
        let goae_items = Self::load_goae_items_for_service(&tx, id)?;
        let price_cents = Self::sum_goae_prices(&goae_items);
        tx.execute(
            "UPDATE services SET price_cents = ?1 WHERE id = ?2",
            params![price_cents, id],
        )?;
        tx.commit()?;

        let mut service = conn.query_row(
            "SELECT id, title, price_cents, category, color, sort_order
             FROM services WHERE id = ?1",
            params![id],
            Self::map_service_row,
        )?;
        service.goae_items = goae_items;
        service.price_cents = price_cents;
        Ok(service)
    }

    pub fn delete_service(&self, id: i64) -> Result<(), DbError> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM service_goae WHERE service_id = ?1", params![id])?;
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

    pub fn list_goae_items(&self) -> Result<Vec<GoaeItem>, DbError> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, number, parameter, price_cents, sort_order
             FROM goae_items
             ORDER BY sort_order ASC, id ASC",
        )?;

        let items = stmt
            .query_map([], Self::map_goae_item)?
            .collect::<Result<Vec<_>, _>>()?;

        Ok(items)
    }

    pub fn create_goae_item(
        &self,
        number: &str,
        parameter: &str,
        price_cents: i64,
    ) -> Result<GoaeItem, DbError> {
        let conn = self.conn.lock().unwrap();
        let sort_order: i64 = conn.query_row(
            "SELECT COALESCE(MAX(sort_order), -1) + 1 FROM goae_items",
            [],
            |row| row.get(0),
        )?;

        conn.execute(
            "INSERT INTO goae_items (number, parameter, price_cents, sort_order)
             VALUES (?1, ?2, ?3, ?4)",
            params![number, parameter, price_cents, sort_order],
        )?;

        let id = conn.last_insert_rowid();
        Ok(GoaeItem {
            id,
            number: number.to_string(),
            parameter: parameter.to_string(),
            price_cents,
            sort_order,
        })
    }

    pub fn update_goae_item(
        &self,
        id: i64,
        number: &str,
        parameter: &str,
        price_cents: i64,
    ) -> Result<GoaeItem, DbError> {
        let conn = self.conn.lock().unwrap();
        let rows = conn.execute(
            "UPDATE goae_items
             SET number = ?1, parameter = ?2, price_cents = ?3
             WHERE id = ?4",
            params![number, parameter, price_cents, id],
        )?;

        if rows == 0 {
            return Err(DbError::Sqlite(rusqlite::Error::QueryReturnedNoRows));
        }

        let item = conn.query_row(
            "SELECT id, number, parameter, price_cents, sort_order FROM goae_items WHERE id = ?1",
            params![id],
            Self::map_goae_item,
        )?;

        Ok(item)
    }

    pub fn delete_goae_item(&self, id: i64) -> Result<(), DbError> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM service_goae WHERE goae_item_id = ?1", params![id])?;
        conn.execute("DELETE FROM goae_items WHERE id = ?1", params![id])?;
        Ok(())
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

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn temp_db() -> (DbState, PathBuf) {
        let nanos = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let path = std::env::temp_dir().join(format!(
            "price-calculator-goae-crud-{}-{}.db",
            std::process::id(),
            nanos
        ));
        let _ = std::fs::remove_file(&path);
        let state = DbState::new(path.clone()).unwrap();
        (state, path)
    }

    #[test]
    fn goae_items_can_be_attached_to_services() {
        let (state, path) = temp_db();

        let item = state.create_goae_item("250", "Blutbild", 130).unwrap();
        let service = state
            .create_service("Labor", "Diagnostik", "#fff", &[item.id])
            .unwrap();

        assert_eq!(service.goae_items.len(), 1);
        assert_eq!(service.goae_items[0].number, "250");
        assert_eq!(service.goae_items[0].parameter, "Blutbild");
        assert_eq!(service.goae_items[0].price_cents, 130);
        assert_eq!(service.price_cents, 130);

        let second = state.create_goae_item("3550", "TSH", 200).unwrap();
        let updated = state
            .update_service(service.id, "Labor", "Diagnostik", "#fff", &[item.id, second.id])
            .unwrap();
        assert_eq!(updated.price_cents, 330);

        state
            .update_goae_item(item.id, "250", "Kleines Blutbild", 150)
            .unwrap();
        let services = state.list_services().unwrap();
        assert_eq!(services[0].goae_items[0].parameter, "Kleines Blutbild");
        assert_eq!(services[0].price_cents, 350);

        state.delete_goae_item(item.id).unwrap();
        let services = state.list_services().unwrap();
        assert_eq!(services[0].goae_items.len(), 1);
        assert_eq!(services[0].goae_items[0].number, "3550");
        assert_eq!(services[0].price_cents, 200);

        state.delete_goae_item(second.id).unwrap();
        let services = state.list_services().unwrap();
        assert!(services[0].goae_items.is_empty());
        assert_eq!(services[0].price_cents, 0);
        assert!(state.list_goae_items().unwrap().is_empty());

        let _ = std::fs::remove_file(path);
    }
}
