#!/usr/bin/env bash
# AutoSalesReviews VPS deploy — updates only /var/www/autosalesreviews.
# Does not touch gbp-backend, Peakwa, Docker, or other nginx sites.
#
# ASR_DEPLOY_TARGET=frontend|backend|all  (default: all)
set -euo pipefail

APP_DIR="/var/www/autosalesreviews"
BRANCH="${DEPLOY_BRANCH:-main}"
LOCK_FILE="/tmp/asr-deploy.lock"
SECRETS_DIR="/var/www/autosalesreviews-secrets"
TARGET="${ASR_DEPLOY_TARGET:-all}"

case "$TARGET" in
  frontend|backend|all) ;;
  *)
    echo "ERROR: ASR_DEPLOY_TARGET must be frontend|backend|all (got: $TARGET)"
    exit 1
    ;;
esac

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
    echo "Another ASR deploy is in progress; waiting for lock..."
    flock 9
  fi
  echo "==> ASR deploy started $(date -u +%Y-%m-%dT%H:%M:%SZ) target=$TARGET"
  echo "==> Syncing origin/$BRANCH"
  git fetch --prune origin "$BRANCH"
  git checkout -f -B "$BRANCH" "origin/$BRANCH"
  git reset --hard "origin/$BRANCH"
  git clean -fd
  [[ -f "$SECRETS_DIR/backend.env" ]] && cp -a "$SECRETS_DIR/backend.env" backend/.env
  [[ -f "$SECRETS_DIR/frontend.env.local" ]] && cp -a "$SECRETS_DIR/frontend.env.local" frontend/.env.local
  chmod +x scripts/vps-deploy.sh
  export ASR_DEPLOY_PHASE=build
  export ASR_DEPLOY_TARGET="$TARGET"
  exec bash "$APP_DIR/scripts/vps-deploy.sh"
fi

echo "==> Build phase @ $(git rev-parse --short HEAD) target=$TARGET"

if [[ ! -f backend/.env ]]; then
  echo "ERROR: backend/.env missing"
  exit 1
fi
if [[ ! -f frontend/.env.local ]]; then
  echo "ERROR: frontend/.env.local missing"
  exit 1
fi

need_backend=0
need_frontend=0
case "$TARGET" in
  backend) need_backend=1 ;;
  frontend) need_frontend=1 ;;
  all)
    need_backend=1
    need_frontend=1
    ;;
esac

reload_app() {
  local name="$1"
  if pm2 describe "$name" >/dev/null 2>&1; then
    pm2 restart "$name" --update-env
  else
    pm2 start "$APP_DIR/ecosystem.config.cjs" --only "$name"
  fi
}

wait_http() {
  local url="$1"
  local label="$2"
  local i
  for i in $(seq 1 30); do
    if curl -fsS -o /dev/null "$url"; then
      echo "==> $label healthy"
      return 0
    fi
    sleep 2
  done
  echo "ERROR: $label failed health check: $url"
  return 1
}

if [[ "$need_backend" -eq 1 ]]; then
  echo "==> Building backend"
  cd "$APP_DIR/backend"
  npm install --no-fund --no-audit
  npx prisma generate
  echo "==> Skipping prisma migrate deploy (use direct DB URL offline if schema changes)"
  npm run build
  echo "==> Reloading asr-backend"
  cd "$APP_DIR"
  reload_app asr-backend
  wait_http "http://127.0.0.1:4100/api/dealers?limit=1" "Backend"
fi

if [[ "$need_frontend" -eq 1 ]]; then
  echo "==> Building frontend"
  cd "$APP_DIR/frontend"
  npm install --no-fund --no-audit
  npm run build
  echo "==> Reloading asr-frontend"
  cd "$APP_DIR"
  reload_app asr-frontend
  wait_http "http://127.0.0.1:3000/" "Frontend"
fi

pm2 save
pm2 describe gbp-backend >/dev/null 2>&1 && echo "gbp-backend still present" || true

echo "==> ASR deploy finished $(date -u +%Y-%m-%dT%H:%M:%SZ) @ $(git rev-parse --short HEAD) target=$TARGET"
