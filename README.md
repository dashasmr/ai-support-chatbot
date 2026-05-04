# AI Support Chatbot

Portfolio-style project: **streaming** AI chat, conversation persistence in **PostgreSQL**, an **admin dashboard** with analytics, and **CSV export** of history.

## Why this architecture

| Layer | Role |
|--------|------|
| **Frontend (Vite + React)** | Chat and admin UI. Does **not** hold OpenAI secrets—only calls your backend. |
| **Backend (Express)** | Validates requests, calls OpenAI, writes history to the database, exposes protected admin APIs. |
| **PostgreSQL** | Durable storage: history survives server restarts (unlike in-memory arrays). |
| **Migrations** | Versioned schema: one command reproduces the same tables on any machine or server. |

## What is included

- Streaming assistant replies in the chat UI
- Persisted user ↔ assistant pairs in the `conversations` table
- `GET /api/chat/history` — pagination and text search
- `GET /api/chat/analytics` — date filters, counts by hour and by day
- Admin routes secured with header `x-admin-key` and `ADMIN_API_KEY` in `.env`
- `GET /api/chat/history/export` — CSV download
- `GET /health` — liveness plus a simple database check

## Local setup

### 1) PostgreSQL

Create a database (name must match `DATABASE_URL`, e.g. `ai_support_chatbot`).  
The app only persists history when a real database is available.

### 2) Backend

```bash
cd backend
cp .env.example .env
# Set OPENAI_API_KEY, ADMIN_API_KEY, DATABASE_URL
npm install
npm run db:migrate
npm run dev
```

- **`db:migrate`** — applies SQL from `backend/db/migrations/` and records versions in `schema_migrations`.
- **`db:seed`** — optional demo rows when the table is empty.

### 3) Frontend

```bash
cd frontend
cp .env.example .env
# Default VITE_API_URL=http://localhost:5000 is fine for local dev
npm install
npm run dev
```

**Why `VITE_API_URL`:** in production the API lives on another host. Hard-coding `http://localhost:5000` breaks deployed builds. Vite injects `import.meta.env.VITE_API_URL` at build time.

### 4) Smoke checks

- Browser: send a chat message and confirm the reply streams in.
- `GET http://localhost:5000/health` → `{ "ok": true, "database": "connected" }`
- Admin tab: enter `ADMIN_API_KEY` → **Load analytics** / **Export CSV**

## Environment variables

### Backend (`backend/.env`)

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | OpenAI API key (server only—never expose in the browser bundle). |
| `ADMIN_API_KEY` | Secret matched against header `x-admin-key` for `/api/chat/history*` and `/api/chat/analytics`. |
| `DATABASE_URL` | PostgreSQL connection string (`postgresql://user:pass@host:5432/dbname`). |
| `PORT` | Express port (default `5000`). |
| `FRONTEND_URL` | Allowed browser origins for CORS, comma-separated. If empty, local Vite URLs are allowed for development. |

### Frontend (`frontend/.env`)

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | API base URL **without** a trailing slash, e.g. `https://api.example.com`. |

## Useful commands

```bash
# Backend
cd backend && npm run dev          # development
cd backend && npm run db:migrate   # apply new migrations
cd backend && npm run db:seed      # optional seed when empty

# Frontend
cd frontend && npm run dev
cd frontend && npm run build       # production build
```

## Deployment guide (Vercel + Render)

This stack is common for portfolios: **static frontend on Vercel**, **Node API + managed Postgres on Render**. Pricing and free-tier limits change over time—check each provider’s site before you rely on “free forever.”

**You pay separately for OpenAI usage** (API calls from your backend). Hosting can be $0 on free tiers; OpenAI is not.

### Prerequisites

