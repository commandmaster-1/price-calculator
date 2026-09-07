# Price Calculator

Desktop app for assembling a German GOÄ-based quote: pick services, then copy generated HTML/text that lists the selection and its total price.

The UI is German (`Preisrechner`). Data lives in a SQLite file you choose on first launch.

## Stack

- **Frontend:** React 19, Vite, Tailwind CSS 4, TipTap (template editor)
- **Backend:** Tauri 2 + rusqlite, with Refinery migrations
- **Package manager:** pnpm

Shipped app version is `src-tauri/tauri.conf.json` (currently `0.2.2`). `package.json` and `src-tauri/Cargo.toml` are not the source of truth for releases.

## Development

Prerequisites: Node.js LTS, pnpm, a Rust toolchain (stable), and platform WebView libraries (see [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/)).

```bash
pnpm install
pnpm tauri dev
```

Use `pnpm tauri dev`, not `pnpm dev` alone. The frontend calls Tauri plugins at module load (updater, clipboard, file dialogs), so a Vite-only session will fail.

Recommended editor extensions are listed in `.vscode/extensions.json` (`tauri-apps.tauri-vscode`, `rust-analyzer`).

### Tests

```bash
pnpm test                          # Vitest: template / pricing helpers
cd src-tauri && cargo test         # SQLite CRUD and migration compatibility
```

### Production build

```bash
pnpm tauri build
```

## Everyday workflow

1. On first launch, create a new `.db` file or open an existing one.
2. Turn on **Bearbeitungsmodus** to manage GOÄ items, services, card colors, and the HTML template.
3. Turn edit mode off, select service cards, then **Text kopieren** (HTML + plain text) or **GOÄ kopieren** (hyphen-joined GOÄ numbers).

Service price is never entered on the service itself. It is the sum of attached GOÄ items (`price_cents`). Empty categories render as `Sonstiges`.

### Template placeholders

The template editor (edit mode) supports these tokens. Replacement is a plain string replace, so each token may appear more than once.

| Token | Replaced with |
| --- | --- |
| `{services}` | Selected titles grouped by category, in selection order. HTML wraps category labels in `<strong>`. |
| `{price}` | Total EUR (`de-DE`) from attached GOÄ prices. |
| `{goa}` | Unique GOÄ numbers, hyphen-joined, in selection order. |
| `{parameter}` | Unique GOÄ parameters, hyphen-joined, in selection order. |

Default template:

```html
<p>Sehr geehrte Damen und Herren,</p>
<p>folgende Leistungen: {services}</p>
<p>Gesamtpreis: {price}</p>
```

## Data location

The chosen SQLite path is stored in Tauri `app_data_dir` as `config.json` (identifier `com.cmd.price-calculator`):

- Linux: `~/.local/share/com.cmd.price-calculator/config.json`
- macOS: `~/Library/Application Support/com.cmd.price-calculator/config.json`
- Windows: `%APPDATA%\com.cmd.price-calculator\config.json`

If `config.json` has no `database_path` but `price-calculator.db` already exists in that folder, the app records that legacy file automatically.

Settings (template HTML, color presets) live **inside** the SQLite file, not in `config.json`. Switching databases therefore switches template and presets too.

## Releases and updates

Pushing a `v*` tag (or running the workflow manually) builds macOS (arm64 + x86_64), Linux, and Windows via `.github/workflows/main.yml`. The job creates a **draft** GitHub Release and writes `latest.json` for the updater.

Required repository secrets:

- `TAURI_SIGNING_PRIVATE_KEY`
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`

On launch the app checks `https://github.com/commandmaster-1/price-calculator/releases/latest/download/latest.json`. If a signed update exists, it downloads, installs, and relaunches with no confirmation prompt.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| Blank error / plugin failure in the browser | You ran `pnpm dev` instead of `pnpm tauri dev`. |
| Setup screen every launch | `config.json` missing, unreadable, or pointing at a path that cannot be opened. |
| `Diese GOÄ-Ziffer existiert bereits.` | `goae_items.number` is unique. |
| Service shows €0,00 | No GOÄ items attached, or attached items still have `price_cents = 0`. |
| Update never offered | Release is still a draft, `latest.json` missing, or the updater public key / signing secrets do not match. |
| Port 1420 already in use | Vite is configured with `strictPort: true` in `vite.config.ts`. Stop the other process. |

## License

Apache License 2.0. See [LICENSE](LICENSE).

## Internals

Schema, Tauri commands, migrations, and pricing rules: [docs/architecture.md](docs/architecture.md).
