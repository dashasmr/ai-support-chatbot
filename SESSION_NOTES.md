# Session Notes

Use this file as a quick memory between chats.

## Current status

- Date: 2026-05-05
- Project: `ai-support-chatbot`
- Main goal: deployed app is live; finalize portfolio-ready state.

## What is done

- Render PostgreSQL was created.
- Render backend service was created.
- Vercel frontend was deployed.
- Backend `/health` endpoint responds successfully on Render.
- Deployment flow was documented in `README.md` (Vercel + Render).
- Root cause of runtime error was fixed in deployment config:
  - `VITE_API_URL` on Vercel incorrectly pointed to `localhost`
  - updated to Render backend URL and redeployed frontend
- Basic anti-abuse protection added on backend chat routes:
  - per-IP rate limiting for `/api/chat` and `/api/chat/stream`
  - configurable via `CHAT_RATE_LIMIT_WINDOW_MS` and `CHAT_RATE_LIMIT_MAX_REQUESTS`

## Current blocker / open tasks

- No hard blocker right now.
- Optional hardening:
  - verify `FRONTEND_URL` in Render exactly matches production frontend URL
  - add smoke-test checklist to README (optional)

## Next step (start here next time)

1. Run full smoke test (chat stream + admin analytics/history/export).
2. Add real links below and save this file.
3. Commit deployment notes + backend CORS improvements.
4. Tag this as portfolio v1 deployment milestone.

## Important links

- Backend URL: `https://<your-backend>.onrender.com`
- Frontend URL: `https://ai-support-chatbot-brown.vercel.app`
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
