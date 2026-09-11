# Deployment Guide — AutoSalesReviews (VPS)

This project deploys to a Hostinger VPS via **GitHub Actions** (self-hosted runner on the VPS).  
You normally deploy by **pushing to `main`**. You do **not** need to SSH for everyday updates.

---

## Live URLs

| App | URL |
|-----|-----|
| Frontend | https://autosalesreviews.com |
| Frontend (www) | https://www.autosalesreviews.com |
| Backend API | https://backend-apis-dev.cloud |
| Backend health | https://backend-apis-dev.cloud/health |
| Temp frontend (bypass DNS) | http://asr.187.77.19.146.sslip.io |
| Temp API (bypass DNS) | http://asr-api.187.77.19.146.sslip.io |

VPS app path: `/var/www/autosalesreviews`  
PM2 apps: `asr-frontend` (port **3000**), `asr-backend` (port **4100**)

> Other apps on the same VPS (`gbp-backend`, Peakwa, Docker, etc.) are **not** touched by ASR deploys.

---

## When to deploy

| You changed… | What deploys | How |
|--------------|--------------|-----|
| Files under `frontend/**` only | Frontend only | Push to `main` |
| Files under `backend/**` or `ecosystem.config.cjs` | Backend only | Push to `main` |
| Both frontend + backend | Both (two workflows) | Push to `main` |
| Docs / README / unrelated files only | Nothing | No deploy |
| Need both rebuilt on demand | Frontend + backend | Manual “Deploy All” in GitHub Actions |

### Examples

**Example A — UI fix only**

```bash
# changed: frontend/src/components/layout/Navbar.tsx
git add frontend/src/components/layout/Navbar.tsx
git commit -m "Fix navbar mobile menu"
git push origin main
```

→ Triggers **Deploy Frontend to VPS** only.

**Example B — API / inventory job change**

```bash
# changed: backend/src/services/inventory-sync.service.ts
git add backend/src/services/inventory-sync.service.ts
git commit -m "Fix Bergen inventory sync job tag"
git push origin main
```

→ Triggers **Deploy Backend to VPS** only.

**Example C — Full stack change**

```bash
# changed frontend API client + backend route
git add frontend/src/lib/api/vehicles.ts backend/src/routes/jobs.routes.ts
git commit -m "Send internal key for dealer inventory API"
git push origin main
```

→ Triggers **both** frontend and backend workflows.

**Example D — Nothing to deploy**

```bash
git add DEPLOYMENT.md
git commit -m "Document VPS deploy process"
git push origin main
```

→ No frontend/backend deploy (paths don’t match).

---

## How automatic deploy works

```text
You push to main
    → GitHub Actions (self-hosted runner on VPS, label: asr-vps)
        → /usr/local/bin/asr-vps-deploy
            → scripts/vps-deploy.sh
                → git pull main
                → npm install + build (FE and/or BE)
                → pm2 restart asr-frontend / asr-backend
                → health checks
```

Workflows:

| Workflow file | Trigger | Target |
|---------------|---------|--------|
| `.github/workflows/deploy-frontend.yml` | Push to `main` with `frontend/**` changes, or manual | `ASR_DEPLOY_TARGET=frontend` |
| `.github/workflows/deploy-backend.yml` | Push to `main` with `backend/**` changes, or manual | `ASR_DEPLOY_TARGET=backend` |
| `.github/workflows/deploy-all.yml` | **Manual only** | `ASR_DEPLOY_TARGET=all` |

---

## Step-by-step: normal deploy (recommended)

1. Commit only the files you intend to ship (don’t commit `.env`, secrets, or `node_modules`).
2. Push to `main`:

```bash
git status
git add <files>
git commit -m "Describe why this change ships"
git push origin main
```

3. Open GitHub → **Actions** and watch:
   - **Deploy Frontend to VPS** and/or
   - **Deploy Backend to VPS**
4. Wait until green (frontend can take a while on a 1‑core VPS).
5. Smoke-test:

```bash
curl -sS https://backend-apis-dev.cloud/health
curl -sS -o /dev/null -w "%{http_code}\n" https://www.autosalesreviews.com/
```

Or open https://www.autosalesreviews.com/dealers/bergen-car and confirm inventory loads.

---

## Manual deploy from GitHub (no code change)

Use when the last push didn’t redeploy, or you need a clean rebuild.

1. GitHub → **Actions**
2. Choose:
   - **Deploy Frontend to VPS** → Run workflow  
   - **Deploy Backend to VPS** → Run workflow  
   - **Deploy All to VPS** → Run workflow (both)
3. Branch: `main` → **Run workflow**

---

## Manual deploy on the VPS (emergency only)

SSH to the VPS, then:

