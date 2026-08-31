use refinery::Target;
use rusqlite::Connection;

use super::DbError;

mod embedded {
    use refinery::embed_migrations;
    embed_migrations!("./migrations");
}

fn table_exists(conn: &Connection, table: &str) -> Result<bool, DbError> {
    let count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = ?1",
        [table],
        |row| row.get(0),
    )?;
    Ok(count > 0)
}

fn column_exists(conn: &Connection, table: &str, column: &str) -> Result<bool, DbError> {
    let mut stmt = conn.prepare(&format!("PRAGMA table_info({table})"))?;
    let names = stmt.query_map([], |row| row.get::<_, String>(1))?;
    for name in names {
        if name? == column {
            return Ok(true);
        }
    }
    Ok(false)
}

pub fn run(conn: &mut Connection) -> Result<(), DbError> {
    let runner = embedded::migrations::runner();
    let has_refinery = table_exists(conn, "refinery_schema_history")?;
    let has_services = table_exists(conn, "services")?;

    if has_services && !has_refinery {
        let has_color = column_exists(conn, "services", "color")?;
        let has_goae = column_exists(conn, "services", "goae")?;

        if has_color && has_goae {
            runner.set_target(Target::FakeVersion(3)).run(conn)?;
            embedded::migrations::runner().run(conn)?;
        } else if has_color {
            runner.set_target(Target::FakeVersion(2)).run(conn)?;
            embedded::migrations::runner().run(conn)?;
        } else {
            runner.run(conn)?;
        }
    } else {
        runner.run(conn)?;
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::Connection;
    use std::path::PathBuf;

    fn migration_count(conn: &Connection) -> i64 {
        conn.query_row(
            "SELECT COUNT(*) FROM refinery_schema_history",
            [],
            |row| row.get(0),
        )
        .unwrap()
    }

    #[test]
    fn fresh_database_runs_all_migrations() {
        let mut conn = Connection::open_in_memory().unwrap();
        run(&mut conn).unwrap();

        assert!(table_exists(&conn, "services").unwrap());
        assert!(table_exists(&conn, "settings").unwrap());
        assert!(table_exists(&conn, "goae_items").unwrap());
        assert!(table_exists(&conn, "service_goae").unwrap());
        assert!(column_exists(&conn, "services", "color").unwrap());
        assert!(!column_exists(&conn, "services", "goae").unwrap());
        assert_eq!(migration_count(&conn), 4);
    }

    #[test]
    fn legacy_database_with_color_is_baselined() {
        let path = std::env::temp_dir().join(format!(
            "price-calculator-legacy-{}",
            std::process::id()
        ));
        let _ = std::fs::remove_file(&path);

        {
            let conn = Connection::open(&path).unwrap();
            conn.execute_batch(
                "
                CREATE TABLE services (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    price_cents INTEGER NOT NULL,
                    category TEXT NOT NULL DEFAULT '',
                    color TEXT NOT NULL DEFAULT '',
                    sort_order INTEGER NOT NULL
                );
                CREATE TABLE settings (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                );
                INSERT INTO services (title, price_cents, category, color, sort_order)
                VALUES ('Test', 1000, 'Cat', '#fff', 0);
                ",
            )
            .unwrap();
        }

        let state = crate::db::DbState::new(PathBuf::from(&path)).unwrap();
        let services = state.list_services().unwrap();
        assert_eq!(services.len(), 1);
        assert_eq!(services[0].title, "Test");

        let conn = state.conn.lock().unwrap();
        assert!(table_exists(&conn, "goae_items").unwrap());
        assert!(!column_exists(&conn, "services", "goae").unwrap());
        assert_eq!(migration_count(&conn), 4);

        let _ = std::fs::remove_file(path);
    }

    #[test]
    fn legacy_database_without_color_adds_column() {
        let path = std::env::temp_dir().join(format!(
            "price-calculator-old-{}",
            std::process::id()
        ));
        let _ = std::fs::remove_file(&path);

        {
            let conn = Connection::open(&path).unwrap();
            conn.execute_batch(
                "
                CREATE TABLE services (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    price_cents INTEGER NOT NULL,
                    category TEXT NOT NULL DEFAULT '',
                    sort_order INTEGER NOT NULL
                );
                CREATE TABLE settings (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                );
                ",
            )
            .unwrap();
        }

        let state = crate::db::DbState::new(PathBuf::from(&path)).unwrap();
        let conn = state.conn.lock().unwrap();
        assert!(column_exists(&conn, "services", "color").unwrap());
        assert!(table_exists(&conn, "goae_items").unwrap());
        assert!(!column_exists(&conn, "services", "goae").unwrap());
        assert_eq!(migration_count(&conn), 4);

        let _ = std::fs::remove_file(path);
    }

    #[test]
    fn existing_refinery_database_runs_pending_migrations() {
        let path = std::env::temp_dir().join(format!(
            "price-calculator-pending-{}",
            std::process::id()
        ));
        let _ = std::fs::remove_file(&path);

        {
            let mut conn = Connection::open(&path).unwrap();
            embedded::migrations::runner()
                .set_target(Target::Version(2))
                .run(&mut conn)
                .unwrap();
        }

        let state = crate::db::DbState::new(PathBuf::from(&path)).unwrap();
        let conn = state.conn.lock().unwrap();
        assert!(table_exists(&conn, "goae_items").unwrap());
        assert!(!column_exists(&conn, "services", "goae").unwrap());
        assert_eq!(migration_count(&conn), 4);

        let _ = std::fs::remove_file(path);
    }

    #[test]
    fn legacy_database_with_goae_migrates_catalog() {
        let path = std::env::temp_dir().join(format!(
            "price-calculator-goae-legacy-{}",
            std::process::id()
        ));
        let _ = std::fs::remove_file(&path);

        {
            let conn = Connection::open(&path).unwrap();
            conn.execute_batch(
                "
                CREATE TABLE services (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    price_cents INTEGER NOT NULL,
                    category TEXT NOT NULL DEFAULT '',
                    color TEXT NOT NULL DEFAULT '',
                    sort_order INTEGER NOT NULL,
                    goae TEXT NOT NULL DEFAULT ''
                );
                CREATE TABLE settings (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                );
                INSERT INTO services (title, price_cents, category, color, sort_order, goae)
                VALUES
                    ('Beratung', 1000, 'Cat', '#fff', 0, '250'),
                    ('Labor', 2000, 'Cat', '#fff', 1, '250'),
                    ('Ohne', 500, 'Cat', '#fff', 2, '');
                ",
            )
            .unwrap();
        }

        let state = crate::db::DbState::new(PathBuf::from(&path)).unwrap();
        let services = state.list_services().unwrap();
        assert_eq!(services.len(), 3);
        assert_eq!(services[0].goae_items.len(), 1);
        assert_eq!(services[0].goae_items[0].number, "250");
        assert_eq!(services[1].goae_items[0].id, services[0].goae_items[0].id);
        assert!(services[2].goae_items.is_empty());

        let items = state.list_goae_items().unwrap();
        assert_eq!(items.len(), 1);
        assert_eq!(items[0].number, "250");

        let conn = state.conn.lock().unwrap();
        assert!(!column_exists(&conn, "services", "goae").unwrap());
        assert_eq!(migration_count(&conn), 4);

        let _ = std::fs::remove_file(path);
    }
}