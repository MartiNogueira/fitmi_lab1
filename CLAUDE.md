# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Start everything (recommended)
```bash
./start.sh   # Docker + Backend + Frontend in parallel, opens http://localhost:5173
```

### Individual services
```bash
# Database
docker compose up -d

# Backend (from /Backend)
npm run dev       # prisma generate + nodemon src/app.js
npm start         # production

# Frontend (from /Frontend)
npm run dev       # Vite dev server on http://localhost:5173
npm run build
npm run lint
```

## Environment variables

Backend requires a `.env` file in `/Backend`:
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=admin
DB_PASSWORD=admin123
DB_NAME=fitmi_db
JWT_SECRET=<secret>
PORT=3000
```

Docker Compose runs PostgreSQL on port 5432 with those exact credentials.

## Architecture

**Monorepo** with two independent apps:

```
fitmi_lab1/
├── Backend/    # Express + Prisma + pg (raw pool for queries)
└── Frontend/   # React 19 + Vite + Tailwind v4 + shadcn/ui
```

### Backend (`/Backend/src`)

- `app.js` — Express entry point, mounts all routers under `/api/*`
- `db/connection.js` — raw `pg.Pool` used directly in controllers (NOT Prisma client for queries)
- `prisma/schema.prisma` — Prisma is used **only for migrations/schema management**, not as the ORM at runtime
- `middleware/auth.middleware.js` — JWT verification, attaches `req.user` (contains `id`, `rol`)
- `middleware/admin.middleware.js` — role guard for admin routes
- Route → Controller pattern: no service layer except `services/auth.service.js`

**Key data shapes stored as JSON columns:**
- `Rutina.ejercicios`: `[{dia: 1, nombre: "Día 1", ejercicios: [{nombre, series, reps, notas}]}]`
- `PlanAlimenticio.dias`: `[{dia: 1, nombre: "Lunes", comidas: [{nombre, momento, descripcion}]}]`

**API prefix**: all routes are under `/api/` — e.g. `/api/auth`, `/api/rutinas`, `/api/vinculos`, `/api/progreso`

### Frontend (`/Frontend/src`)

- `main.jsx` → `App.jsx` — React Router v7 SPA
- `context/AuthContext.jsx` — global auth state; user + token persisted in `localStorage`
- `api/auth.js` — single Axios instance (`baseURL: http://localhost:3000/api`) with JWT interceptor; **all API calls go through this file**
- `api/exercisedb.js` — fetches exercise library from [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (GitHub raw JSON), cached in `localStorage` for 24h; provides name, images (array of URLs), muscles, instructions

**User roles** (`Rol` enum): `cliente`, `entrenador`, `nutricionista`, `admin`

Role-based routing: professionals have their own pages under `/entrenador/*` and `/nutricionista/*`. The `Dashboard` page renders different content based on `user.rol`.

**Component structure:**
- `components/AppLayout.jsx` — main shell with `Sidebar` (desktop) + `BottomNav` (mobile) + `Navbar`
- `components/ui/` — shadcn/ui primitives (button, card, input, label)
- `pages/entrenador/` — trainer views (alumnos, rutinas, solicitudes, dashboard)
- `pages/nutricionista/` — nutritionist views (pacientes, planes, solicitudes, dashboard)

### Vínculo system

Users connect to professionals (entrenador/nutricionista) via the `Vinculo` model. State machine: `pendiente → activo | rechazado`. A user can only have one active link per professional type. Progress (`/progreso`) routes show the routine/plan assigned to the linked client.

### Notifications

`Notificacion` model used for system events (vinculo requests, approvals, etc.). Frontend polls via `NotificationBell` component.

### Messaging

Direct 1-to-1 chat between users. `InboxChat` lists conversations; `Chat` page shows a thread by `userId`.

### Professionals approval flow

New professionals register via `/register-profesional` with `estado: pendiente`. Admin approves/rejects via `/api/admin`. Pending professionals cannot log in until approved.
