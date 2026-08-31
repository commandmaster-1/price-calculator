CREATE TABLE goae_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    number TEXT NOT NULL UNIQUE,
    parameter TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL
);

CREATE TABLE service_goae (
    service_id INTEGER NOT NULL,
    goae_item_id INTEGER NOT NULL,
    sort_order INTEGER NOT NULL,
    PRIMARY KEY (service_id, goae_item_id),
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    FOREIGN KEY (goae_item_id) REFERENCES goae_items(id) ON DELETE CASCADE
);

INSERT INTO goae_items (number, parameter, sort_order)
SELECT TRIM(goae), '', MIN(id)
FROM services
WHERE TRIM(goae) != ''
GROUP BY TRIM(goae);

INSERT INTO service_goae (service_id, goae_item_id, sort_order)
SELECT s.id, g.id, 0
FROM services s
INNER JOIN goae_items g ON g.number = TRIM(s.goae)
WHERE TRIM(s.goae) != '';

ALTER TABLE services DROP COLUMN goae;
