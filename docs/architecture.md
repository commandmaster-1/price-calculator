# Architecture

Price Calculator is a Tauri 2 desktop app: React owns selection, templates, and clipboard; Rust owns SQLite, migrations, and validation.

```
┌─────────────────────────────────────────────────────────┐
│  React (src/)                                           │
│  App.tsx → updater check → DatabaseSetupScreen | AppShell│
│  hooks → src/lib/api.ts → invoke("command_name")        │
└────────────────────────────┬────────────────────────────┘
                             │ Tauri IPC
┌────────────────────────────▼────────────────────────────┐
│  Rust (src-tauri/src/)                                  │
│  DatabaseManager (config.json + open connection)        │
│  DbState (rusqlite + Refinery)                          │
└─────────────────────────────────────────────────────────┘
```

## Frontend layout

| Path | Role |
| --- | --- |
| `src/App.tsx` | Auto-update, then database gate |
| `src/components/layout/AppShell.tsx` | Edit/select modes, copy actions |
| `src/components/setup/DatabaseSetupScreen.tsx` | First-run create/open `.db` |
| `src/components/settings/DatabaseSettings.tsx` | Switch database later |
| `src/components/goae/GoaeManagerDialog.tsx` | CRUD for GOÄ catalog |
| `src/components/services/` | Grid, cards, service dialog, GOÄ picker |
| `src/lib/generate-text.ts` | Placeholder expansion and totals |
| `src/lib/api.ts` | Typed `invoke` wrappers |

Selection order is insertion order of toggles (`useSelection`). Category grouping and `{goa}` / `{parameter}` strings follow that order, not `sort_order` on the card grid.

Drag-and-drop reorder uses `@dnd-kit` and persists via `reorder_services`. The pointer sensor requires an 8px drag before it starts, so clicks still toggle selection.

## Data model

```
services          1 ─── N  service_goae  N ─── 1  goae_items
id, title,                    service_id              id
price_cents (cache),          goae_item_id            number UNIQUE
category, color,              sort_order              parameter
sort_order                                            price_cents
                                                      sort_order

settings
key PRIMARY, value
  template_html
  color_presets   (JSON array, exactly 10 hex strings)
```

`PRAGMA foreign_keys = ON` is set when the file is opened. Deleting a GOÄ item removes its `service_goae` rows first, then the catalog row. Linked services stay; they just lose that ziffer.

`goae_items.number` is unique. Duplicate create/update is mapped to `Diese GOÄ-Ziffer existiert bereits.`

### Pricing

A service has no independent price field in the UI. Stored and displayed totals come from attached GOÄ items:

```
service.price_cents = sum(goae_items.price_cents for linked items)
```

- `list_services` always recomputes that sum before returning.
- `create_service` / `update_service` write the sum into `services.price_cents`.
- `update_goae_item` and `delete_goae_item` do **not** rewrite every linked service row. The next `list_services` still returns the live sum; the denormalized column can lag until the next service write.
- The generated total ignores a stale `service.price_cents` and sums `goae_items` in `calculateTotalCents`.

V5 copies a service’s old `price_cents` onto a GOÄ item only when that item is linked to exactly one service and that service has exactly one GOÄ item. Shared or multi-ziffer rows get `0` and must be priced in the GOÄ dialog.

Amounts are integer euro cents. The UI parses German input (`1,30` → `130`) in `src/lib/format-price.ts`.

## Template generation

`generateText(templateHtml, services, selectedIds)` in `src/lib/generate-text.ts`:

1. Group selected services by category (blank → `Sonstiges`), keeping first-seen category order from `selectedIds`.
2. `{services}` HTML: `<strong>Category:</strong> Title1, Title2, …` joined with `, `. Titles and labels are HTML-escaped.
3. `{price}`: `Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" })`.
4. `{goa}` / `{parameter}`: unique non-empty values, hyphen-joined, first occurrence wins.
5. Plain text is the HTML run through `textContent` (clipboard fallback).

Unknown selected IDs are skipped. Template save is debounced 500ms in `useTemplate`.

## Database lifecycle

`DatabaseManager` (`src-tauri/src/db/manager.rs`):

1. Resolve Tauri `app_data_dir` and load `config.json` (`{"database_path": "…"}`).
2. If `database_path` is missing and `app_data_dir/price-calculator.db` exists, write that path into `config.json` (pre-settings-era installs).
3. Open the configured file, run migrations, keep the connection in a mutex.
4. Commands that need data call `with_db`. If nothing is open, they return `Datenbank ist nicht konfiguriert.`

