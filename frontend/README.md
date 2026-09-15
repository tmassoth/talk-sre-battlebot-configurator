# talk-sre-battlebot-configurator-react

A TypeScript + React + [Material-UI](https://mui.com/) port of the
**BattleBotForge Configurator** originally built as a Python/Flask app in
[`talk-sre-battlebot-configurator`](../../talk-sre-battlebot-configurator). It
keeps the same functionality and look and feel — pick a chassis (flipper,
spinner, hammer), a weapon power class, a paint job and a weapon, then see the
price and a checkout summary in real time.

## What changed vs. the Flask app

| Concern | Flask app | This app |
| --- | --- | --- |
| Rendering | Jinja2 templates + vanilla JS | React 18 + React Router + MUI |
| Styling | hand-written `style.css` | MUI theme + `sx` (same palette/fonts) |
| Catalog data | Azure SQL (`colors`, `engines`, `settings`) | Azure SQL via a read-only API in [`../backend/`](../backend), consumed through [`src/data/api.ts`](src/data/api.ts) |
| Payment failure | `POST /api/payment-unavailable` logs error code | `console.error` with the same code |

The pricing logic, the deliberately-unreachable payment probe
(`https://notfunctional.local`), the fixed payment error code
(`PAY-MSUTY3ZE-1OFQ`) and the maintenance-mode toggle are preserved so the
demo behaves the same way during the SRE talk.

## Prerequisites

- [Node.js](https://nodejs.org/) 18+ (for the front-end; ships with npm)
- [Python](https://www.python.org/) 3.10+ (for the backend)
- [Microsoft ODBC Driver 18 for SQL Server](https://learn.microsoft.com/sql/connect/odbc/download-odbc-driver-for-sql-server)
  (used by `pyodbc`)
- An [Azure SQL Database](https://learn.microsoft.com/azure/azure-sql/database/)
  seeded with the schema in [`../deploy/sql/`](../deploy/sql)

## Set up the database

Run the three seed scripts (idempotent) against your Azure SQL Database — e.g.
with `sqlcmd`:

```bash
sqlcmd -S <server>.database.windows.net -d <db> -G \
  -i ../deploy/sql/colors.sql -i ../deploy/sql/engines.sql -i ../deploy/sql/settings.sql
```

## Run it locally

The front-end (`frontend/`) talks to a small read-only catalog API in
[`../backend/`](../backend) (Flask + `pyodbc`) that loads `colors`, `engines`
and `settings` from Azure SQL. Run both from the repo root.

```bash
# 1) start the catalog API (http://localhost:3001)
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env      # then fill in DB_SERVER / DB_NAME / credentials
python app.py

# 2) in another terminal, start the front-end dev server (http://localhost:5173)
cd frontend
npm install
npm run dev
```

Then open http://localhost:5173 in your browser. The Vite dev server proxies
`/api` to the API on port 3001; for other environments set `VITE_API_BASE_URL`.

> **Auth:** leave `DB_USER` blank in `backend/.env` to connect with Azure AD /
> managed identity (`Authentication=ActiveDirectoryDefault`) instead of a SQL
> username/password. Database credentials live only in the API — never in the
> browser bundle.

## Other commands

```bash
# type-check and build a production bundle into dist/
npm run build

# preview the production build locally
npm run preview
```

## Toggling the demo behaviour

- **Maintenance mode**: set the `maintenance_mode` row in the `dbo.settings`
  table to `true` to disable the "Complete Order" button and show the
  maintenance notice (reloaded from Azure SQL on the next page load), exactly
  like the Flask app.
- **Payment outage**: the checkout deliberately probes an unreachable host, so
  clicking **Complete Order** surfaces the payment error card with the fixed
  error code — exactly like the original demo.

## Project structure

```
backend/                   # read-only catalog API (Flask + pyodbc)
  app.py                   # routes: /api/catalog, /api/colors, /api/engines
  db.py                    # Azure SQL connection + queries
  requirements.txt         # Python dependencies
  .env.example             # DB connection / CORS config
deploy/sql/                # Azure SQL schema + seed data (colors/engines/settings)
frontend/                  # React + MUI single-page app (this folder)
  src/
    main.tsx               # app bootstrap (theme, router, catalog provider, fonts)
    App.tsx                # routes + catalog loading/error gate
    theme.ts               # MUI theme + shared palette
    data/
      catalog.ts           # static vehicle types, powertrains, payment constants
      api.ts               # fetch client for the catalog API
      CatalogContext.tsx   # loads colors/engines/settings, provides them to pages
    components/
      Header.tsx           # sticky BattleBotForge header
      icons.tsx            # flipper / hammer SVG chassis icons
      BattlebotHero.tsx    # hero illustration
    pages/
      HomePage.tsx         # landing / hero
      SelectTypePage.tsx   # choose bot class
      ConfigurePage.tsx    # configurator + live price panel
      CheckoutPage.tsx     # checkout form + order summary
    utils/format.ts        # euro formatting
```
