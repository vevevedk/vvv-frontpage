#!/usr/bin/env bash
set -euo pipefail

# Purpose: Update backend configuration for veveve.io
# This script updates ALLOWED_HOSTS, CORS, and CSRF settings in backend.env
# Usage: Run on the server after DNS is configured

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_ENV="${PROJECT_DIR}/env/backend.env"

if [ ! -f "$BACKEND_ENV" ]; then
  echo "Error: backend.env not found at $BACKEND_ENV"
  exit 1
fi

echo "Updating backend configuration for veveve.io..."

# Backup the file
cp "$BACKEND_ENV" "${BACKEND_ENV}.backup.$(date +%Y%m%d_%H%M%S)"

# Update ALLOWED_HOSTS
if grep -q '^ALLOWED_HOSTS=' "$BACKEND_ENV"; then
  # Check if veveve.io is already in ALLOWED_HOSTS
  if grep -q 'veveve.io' "$BACKEND_ENV"; then
    echo "✓ veveve.io already in ALLOWED_HOSTS"
  else
    # Add veveve.io and www.veveve.io to ALLOWED_HOSTS
    sed -i 's/^ALLOWED_HOSTS=\(.*\)/ALLOWED_HOSTS=\1,veveve.io,www.veveve.io/' "$BACKEND_ENV"
    echo "✓ Added veveve.io and www.veveve.io to ALLOWED_HOSTS"
  fi
else
  echo "Error: ALLOWED_HOSTS not found in backend.env"
  exit 1
fi

# Update CORS_ALLOWED_ORIGINS
if grep -q '^CORS_ALLOWED_ORIGINS=' "$BACKEND_ENV"; then
  if grep -q 'https://veveve.io' "$BACKEND_ENV"; then
    echo "✓ veveve.io already in CORS_ALLOWED_ORIGINS"
  else
    sed -i 's|^CORS_ALLOWED_ORIGINS=\(.*\)|CORS_ALLOWED_ORIGINS=\1,https://veveve.io,https://www.veveve.io|' "$BACKEND_ENV"
    echo "✓ Added veveve.io to CORS_ALLOWED_ORIGINS"
  fi
else
  echo "Warning: CORS_ALLOWED_ORIGINS not found, adding it"
  echo "CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,https://veveve.dk,https://www.veveve.dk,https://veveve.io,https://www.veveve.io" >> "$BACKEND_ENV"
fi

# Update CSRF_TRUSTED_ORIGINS
if grep -q '^CSRF_TRUSTED_ORIGINS=' "$BACKEND_ENV"; then
  if grep -q 'https://veveve.io' "$BACKEND_ENV"; then
    echo "✓ veveve.io already in CSRF_TRUSTED_ORIGINS"
  else
    sed -i 's|^CSRF_TRUSTED_ORIGINS=\(.*\)|CSRF_TRUSTED_ORIGINS=\1,https://veveve.io,https://www.veveve.io|' "$BACKEND_ENV"
    echo "✓ Added veveve.io to CSRF_TRUSTED_ORIGINS"
  fi
else
  echo "Warning: CSRF_TRUSTED_ORIGINS not found, adding it"
  echo "CSRF_TRUSTED_ORIGINS=https://veveve.dk,https://www.veveve.dk,https://veveve.io,https://www.veveve.io" >> "$BACKEND_ENV"
fi

echo ""
echo "Updated backend.env:"
echo "---"
grep -E '^(ALLOWED_HOSTS|CORS_ALLOWED_ORIGINS|CSRF_TRUSTED_ORIGINS)=' "$BACKEND_ENV"
echo "---"
echo ""
echo "Next steps:"
echo "1. Restart the Django backend container:"
echo "   docker-compose restart django"
echo "   # or"
echo "   docker compose restart django"
echo ""
echo "2. Verify the changes:"
echo "   docker exec <django-container> printenv | grep -E '(ALLOWED_HOSTS|CORS|CSRF)'"
echo ""
