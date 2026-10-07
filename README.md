# DatabaseTrackerPro

A full-stack "dev environment" dashboard: dozens of tools (database browser, SQL query runner, file explorer, AI chat, credential manager, deployment and security dashboards) served through one React + Express + Postgres app. Built as a Replit export. Note: the repo's old `README.md` titled it "AI Agent Development Environment" — the features below are what the code actually implements.

## Features

- **Database browser** — list tables with row counts and column metadata, browse rows, run SQL queries (`/api/database/tables`, `/api/database/table`, `/api/database/query`) with timing feedback.
- **File explorer** — project file CRUD via `/api/projects/:id/files` and `/api/files`.
- **Venice AI chat** — generate/review text through the Venice AI service (`/api/venice/models`, `/api/venice/generate`, `/api/venice/review`).
- **Credential manager** — store/list/scan credentials per platform (`/api/credentials/*`).
- **Deployment dashboards** — endpoints for Heroku, Vercel, AWS, and Docker deploys (`/api/deployment/*`).
- **Security framework page** — references security tooling (links to Metasploit modules on GitHub); Metasploit itself is not bundled.
- **Version control, environment snapshots, automated testing dashboards** — UI pages backed by local services.
- **Auth** — login/register routes with user authentication (`authenticateUser`) guarding the API.
- Miscellaneous pages: code snippets, API key generator, debug dashboard, multiplayer, secrets manager, data dashboard.

## Tech stack

- Frontend: React, TypeScript, Vite, Wouter, TanStack Query, Tailwind CSS, shadcn/ui, lucide-react.
- Backend: Node.js 20, Express, TypeScript, WebSocket support (`server/websocket.ts`), ~25 service modules in `server/services/`.
- Database: PostgreSQL (module `postgresql-16`) with Drizzle ORM (`drizzle.config.ts`, `shared/` schemas).
- AI: Venice AI service; Anthropic key demo page.
- Extras: `jest.config.js` test setup, Windows batch install scripts (`WINDOWS_QUICK_START.bat`, `setup_github.bat`), extensive deployment docs.

## Getting started

The old README's install steps line up with the actual scripts (`dev`, `build`, `start`, `check`, `db:push`):

```bash
npm install
cp .env.example .env        # configure DATABASE_URL and any AI keys
npm run db:push              # push the Drizzle schema
npm run dev                 # start on port 5000
```

Or on Windows: run `WINDOWS_QUICK_START.bat`. See `DEPLOYMENT.md` / `WINDOWS_DEPLOYMENT_GUIDE.md` for the documented local-machine install. The repo also ships several test scripts (`test-comprehensive-system.js`, `test-all-features.js`) with results in `test-results/`.

## Project structure

```
├── client/src/        # React app (~31 pages in pages/ + shared ui components)
├── server/            # Express app
│   ├── routes.ts      # ~3,800-line route registration
│   └── services/      # ~25 services (venice-ai, file-manager, deployment,
│                      # credential-manager, security-framework, vm-manager, ...)
├── shared/            # schemas shared by client and server
├── tests/             # jest tests
├── *.md               # deployment guides (Windows, GitHub, security framework)
├── WINDOWS_QUICK_START.bat / setup_github.bat
└── replit.md          # describes the app as a Replit-like local dev environment
```

## Status

**Working prototype / workbench.** Many pages and endpoints are implemented; the feature set is sprawling and partially scaffolded — test reports and multiple "demo"/"old" files (`*_old.ts`, `broken_demo.js`, `debug-sandbox.ts.backup`) indicate active experimentation rather than a finished product. Claims in the old `README.md` (e.g. "self-healing", "self-learning") are aspirational and not verified against the code. Exported from https://replit.com/@undertheclearbl/DatabaseTrackerPro.
