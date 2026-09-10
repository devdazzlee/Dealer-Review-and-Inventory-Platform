#!/usr/bin/env bash
# AutoSalesReviews VPS deploy — updates only /var/www/autosalesreviews.
# Does not touch gbp-backend, Peakwa, Docker, or other nginx sites.
set -euo pipefail

APP_DIR="/var/www/autosalesreviews"
BRANCH="${DEPLOY_BRANCH:-main}"
LOCK_FILE="/tmp/asr-deploy.lock"

exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  echo "Another ASR deploy is already running; exiting."
  exit 0
fi

echo "==> ASR deploy started $(date -u +%Y-%m-%dT%H:%M:%SZ)"
cd "$APP_DIR"

if [[ ! -d .git ]]; then
  echo "ERROR: $APP_DIR is not a git checkout"
  exit 1
fi

mkdir -p /var/www/autosalesreviews-secrets
if [[ -f backend/.env ]]; then
  cp -a backend/.env /var/www/autosalesreviews-secrets/backend.env
fi
if [[ -f frontend/.env.local ]]; then
  cp -a frontend/.env.local /var/www/autosalesreviews-secrets/frontend.env.local
fi

echo "==> Fetching origin/$BRANCH"
git fetch --prune origin "$BRANCH"

# Remove untracked bootstrap files that would block checkout; keep ignored .env files
git clean -fd
git checkout -B "$BRANCH" "origin/$BRANCH"
git reset --hard "origin/$BRANCH"

if [[ ! -f backend/.env && -f /var/www/autosalesreviews-secrets/backend.env ]]; then
  cp -a /var/www/autosalesreviews-secrets/backend.env backend/.env
fi
if [[ ! -f frontend/.env.local && -f /var/www/autosalesreviews-secrets/frontend.env.local ]]; then
  cp -a /var/www/autosalesreviews-secrets/frontend.env.local frontend/.env.local
fi

if [[ ! -f backend/.env ]]; then
  echo "ERROR: backend/.env missing"
  exit 1
fi
if [[ ! -f frontend/.env.local ]]; then
  echo "ERROR: frontend/.env.local missing"
  exit 1
fi

echo "==> Building backend"
cd "$APP_DIR/backend"
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build

echo "==> Building frontend"
cd "$APP_DIR/frontend"
npm ci
npm run build

echo "==> Reloading PM2 (asr only)"
cd "$APP_DIR"
pm2 startOrReload ecosystem.config.cjs --update-env
pm2 save

pm2 describe gbp-backend >/dev/null 2>&1 && echo "gbp-backend still present" || true

echo "==> Health checks"
curl -fsS -o /dev/null "http://127.0.0.1:4100/api/dealers?limit=1"
curl -fsS -o /dev/null "http://127.0.0.1:3000/"

echo "==> ASR deploy finished $(date -u +%Y-%m-%dT%H:%M:%SZ) @ $(git rev-parse --short HEAD)"