- Code is pushed to **GitHub** (or GitLab; below assumes GitHub).
- You have accounts on [render.com](https://render.com) and [vercel.com](https://vercel.com).

### Part A — PostgreSQL on Render

1. In the Render dashboard: **New +** → **PostgreSQL**.
2. Pick a name, region, and instance type (use the smallest / free option if available).
3. After creation, open the database → copy **`Internal Database URL`** (preferred when the API runs on Render in the same region) or **External** if Render docs say to use it for your setup.
4. That value becomes `DATABASE_URL` for the backend (see Part B).

### Part B — Backend (Web Service) on Render

1. **New +** → **Web Service** → connect your Git repository.
2. **Root Directory:** `backend`  
   (so Render runs `npm install` in the API folder, not the repo root.)
3. **Runtime:** Node (match your local Node major version if prompted).
4. **Build Command:**

   ```bash
   npm install && npm run db:migrate
   ```

   This installs dependencies and applies SQL migrations before the app starts—so production tables exist.

5. **Start Command:**

   ```bash
   npm start
   ```

6. **Environment** (Render → *Environment* for this service). Add:

   | Key | Value |
   |-----|--------|
   | `DATABASE_URL` | From Part A (Postgres URL). |
   | `OPENAI_API_KEY` | Your OpenAI secret key. |
   | `ADMIN_API_KEY` | Long random string; you will paste it into the Admin UI header. |
   | `FRONTEND_URL` | Leave **empty** until Part D; then set to your Vercel URL (see below). |

   Render sets `PORT` automatically—your app already uses `process.env.PORT`.

7. Deploy and wait for the build to finish. Copy the service URL, e.g. `https://your-api.onrender.com`.

8. Smoke test in a browser or curl:

   - `https://your-api.onrender.com/health` → should return `ok: true` and `database: "connected"`.

**Cold starts:** on free/low tiers the service may sleep after inactivity. The first request can take ~30–60s to wake up—normal for demos; mention it in your portfolio if needed.

### Part C — Frontend on Vercel

1. **Add New…** → **Project** → import the same Git repository.
2. **Root Directory:** `frontend`
3. **Framework Preset:** Vite (or “Other” with `npm run build` / output `dist` if Vercel auto-detects wrong).
4. **Environment Variables** (Vercel → Project → Settings → Environment Variables):

   | Name | Value | Environment |
   |------|--------|----------------|
   | `VITE_API_URL` | `https://your-api.onrender.com` (no trailing slash) | Production (and Preview if you want previews to hit a staging API). |

5. Deploy. Open the Vercel URL (e.g. `https://your-app.vercel.app`).

6. Test the chat. If the browser console shows **CORS errors**, finish Part D.

### Part D — Lock CORS to your real frontend

1. In Render → your **Web Service** → **Environment**, set:

   `FRONTEND_URL` = `https://your-app.vercel.app`

   (exact origin: `https`, host, no path. For `www` vs apex, use the URL users actually open.)

2. **Redeploy** the web service so the new env applies.

3. Reload the Vercel site and test chat + Admin again.

### Checklist before you share the link

- [ ] `/health` OK on the Render URL  
- [ ] Chat streams and messages persist (refresh page / check admin history)  
- [ ] Admin tab works with `x-admin-key` = your `ADMIN_API_KEY`  
- [ ] README or repo description lists **live demo URL** + note that OpenAI usage is yours / rate limits

---

## Roadmap to a strong portfolio repo

Do these in order. Each line explains **why** it matters.

1. **Green local path** — chat, `/health`, admin, CSV all work.  
   *Proves the repo is reproducible.*

2. **Clean Git history** — one commit ≈ one coherent change.  
   *Reviewers read history faster.*

3. **Secrets hygiene** — keep `.env` gitignored; ship `.env.example` only. Rotate keys if leaked.  
   *Secrets in source are a red flag.*

4. **Deploy the API** (Railway, Render, Fly.io, etc.) + managed Postgres (or DB on the same platform).  
   *A live API URL is strong on a resume.*

5. **Deploy the frontend** (Vercel, Netlify, Cloudflare Pages). Set **`VITE_API_URL`** in the host’s build env to the API URL from step 4.  
   *The site must not call `localhost` in production.*

6. **CORS** — set `FRONTEND_URL` in `backend/.env` to your deployed site origin(s). When unset, local Vite origins are allowed.  
   *Reduces risk of other sites calling your API from a victim’s browser.*

7. **Polish the repo** — this README plus one or two screenshots in the GitHub repo description.  
   *Recruiters skim in under a minute.*

8. **Optional** — smoke test for `/health`, GitHub Actions for `npm run lint` / `npm run build`.  
   *Signals engineering discipline.*

---

**TL;DR:** backend = secrets + database + business logic; frontend = UI + `VITE_API_URL`; Postgres = source of truth; migrations = schema versioning.
