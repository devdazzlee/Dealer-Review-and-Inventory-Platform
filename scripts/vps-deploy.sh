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
  PREV_SHA="$(git rev-parse HEAD 2>/dev/null || echo none)"
  git fetch --prune origin "$BRANCH"
  git checkout -f -B "$BRANCH" "origin/$BRANCH"
  git reset --hard "origin/$BRANCH"
  git clean -fd
  [[ -f "$SECRETS_DIR/backend.env" ]] && cp -a "$SECRETS_DIR/backend.env" backend/.env
  [[ -f "$SECRETS_DIR/frontend.env.local" ]] && cp -a "$SECRETS_DIR/frontend.env.local" frontend/.env.local
  chmod +x scripts/vps-deploy.sh
  export ASR_DEPLOY_PHASE=build
  export ASR_PREV_SHA="$PREV_SHA"
  exec bash "$APP_DIR/scripts/vps-deploy.sh"
fi

NEW_SHA="$(git rev-parse HEAD)"
PREV_SHA="${ASR_PREV_SHA:-none}"
echo "==> Build phase $PREV_SHA -> $NEW_SHA"

if [[ ! -f backend/.env ]]; then
  echo "ERROR: backend/.env missing"
  exit 1
fi
if [[ ! -f frontend/.env.local ]]; then
  echo "ERROR: frontend/.env.local missing"
  exit 1
fi

changed="ALL"
if [[ "$PREV_SHA" != "none" && "$PREV_SHA" != "$NEW_SHA" ]]; then
  changed="$(git diff --name-only "$PREV_SHA" "$NEW_SHA" || echo ALL)"
elif [[ "$PREV_SHA" == "$NEW_SHA" ]]; then
  changed=""
fi

need_backend=0
need_frontend=0
if [[ -z "$changed" ]]; then
  echo "==> No code changes; reloading PM2 only"
elif [[ "$changed" == "ALL" ]]; then
  need_backend=1
  need_frontend=1
else
  echo "$changed" | grep -qE '^backend/' && need_backend=1 || true
  echo "$changed" | grep -qE '^frontend/' && need_frontend=1 || true
  echo "$changed" | grep -qE '^(ecosystem\.config\.cjs|scripts/vps-deploy\.sh)$' && {
    need_backend=1
    need_frontend=1
  } || true
fi

if [[ "$need_backend" -eq 1 ]]; then
  echo "==> Building backend"
  cd "$APP_DIR/backend"
  npm install --no-fund --no-audit
  npx prisma generate
  echo "==> Skipping prisma migrate deploy (use direct DB URL offline if schema changes)"
  npm run build
else
  echo "==> Skipping backend build (no backend changes)"
fi

if [[ "$need_frontend" -eq 1 ]]; then
  echo "==> Building frontend"
  cd "$APP_DIR/frontend"
  npm install --no-fund --no-audit
  npm run build
else
  echo "==> Skipping frontend build (no frontend changes)"
fi

echo "==> Reloading PM2 (asr only)"
cd "$APP_DIR"
pm2 startOrReload ecosystem.config.cjs --update-env
pm2 save
pm2 describe gbp-backend >/dev/null 2>&1 && echo "gbp-backend still present" || true

echo "==> Health checks"
curl -fsS -o /dev/null "http://127.0.0.1:4100/api/dealers?limit=1"
curl -fsS -o /dev/null "http://127.0.0.1:3000/"

echo "==> ASR deploy finished $(date -u +%Y-%m-%dT%H:%M:%SZ) @ $(git rev-parse --short HEAD)"
