# ClearFlow — System Resume (canonical)

**Date:** 2026-10-28  
**Status:** Live product = `clearflow-backend` + `clearflow-frontend` on Desktop  
**Audience:** Gerardo + Cursor / future agents  
**Related backup:** `~/Desktop/ClearFlow-Backup-2026-10-28/`

---

## 1. What ClearFlow is

ClearFlow is a **merchant reconciliation & cash-flow certainty SaaS** for SMEs (especially Spanish hospitality / multi-gateway shops).

It aims to:
1. Match **gateway / TPV collections** against **bank settlements** (to the cent).
2. Audit **processing fees** against contracted rates.
3. Surface **mismatches, disputes, and uncleared money**.
4. Produce a daily **“Coffee Report” / morning briefing** (match rate, fees, liquidity).
5. Support **multi-tenant** shops (Starter shared DB → Pro/Enterprise dedicated DB URL).

**Product positioning (short):** not generic bank↔ledger reconciliation (QuickBooks/Xero). ClearFlow verifies that **payment providers paid what they should, with the right fees**, for small multi-gateway merchants.

---

## 2. Where everything lives (on this Mac)

| Path | Role |
|------|------|
| `~/Desktop/clearflow-backend/` | API, engines, Docker/Render/Railway configs, local SQLite DB |
| `~/Desktop/clearflow-frontend/` | React/Vite UI, i18n (ES/EN), Vercel config |
| `~/Desktop/start-clearflow-backend.sh` | Local backend launcher (SQLite) |
| `~/Desktop/start-clearflow-frontend.sh` | Local frontend launcher |
| `~/Desktop/ClearFlow-Backup-2026-10-28/` | Full dated backup (excl. `node_modules` / `.venv`) |
| `~/Desktop/ClearFlow-TODO/`, `ClearFlow Claude/`, `ClearFlow Gemini/`, `ClearFlow-DEMO/` | Strategy / audit / sales docs (not runtime) |
| `~/Desktop/Checksystem Course ClearFlow/clearflow-backup-2026-10-08/` | Older Oct 8 backup (bundles + DB dumps) |

**Deleted 2026-10-28:** `~/Desktop/Atlas/` — older ClearFlow monorepo snapshot; superseded by the two repos above.

**Git remotes:**
- Backend → `https://github.com/gerardobirkhofer-lab/clearflow-backend.git`
- Frontend → `https://github.com/gerardobirkhofer-lab/clearflow-frontend.git`

**Known deploy URLs (from config):**
- API (build script): `https://clearflow-api-production.up.railway.app`
- Frontend CORS allowlist includes Vercel/Render demo hosts; `FRONTEND_URL` default prod in `render.yaml`: `https://clearflow-web.vercel.app`

---

## 3. Architecture (runtime)

```
┌────────────────────────────┐     ┌─────────────────────────────┐
│  clearflow-frontend        │     │  clearflow-backend          │
│  React 18 + Vite + i18n    │────▶│  FastAPI + SQLAlchemy async │
│  Port: Vite default 5173   │     │  Port: 8000                 │
└────────────────────────────┘     └──────────────┬──────────────┘
                                                  │
                     ┌────────────────────────────┼────────────────────────────┐
                     ▼                            ▼                            ▼
              SQLite local                 PostgreSQL (compose/      Redis (optional
           data/clearflow.db               Render/Railway)           / Celery broker)
```

**Local default (start scripts):** SQLite via `sqlite+aiosqlite:///data/clearflow.db` — Redis not required for basic API boot (warns if missing).

**Full stack (docker-compose):** Postgres 15 + Redis 7 + backend + celery-worker/beat (Celery has **no registered tasks** yet — shell only).

**Tenant DB routing (`backend/app/core/database.py`):**
- Shared meta DB always holds tenants / auth-related data.
- Starter tenants → shared DB, isolated by `tenant_id`.
- Pro/Enterprise → optional dedicated `database_url` per tenant.

---

## 4. How to run it locally

### Quick path (what you already use)

```bash
# Terminal 1 — API
~/Desktop/start-clearflow-backend.sh
# → http://localhost:8000  |  docs: http://localhost:8000/docs  |  health: /health

# Terminal 2 — UI
~/Desktop/start-clearflow-frontend.sh
# → Vite on 0.0.0.0 (see terminal for port; usually 5173)
```

