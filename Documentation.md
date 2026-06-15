# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

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
DATABASE_URL=postgresql://admin:admin123@localhost:5432/fitmi_db
DB_HOST=localhost
DB_PORT=5432
DB_USER=admin
DB_PASSWORD=admin123
DB_NAME=fitmi_db
JWT_SECRET=<secret>
PORT=3000
```

Docker Compose runs PostgreSQL on port 5432 with those exact credentials. Prisma 7 reads `DATABASE_URL` via `prisma.config.ts` and the runtime Prisma client uses the same connection string through `@prisma/adapter-pg`. The `DB_*` variables are still used by the legacy raw `pg.Pool` connection module.

## Architecture

**Monorepo** with two independent apps:

```
fitmi_lab1/
├── Backend/    # Express + Prisma ORM + PostgreSQL
└── Frontend/   # React 19 + Vite + Tailwind v4 + shadcn/ui
```

### Backend (`/Backend/src`)

- `app.js` — Express entry point, mounts all routers under `/api/*`
- `db/prisma.js` — runtime Prisma client configured with `@prisma/adapter-pg` and `DATABASE_URL`
- `db/connection.js` — legacy raw `pg.Pool` connection check; currently imported for side effects but controllers use Prisma
- `prisma/schema.prisma` — Prisma schema used for migrations, generated client, and runtime ORM models
- `middleware/auth.middleware.js` — JWT verification, attaches `req.user` (contains `id`, `rol`)
- `middleware/admin.middleware.js` — role guard for admin routes
- Route → Controller pattern; most business logic lives in controllers, with `services/auth.service.js` used by auth

**Key data shapes stored as JSON columns:**
- `Rutina.ejercicios`: `[{dia: 1, nombre: "Día 1", ejercicios: [{nombre, series, reps, notas}]}]`
- `PlanAlimenticio.dias`: `[{dia: 1, nombre: "Lunes", comidas: [{nombre, momento, descripcion}]}]`

**API prefix**: all routes are under `/api/` — e.g. `/api/auth`, `/api/rutinas`, `/api/vinculos`, `/api/progreso`

### Frontend (`/Frontend/src`)

- `main.jsx` → `App.jsx` — React Router v7 SPA
- `context/AuthContext.jsx` — global auth state; user + token persisted in `localStorage`
- `api/auth.js` — single Axios instance (`baseURL: http://localhost:3000/api`) with JWT interceptor; **all API calls go through this file**
- `api/exercisedb.js` — fetches exercise library from `bootstrapping-lab/exercisedb-api` (GitHub raw JSON), cached in `localStorage` for 24h; normalizes name, body part, equipment, GIF URL, muscles, and instructions

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
