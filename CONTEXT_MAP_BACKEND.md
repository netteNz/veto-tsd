## Context Map — veto-webapp (full repo)

No specific task was given, so this is a whole-repo map: every source file with its purpose. Grouped by area.

### Root

| File | Purpose |
|------|---------|
| `README.md` | Project overview; claims a React+Tailwind+Vite frontend, but **no frontend directory exists in the repo** — backend-only currently. |
| `mkdocs.yml` | MkDocs Material config for the docs site (`docs/`); nav = Home/API/Architecture. |
| `nixpacks.toml` | Railway/Nixpacks build: installs deps, collects static, runs `migrate` + `gunicorn` from `server/`. |
| `procfile` / `server/Procfile` | Process definitions for Heroku-style deploy (`gunicorn api.wsgi:application`); two near-duplicate files exist (root and `server/`). |
| `requirements.txt` | Python deps: Django 5.2.5, DRF, `transitions` (FSM lib), `dj-database-url`, `whitenoise`, `django-jazzmin`, `django-autocomplete-light`, `django-import-export`, mkdocs. |
| `runtime.txt` | Python runtime version pin for deploy platform. |
| `LVT Veto System Proposal v2 Bo5 - VetoRules.csv` | Design-spec doc: 7-step ban schedule + per-game pick assignment rules (mislabeled — actually lists the Bo7 game sequence under a "Bo5" filename). |
| `LVT Veto System Proposal v2 Bo5 - VetoRulesPlayedOut.csv` | Worked example of the veto rules applied, correctly truncated to 5 games (true Bo5); legend column for ban/pick color-coding lost in CSV export. |
| `LVT Veto System Proposal v2 Bo5 - Helper.csv` | Static dropdown-option lists (13 objective map+mode combos, 5 Slayer maps) — spreadsheet UI data, not executable logic. |

### `docs/` (MkDocs site)

| File | Purpose |
|------|---------|
| `docs/index.md` | Docs landing page; describes project structure and how frontend is meant to consume the API (aspirational — frontend doesn't exist yet). |
| `docs/architecture.md` | **Primary design doc.** State machine diagram (`TSDMachine`), 7-step ban schedule, Bo3/Bo5/Bo7 round-slot patterns, reuse constraints, domain model table — matches the actual code closely. |
| `docs/api.md` | REST API reference. **Partly stale/aspirational**: documents endpoints (`/api/series/{id}/action/`, `/api/gametypes/`, `/api/series/{id}/transition/`) that don't match the real routes in `veto/urls.py` (real ones are `ban_objective_combo`, `pick_slayer_map`, `assign_roles`, `confirm_tsd`, `gamemodes`, etc.). |
| `docs/websocket-implementation-plan.md` | Forward-looking plan (not yet implemented) to add Django Channels for real-time event broadcasting + Discord bot integration. Purely a proposal — no `veto/events.py`, no channels config exists yet. |

### `server/api/` (Django project config)

| File | Purpose |
|------|---------|
| `settings.py` | Django settings: DRF config, CORS (allows `nettenz.github.io` + localhost), SQLite/Postgres via `DATABASE_URL`, Whitenoise static, `jazzmin` admin theme, custom exception handler. |
| `urls.py` | Root URL conf: `/admin/`, `/admin/veto/` (DAL autocomplete), `/api/` → delegates to `veto.urls`, `/healthz/`. |
| `middleware.py` | `ApiErrorsAsJson` — catches unhandled exceptions on `/api/*` paths and returns JSON instead of Django's HTML error page. |
| `exceptions.py` | DRF custom exception handler; wraps error responses in a consistent `{"detail":..., "status":...}` envelope. |
| `asgi.py` / `wsgi.py` | Standard Django ASGI/WSGI entrypoints (ASGI currently unused for anything async — no Channels wired in yet, despite the websocket plan doc). |

### `server/veto/` (core app)

| File | Purpose |
|------|---------|
| `models.py` | Domain models: `GameMode`, `Map` (M2M to modes), `Series` (state machine fields), `SeriesRound` (per-game slot), `SeriesBan` (immutable ban record), `Action` (audit log — appears to be a legacy/parallel-tracking model alongside `SeriesBan`/`SeriesRound`). |
| `machine_tsd.py` | **Core game logic.** `TSDMachine` class wrapping `transitions.Machine`; encodes the 7-step ban schedule, Bo3/Bo5/Bo7 round slots, turn enforcement, reuse constraints (no-repeat Slayer maps, no-repeat exact Objective combo), undo/reset. This is the executable version of the CSV rules doc. |
| `views.py` | DRF viewsets/actions: `SeriesViewSet` (assign_roles, confirm_tsd, ban_*, pick_*, undo, reset — all delegate to `TSDMachine`), `MapViewSet`, `GameModeViewSet`, `ActionViewSet`, `MapModeComboView`/`MapModeGroupedView` (flattened/grouped map×mode combo listings), `HealthView`. |
| `serializers.py` | DRF serializers; `SeriesSerializer.get_actions` merges `SeriesBan` + `SeriesRound` + legacy `Action` records into one unified action timeline for API responses. |
| `urls.py` | App router: registers `maps`, `series`, `actions`, `gamemodes` viewsets + `health/`, `maps/combos/`, `maps/combos/grouped/`. |
| `admin.py` | Django admin registrations (Jazzmin-themed, import/export enabled) for all models, with inlines for `Action`/`SeriesRound`/`SeriesBan` on the `Series` admin page. |
| `admin_urls.py` | `GameModeAutocomplete` view for `django-autocomplete-light` widget used in `MapForm`. |
| `apps.py` | Standard `AppConfig` for the `veto` app. |
| `management/commands/seed_hcs.py` | Data-seeding command: populates official HCS 2025 maps/modes (Slayer, CTF, KOTH, Oddball, Strongholds + Lattice additions) — this is effectively where `Helper.csv`'s map/mode pool should be reconciled against. |
| `conftest.py` | pytest-django bootstrap (`DJANGO_SETTINGS_MODULE` setup). |

### `server/veto/tests/`

| File | Purpose |
|------|---------|
| `tests/test_series_flow.py` | pytest-django test hitting the `series-veto` endpoint via `APIClient`; sets up modes/maps/series in `setUp`. |
| `tests/test_views_pytest.py` | **Broken/stale test file** — references `Series.objects.create(name=...)` (no `name` field on `Series`), uses `self.series`/`self.client` without a `setUp`, and posts to a hardcoded placeholder URL `/undo-action-url/`. Will fail or error if collected. |
| `veto/tests.py` (legacy, sibling to `tests/` package) | Empty Django boilerplate (`# Create your tests here.`) — dead file now that `tests/` is a package. |

---

### Risk / Consistency Notes
- [ ] **No frontend exists** despite README/docs describing one (React/Vite) — anyone picking this up should confirm whether frontend work is in scope or tracked elsewhere.
- [ ] **`docs/api.md` is out of sync** with the real endpoints in `veto/urls.py`/`views.py` — don't trust it as ground truth; `architecture.md` is more accurate.
- [ ] **`test_views_pytest.py` is broken** and references a nonexistent `name` field and undefined fixtures — will error on collection/run.
- [ ] **Duplicate `Procfile`** (root `procfile` vs `server/Procfile`) — verify which one the active deploy target actually uses.
- [ ] **`Action` model looks partially redundant** with `SeriesBan`/`SeriesRound` — `SeriesSerializer.get_actions` merges all three, suggesting `Action` may be legacy scaffolding kept for backward compat rather than actively written to by `TSDMachine`.
- [ ] The three CSV files at repo root aren't referenced by any code — they're a human design spec, not consumed programmatically.
