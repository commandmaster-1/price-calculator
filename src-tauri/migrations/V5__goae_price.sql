ALTER TABLE goae_items ADD COLUMN price_cents INTEGER NOT NULL DEFAULT 0;

UPDATE goae_items
SET price_cents = COALESCE((
    SELECT s.price_cents
    FROM service_goae sg
    JOIN services s ON s.id = sg.service_id
    WHERE sg.goae_item_id = goae_items.id
      AND (
        SELECT COUNT(*) FROM service_goae linked
        WHERE linked.goae_item_id = goae_items.id
      ) = 1
      AND (
        SELECT COUNT(*) FROM service_goae on_service
        WHERE on_service.service_id = sg.service_id
      ) = 1
), 0);

UPDATE services
SET price_cents = COALESCE((
    SELECT SUM(g.price_cents)
    FROM service_goae sg
    JOIN goae_items g ON g.id = sg.goae_item_id
    WHERE sg.service_id = services.id
), 0);