`set_database_path` is first-run initialize. `change_database_path` drops the current connection and opens the new file. The UI remounts `AppShell` (`dataKey`) so hooks reload.

Creating a file uses a save dialog with default name `price-calculator.db`; opening uses an open dialog filtered to `*.db`.

## Migrations

SQL lives in `src-tauri/migrations/` and is embedded with Refinery (`embed_migrations!("./migrations")`).

| Version | Change |
| --- | --- |
| V1 | `services`, `settings` |
| V2 | `services.color` |
| V3 | `services.goae` (single string per service) |
| V4 | `goae_items` + `service_goae`; copy trimmed `goae` strings into the catalog; drop `services.goae` |
| V5 | `goae_items.price_cents`; backfill 1:1 mappings; recompute `services.price_cents` |

Databases created before Refinery have a `services` table but no `refinery_schema_history`. `src-tauri/src/db/migrations.rs` baselines those files instead of replaying V1–V3:

| Existing schema | Baseline | Then run |
| --- | --- | --- |
| `color` and `goae` columns | Fake version 3 | V4–V5 |
| `color` only | Fake version 2 | V3–V5 |
| neither | run from V1 (`IF NOT EXISTS`) | all |

Covered by `cargo test` in `src-tauri/src/db/migrations.rs` and `src-tauri/src/db/mod.rs`.

### Adding a migration

1. Add `src-tauri/migrations/V6__short_name.sql` (next integer).
2. Extend the tests if the change is user-visible or touches legacy files.
3. Do not edit applied V1–V5 in place; old installs already recorded those versions.

## Tauri commands

Frontend wrappers: `src/lib/api.ts`. Rust handlers: `src-tauri/src/commands/`.

| Command | Input | Notes |
| --- | --- | --- |
| `get_database_status` | — | `{ configured, path }` |
| `pick_database_file` | `mode: "create" \| "open"` | Native dialog; may return `null` |
| `set_database_path` | `path` | Empty path rejected |
| `change_database_path` | `path` | Replaces the open connection |
| `list_services` | — | Includes `goae_items`; `price_cents` is the live sum |
| `create_service` | `{ title, category, color, goae_ids }` | Title required; duplicate GOÄ ids dropped |
| `update_service` | `{ id, title, category, color, goae_ids }` | Missing id → SQLite no-rows |
| `delete_service` | `id` | Unlinks GOÄ rows, then compact `sort_order` |
| `reorder_services` | `orderedIds` | Writes `sort_order` from array index |
| `list_goae_items` | — | Catalog order |
| `create_goae_item` | `{ number, parameter, price_cents }` | Number, parameter required; `price_cents >= 0` |
| `update_goae_item` | `{ id, number, parameter, price_cents }` | Same validation |
| `delete_goae_item` | `id` | Unlinks from all services |
| `get_template` / `save_template` | HTML string | Default German letter if unset |
| `get_color_presets` / `save_color_presets` | 10 hex strings | Save rejects any other length |

Missing GOÄ ids on a service write return `Eine ausgewählte GOÄ-Ziffer existiert nicht mehr.`

Capabilities (`src-tauri/capabilities/`): clipboard write (html + text), file dialogs, process relaunch, updater (desktop only).

## Auto-update

Configured in `src-tauri/tauri.conf.json` (`plugins.updater`). `src/App.tsx` runs `check()` at module load:

```ts
const update = await check();
if (update) {
  await update.downloadAndInstall();
  await relaunch();
}
```

There is no “skip this version” UI. Dev sessions that can reach a published `latest.json` for a newer signed build will also update.

Release artifacts are produced by `tauri-apps/tauri-action` with `includeUpdaterJson: true` and `releaseDraft: true`. Publishing the draft is what makes the endpoint live.

## Constraints and pitfalls

- **GOÄ first:** a service can be created with no ziffern (price 0). The picker tells you to create catalog entries in **GOÄ-Ziffern** first.
- **Shared catalog rows:** editing a GOÄ price/parameter updates every service that references that id on the next list.
- **Version fields:** bump `src-tauri/tauri.conf.json` for shipped/updater version. `package.json` / `Cargo.toml` can lag.
- **Updater in `dev`:** `App.tsx` always checks; keep test keys and published versions in mind when iterating.
- **Template tokens are not a parser:** `{services}` inside other text is replaced; there is no escaping of the token syntax itself.
- **Color presets:** backend requires length 10. Defaults live in both `commands/settings.rs` and `src/lib/color-utils.ts` — keep them aligned.