### Manual backend

```bash
cd ~/Desktop/clearflow-backend/backend
export DATABASE_URL='sqlite+aiosqlite:///data/clearflow.db'
export SECRET_KEY='dev-secret-key'
export REDIS_URL='redis://localhost:6379/0'
export FRONTEND_URL='http://localhost:3000'   # or http://localhost:5173
export PYTHONPATH="$(pwd)"
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Manual frontend

```bash
cd ~/Desktop/clearflow-frontend
# .env should set VITE_API_URL (e.g. http://localhost:8000)
npm install   # if needed
npm run dev
```

### Docker full stack

```bash
cd ~/Desktop/clearflow-backend
docker compose up --build
```

### Useful seed / test assets

| File | Purpose |
|------|---------|
| `clearflow-backend/seed_data.sql` | SQL seed |
| `clearflow-backend/backend/scripts/seed_rich_data.py` | Rich demo seed script |
| `clearflow-backend/test_santander.csv` / `test_stripe.csv` | Sample uploads |
| `clearflow-backend/test_api.sh` | API smoke helper |
| `clearflow-backend/backend/data/clearflow.db` | Local SQLite DB |

---

## 5. Coding map — backend

**Root of app:** `clearflow-backend/backend/app/`

| Area | Path | Notes |
|------|------|-------|
| Entry | `main.py` | FastAPI app, CORS, `/health`, router mount |
| Config | `core/config.py` | Settings |
| Auth deps | `core/auth.py` + `api/v1/auth.py` | **Demo JWT** — login/register always return demo user |
| DB | `core/database.py` | Shared + tenant engines |
| Email | `core/email.py` | SMTP helper (disputes) |
| Celery | `core/celery_app.py` | Broker config; `include=[]` — **no tasks** |
| ORM models | `models/*.py`, `models_orm.py` | Dual model layers (legacy + ORM) — messy but live |
| Domain providers | `providers/*_provider.py` | Matching / fees / TPV / bank / cashflow / notifications |
| Services | `services/` | CSV parse, ingestion, matching, morning reports |
| HTTP API | `api/v1/` | See mounted routers below |

### Routers actually mounted in `main.py`

| Prefix | Module | Maturity |
|--------|--------|----------|
| `/api/v1/auth` | `auth.py` | Demo-only |
| `/api/v1/tenants` | `tenants.py` | Live |
| `/api/v1` | `institutions.py` | Thin / stubby |
| `/api/v1` | `collections.py` | Upload/manual collections |
| `/api/v1/bank-statements` | `bank_statements.py` | Upload + list + dashboard |
| `/api/v1/providers` | `providers.py` | Provider upload/list |
| `/api/v1/disputes` | `disputes.py` | **Strong** — CRUD, email, logs |
| `/api/v1` | `tpv_reports.py`, `fee_structures.py` | Empty stub routers |
| `/api/v1/reconciliation` | `reconciliation.py` | Run/status |
| `/api/v1` | `cash_flow.py` | Empty stub |
| `/api/v1` | `morning_reports.py` | Generate/get reports (**backend ready; UI rarely calls**) |
| `/api/v1` | `uploads.py`, `webhooks.py` | Empty stubs |
| `/api/v1` | `dashboard.py` | Summary + cash-flow |

### Present on disk but **not** mounted in `main.py`

- `api/v1/stripe_connect.py` — Stripe Connect OAuth/sync/webhook (~229 lines)
- `api/v1/api_stripe.py` — Checkout sessions / customers / webhook
- Several 3-line stubs: `attachments`, `comments`, `invitations`, `notifications`, `projects`, `tasks`, `users`

### Core engines (product IP)

| Engine | Path | Reality check |
|--------|------|---------------|
| Three-way matching | `providers/reconciliation_provider.py` | Algorithm present; orchestration via `matching_service.py` |
| Fee calc (% / flat / mixed / tiered) | `providers/fee_provider.py` | In-memory `_storage` |
| Bank / TPV / txn stores | `bank_provider`, `tpv_provider`, `transaction_provider` | Mostly in-memory |
| Cash-flow projection | `cashflow_provider.py` | Logic present |
| Morning / Coffee Report | `report_service.py` + `notification_provider.py` | DB-oriented report builder |
| Spanish bank CSV | `services/csv_parser.py` | Santander / BBVA / Caixa / Sabadell / generic |
| File ingestion | `services/ingestion_service.py` | Collections, bank, TPV, fee configs |

**Stack:** Python 3.11, FastAPI, SQLAlchemy async, Alembic, Redis, Celery, Stripe SDK, pandas/openpyxl, aiosmtplib. Managed with Poetry (`backend/pyproject.toml`).

---

## 6. Coding map — frontend

**Root:** `clearflow-frontend/src/`

| Area | Path |
|------|------|
| Router / shell | `App.tsx`, `main.tsx` |
| i18n | `i18n/` (`es.json`, `en.json`) |
| Shared UI | `components/` (PageLayout, ExportModal, StripeConnect, …) |
| Product pages | `pages/` |

### Main user flows (routes)

| Route | Page | Job |
|-------|------|-----|
| `/` → marketing HTML | `vercel.json` redirects to `clearview.html` | Public landing |
| `/login` | `Login.tsx` | Demo auth |
| `/welcome` → `/wizard` | Onboarding | First-time setup |
| `/hub` | `PostLoginHub` / hub | Post-login home |
| `/smartcheck-wizard` | `SmartCheckWizard` | Guided check + file detect |
| `/setup`, `/setup-wizard` | Setup | Providers, banks, Stripe Connect UI |
| `/dashboard` | Dashboard | Overview |
| `/reconciliation` | Reconciliation | Match run UX |
| `/mismatch-tracker` | MismatchTracker | Discrepancies |
| `/dispute-tracker` | DisputeTracker | Disputes |
| `/communications` | Communications | Email trail |
| `/reports` | Reports | Report cards |
| `/statistics` | Statistics | Provider health (thinner than old Atlas scorecard) |
| `/profitability`, `/revenue-control` | Finance views | Margin / control |
| `/pricing` | Pricing | Plans |
| `/tenant-selector` | TenantSelector | Switch store |

**Upload auto-detect (frontend heuristics):** Stripe, Redsys, Mercado Pago, PayPal, TPV, Santander/BBVA/Caixa/Sabadell bank CSVs (`DocUploadCenter.tsx`, `SmartCheckWizard.tsx`). Detection ≠ full backend connector.

**Stack:** React 18, React Router 6, Vite 5, TypeScript, Axios, i18next.

---

## 7. Providers & integrations — truth table

| Provider / channel | UI / config | Backend reality | Status |
|--------------------|-------------|-----------------|--------|
| **CSV bank statements** (Santander, BBVA, CaixaBank, Sabadell) | Upload wizards | `csv_parser.py` + bank statement APIs | **Working path** (file-based) |
| **CSV / file gateway dumps** (Stripe, Redsys, MP, PayPal keywords) | Auto-detect upload | Ingestion / provider upload APIs | **Partial** — detect + store; depth varies |
| **Stripe Connect / Checkout** | `StripeConnect`, checkout buttons, Setup | `stripe_connect.py`, `api_stripe.py` exist; **not mounted in `main.py`** | **Code present, not wired to app** |
| **Stripe env keys** | — | `.env` has `STRIPE_*` | Config ready |
| **Redsys / TPV live API** | Setup labels | No live SIS/API client | **Not built** (CSV/heuristics only) |
| **Ágora / Glop** | Product roadmap docs | No connector code | **Not built** |
| **Mercado Pago / PayPal / SumUp APIs** | Setup/onboarding IDs | No OAuth/API clients | **Not built** (file detect only) |
| **Open Banking (Nordigen / Plaid)** | `.env` key names | No implementation | **Placeholder only** |
| **SMTP disputes email** | DisputeTracker | `disputes.py` + `core/email.py` | **Implemented** |
| **Celery background reconcile** | docker-compose workers | Empty task registry | **Infra only** |
| **Morning report delivery** (email/WhatsApp) | Product vision | Generate API exists; no push channel wired | **Engine ≠ delivery** |

---

## 8. Environment keys (names only)

**Backend `.env` (present):**  
`DATABASE_URL`, `REDIS_URL`, `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND`, `SECRET_KEY`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `ENVIRONMENT`, `LOG_LEVEL`, `S3_*`, `SMTP_*`, `FROM_EMAIL`, `NORDIGEN_*`, `PLAID_*`, `STRIPE_*`, `FRONTEND_URL`, `REACT_APP_API_URL`

**Frontend:** `VITE_API_URL` (local + `.env.production`)

Real values live in:
- Live: `clearflow-backend/.env`, `clearflow-frontend/.env*`
- Backup private copy: `ClearFlow-Backup-2026-10-28/private-secrets/` (**do not commit / share**)

---

## 9. Deploy

| Piece | Config | Notes |
|-------|--------|-------|
| Backend Docker | `clearflow-backend/Dockerfile`, `backend/Dockerfile` | |
| Compose | `docker-compose.yml` | Local full stack |
| Render | `render.yaml` | `clearflow-api` + `clearflow-db` |
| Railway | `railway.toml` | Dockerfile build, `/health` |
| Frontend Vercel | `vercel.json` | SPA rewrites + marketing HTML redirects |
| Frontend build | `npm run build` | Hardcodes Railway API URL in script |

---

## 10. Auth & multi-tenant — critical honesty

- **Auth is demo mode:** `/register` and `/login` always return the same JWT + `demo@clearflow.local` (`api/v1/auth.py`).
- Fine for demos; **not safe for a second paying tenant**.
- Tenant model + DB routing code exists and is more advanced than auth.
- Frontend stores `token` / ClearFlow keys in `localStorage`.

This matches the documented launch blocker: **real password auth + unified `get_current_user` before more customers**.

---

## 11. Known gaps / next engineering priorities

1. **Real auth** (hash passwords, persist users, drop always-valid demo token).
2. **Mount or delete** Stripe routers (`stripe_connect`, `api_stripe`) — dead code until included in `main.py`.
3. **Wire morning reports** to frontend + schedule (Celery task).
4. **Persist matching/fee engines** to ORM (replace in-memory `_storage`).
5. **Background reconciliation** (Celery tasks; avoid request timeouts on large tenants).
6. **First live connector beyond CSV** — roadmap order: Ágora → Redsys API → Stripe webhooks (see `ClearFlow Claude/HOJA_DE_RUTA_MAESTRA_CLEARFLOW.md`).
7. Cleanup empty folders/stubs: `infra/`, `carpeta sin título/`, 3-line routers.

---

## 12. Coding resume (one paragraph)

ClearFlow is a **FastAPI + React** multi-tenant reconciliation product. The **working spine** is file upload → Spanish bank / gateway CSV parsing → collections & bank statements → reconciliation/mismatch/dispute UIs, with a **strong disputes+email** module and a **morning-report engine** that is backend-ready but under-consumed by the UI. Provider “integrations” in Setup are mostly **labels + CSV heuristics**; Stripe Connect code exists but is **not mounted**; Nordigen/Plaid/Ágora/live Redsys are **not implemented**. Local run is SQLite via Desktop start scripts; production targets Railway/Render + Vercel. Auth is still **demo JWT**. Treat strategy docs under `ClearFlow-*` folders as product intent; treat this file as the **code reality map**.

---

## 13. Restore from backup

```bash
# Example restore of source trees (adjust if overwriting live copies)
rsync -a ~/Desktop/ClearFlow-Backup-2026-10-28/clearflow-backend/ ~/Desktop/clearflow-backend/
rsync -a ~/Desktop/ClearFlow-Backup-2026-10-28/clearflow-frontend/ ~/Desktop/clearflow-frontend/
cp ~/Desktop/ClearFlow-Backup-2026-10-28/private-secrets/clearflow-backend.env ~/Desktop/clearflow-backend/.env
cp ~/Desktop/ClearFlow-Backup-2026-10-28/private-secrets/clearflow-frontend.env ~/Desktop/clearflow-frontend/.env
cd ~/Desktop/clearflow-frontend && npm install
# backend: recreate venv / poetry install as you normally do
```

Then use the start scripts in §4.

---

*Generated 2026-10-28 from live Desktop repos after Atlas deletion. Update this file when connectors or auth change.*