```bash
# Frontend only
ASR_DEPLOY_TARGET=frontend /usr/local/bin/asr-vps-deploy

# Backend only
ASR_DEPLOY_TARGET=backend /usr/local/bin/asr-vps-deploy

# Both
ASR_DEPLOY_TARGET=all /usr/local/bin/asr-vps-deploy
```

Or directly:

```bash
cd /var/www/autosalesreviews
ASR_DEPLOY_TARGET=frontend bash scripts/vps-deploy.sh
```

Check processes:

```bash
pm2 list
pm2 logs asr-frontend --lines 50
pm2 logs asr-backend --lines 50
```

---

## Environment variables (do not commit)

Secrets live **only on the VPS**, not in git.

| File on VPS | Purpose |
|-------------|---------|
| `/var/www/autosalesreviews/backend/.env` | DB, API keys, Cloudinary, cron, CORS, `SITE_URL` |
| `/var/www/autosalesreviews/frontend/.env.local` | `NEXT_PUBLIC_*`, `INTERNAL_API_KEY`, `API_INTERNAL_URL` |
| Backup copies | `/var/www/autosalesreviews-secrets/` |

Important production values (examples):

```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=https://backend-apis-dev.cloud
NEXT_PUBLIC_SITE_URL=https://autosalesreviews.com
API_INTERNAL_URL=http://127.0.0.1:4100
INTERNAL_API_KEY=<same as backend>

# backend/.env
SITE_URL=https://autosalesreviews.com
CORS_ORIGIN=https://autosalesreviews.com,https://www.autosalesreviews.com
PORT=4100
```

After changing `NEXT_PUBLIC_*`, you **must rebuild/redeploy the frontend** (those values are baked in at build time).

---

## Database / Prisma schema changes

`scripts/vps-deploy.sh` runs `prisma generate` but **skips** `prisma migrate deploy` by default.

If you change `backend/prisma/schema.prisma`:

1. Create/commit a migration locally (or use your team’s migrate process).
2. Apply it on the VPS DB carefully (direct DB URL, not through a broken pooler lock if applicable).
3. Then deploy backend as usual.

Do **not** run destructive DB commands on production without a backup.

---

## What gets built on deploy

### Backend (`ASR_DEPLOY_TARGET=backend`)

1. `npm install`
2. `npx prisma generate`
3. `npm run build`
4. `pm2 restart asr-backend --update-env`
5. Health check: `http://127.0.0.1:4100/api/dealers?limit=1`

### Frontend (`ASR_DEPLOY_TARGET=frontend`)

1. `npm install`
2. `npm run build` (Next.js production build — can be slow on 1 CPU)
3. `pm2 restart asr-frontend --update-env`
4. Health check: `http://127.0.0.1:3000/`

---

## Checklist before you push

- [ ] Changes work on local (`yarn dev` / backend `npm run dev`)
- [ ] No `.env` / secrets / `node_modules` / `.next` in the commit
- [ ] Commit message explains **why**
- [ ] Pushing to **`main`** (only `main` auto-deploys)
- [ ] After Actions turn green, smoke-test FE + API URLs

---

## Troubleshooting

| Symptom | Likely cause | What to do |
|---------|--------------|------------|
| Actions didn’t run | Path filters (only `frontend/**` or `backend/**`) | Confirm changed paths, or run workflow manually |
| Site shows Vercel `DEPLOYMENT_NOT_FOUND` | Local/ISP DNS still pointing at old Vercel IP | Use `1.1.1.1` / `8.8.8.8`, or temp sslip URL; flush DNS |
| Frontend 502 | `asr-frontend` stopped or mid-build | `pm2 list`; wait for Actions; check `pm2 logs asr-frontend` |
| Empty dealer inventory | Missing `INTERNAL_API_KEY` / `API_INTERNAL_URL` on FE | Fix VPS `frontend/.env.local`, redeploy frontend |
| Deploy stuck / high CPU | Two builds at once on 1-core VPS | Wait; workflows use locks — avoid overlapping manual + push deploys |
| Backend up, FE old API URL | Changed `NEXT_PUBLIC_*` but didn’t rebuild FE | Redeploy frontend |

Quick health commands:

```bash
curl -sS https://backend-apis-dev.cloud/health
curl -sS -o /dev/null -w "%{http_code}\n" https://www.autosalesreviews.com/
curl -sS -o /dev/null -w "%{http_code}\n" http://asr.187.77.19.146.sslip.io/
pm2 list | grep asr
```

---

## Images / media note

Vehicle and upload images use **Cloudinary**, not VPS disk.  
Deploying code does **not** move images. Keep `CLOUDINARY_URL` set on the backend VPS `.env`.

---

## Summary

1. **Develop locally** → commit → **`git push origin main`**
2. GitHub Actions deploys the right app(s) on the VPS
3. Confirm Actions are green, then open the live URLs
4. Use **Deploy All** or SSH `/usr/local/bin/asr-vps-deploy` only when needed
