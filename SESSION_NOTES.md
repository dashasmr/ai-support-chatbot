# Session Notes

Use this file as a quick memory between chats.

## Current status

- Date: 2026-05-05
- Project: `ai-support-chatbot`
- Main goal: deploy backend + frontend and keep a stable workflow.

## What is done

- Render PostgreSQL was created.
- Render backend service was created.
- Deployment flow was documented in `README.md` (Vercel + Render).
- CORS setup is tied to `FRONTEND_URL` on backend.

## Current blocker / open tasks

- Verify backend env vars in Render:
  - `DATABASE_URL`
  - `OPENAI_API_KEY`
  - `ADMIN_API_KEY`
  - `FRONTEND_URL` (temporary local URL now, replace after Vercel deploy)
- Confirm backend health endpoint works:
  - `https://<your-backend>.onrender.com/health`
- Deploy frontend on Vercel (`frontend` root) with:
  - `VITE_API_URL=https://<your-backend>.onrender.com`
- Update Render backend:
  - set `FRONTEND_URL=https://<your-frontend>.vercel.app`
  - redeploy backend

## Next step (start here next time)

1. Check Render backend logs and `/health`.
2. Deploy frontend to Vercel and set `VITE_API_URL`.
3. Update `FRONTEND_URL` in Render and redeploy.
4. Run end-to-end smoke test (chat + admin endpoints).

## Important links

- Backend URL: `TBD`
- Frontend URL: `TBD`
- Render Postgres: `TBD`
- Render Backend Service: `TBD`
- Vercel Project: `TBD`

## Session update template

Copy/paste this after each working session:

```md
## Session YYYY-MM-DD HH:MM
- Done:
  - ...
- Blocker:
  - ...
- Next:
  - ...
- Links updated:
  - ...
```
