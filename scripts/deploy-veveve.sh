#!/usr/bin/env bash
set -euo pipefail

# Deploy vvv-frontpage with standardized Nginx and Docker Compose

require() {
  command -v "$1" >/dev/null 2>&1 || { echo "Missing dependency: $1"; exit 1; }
}

require sudo
require docker

if command -v docker-compose >/dev/null 2>&1; then
  DC="docker-compose"
elif docker compose version >/dev/null 2>&1; then
  DC="docker compose"
else
  echo "docker-compose or docker compose is required"; exit 1
fi

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
NGINX_CONF_SRC="$ROOT_DIR/deploy/veveve.dk.conf"
NGINX_CONF_DST="/etc/nginx/sites-available/veveve.dk"

echo "[1/6] Installing Nginx config for veveve.dk"
sudo cp "$NGINX_CONF_SRC" "$NGINX_CONF_DST"
sudo ln -sf "$NGINX_CONF_DST" /etc/nginx/sites-enabled/veveve.dk
sudo nginx -t
sudo systemctl reload nginx

echo "[2/6] Pull latest git"
git -C "$ROOT_DIR" pull --rebase

echo "[3/6] Build and start docker services"
cd "$ROOT_DIR"
$DC up -d --build backend worker beat frontend

echo "[4/6] Run migrations"
$DC exec -T backend python manage.py migrate --noinput || true

echo "[5/6] Post-deploy checks"
set +e
curl -sk --max-time 5 https://veveve.dk/api/test | head -n 1
curl -skI --max-time 5 https://veveve.dk/admin/ | head -n 5
set -e

echo "[6/6] Done"

