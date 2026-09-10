#!/usr/bin/env bash
# AutoSalesReviews VPS deploy — updates only /var/www/autosalesreviews.
# Does not touch gbp-backend, Peakwa, Docker, or other nginx sites.
set -euo pipefail

APP_DIR="/var/www/autosalesreviews"
BRANCH="${DEPLOY_BRANCH:-main}"
LOCK_FILE="/tmp/asr-deploy.lock"
SECRETS_DIR="/var/www/autosalesreviews-secrets"

cd "$APP_DIR"
if [[ ! -d .git ]]; then
  echo "ERROR: $APP_DIR is not a git checkout"
  exit 1
fi

mkdir -p "$SECRETS_DIR"
[[ -f backend/.env ]] && cp -a backend/.env "$SECRETS_DIR/backend.env"
[[ -f frontend/.env.local ]] && cp -a frontend/.env.local "$SECRETS_DIR/frontend.env.local"

# Phase 1: sync git, then re-exec so we never keep running a script that
# was rewritten mid-flight by git reset --hard.
if [[ "${ASR_DEPLOY_PHASE:-sync}" == "sync" ]]; then
  exec 9>"$LOCK_FILE"
  if ! flock -n 9; then
    echo "Another ASR deploy is already running; exiting."
    exit 0
  fi
  echo "==> ASR deploy started $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "==> Syncing origin/$BRANCH"
  git fetch --prune origin "$BRANCH"
  git checkout -f -B "$BRANCH" "origin/$BRANCH"
  git reset --hard "origin/$BRANCH"
  git clean -fd
  [[ -f "$SECRETS_DIR/backend.env" ]] && cp -a "$SECRETS_DIR/backend.env" backend/.env
  [[ -f "$SECRETS_DIR/frontend.env.local" ]] && cp -a "$SECRETS_DIR/frontend.env.local" frontend/.env.local
  chmod +x scripts/vps-deploy.sh
  export ASR_DEPLOY_PHASE=build
  # Keep lock fd across exec
  exec bash "$APP_DIR/scripts/vps-deploy.sh"
fi

echo "==> Build phase @ $(git rev-parse --short HEAD)"

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
npm install --no-fund --no-audit
npx prisma generate
# Skip migrate deploy on Neon pooler (advisory locks time out). Schema is
# already applied; run migrations manually with a direct DB URL when needed.
echo "==> Skipping prisma migrate deploy (use direct DB URL offline if schema changes)"
npm run build

echo "==> Building frontend"
cd "$APP_DIR/frontend"
npm install --no-fund --no-audit
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
