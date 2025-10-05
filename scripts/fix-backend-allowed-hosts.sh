#!/usr/bin/env bash
set -euo pipefail

# Purpose: Update ALLOWED_HOSTS for the Django backend (docker compose) and recreate the django service.
# Usage: ./scripts/fix-backend-allowed-hosts.sh veveve.dk www.veveve.dk

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <host1> [host2 host3 ...]"
  exit 1
fi

EXTRA_HOSTS=$(printf ",%s" "$@" | sed 's/^,//')

# Identify compose working dir from running django container
CONTAINER_NAME=${CONTAINER_NAME:-vvv-invest-django-django-1}
COMPOSE_DIR=$(sudo docker inspect "$CONTAINER_NAME" --format '{{ index .Config.Labels "com.docker.compose.project.working_dir" }}')

if [ -z "$COMPOSE_DIR" ] || [ ! -d "$COMPOSE_DIR" ]; then
  echo "Could not determine compose dir from container labels."
  exit 2
fi

echo "Compose directory: $COMPOSE_DIR"

cd "$COMPOSE_DIR"

# Determine env file used by compose (common patterns: .env or env file via compose)
ENV_FILE=.env
if [ ! -f "$ENV_FILE" ]; then
  # Best-effort search for env file
  CANDIDATE=$(grep -R "ALLOWED_HOSTS" -l . | head -n1 || true)
  if [ -n "$CANDIDATE" ]; then
    ENV_FILE="$CANDIDATE"
  fi
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "No env file found. Create one and set ALLOWED_HOSTS."
  exit 3
fi

echo "Using env file: $ENV_FILE"

# Ensure current ALLOWED_HOSTS exists, then append extra hosts (idempotent)
if grep -q '^ALLOWED_HOSTS=' "$ENV_FILE"; then
  CUR=$(grep '^ALLOWED_HOSTS=' "$ENV_FILE" | sed 's/^ALLOWED_HOSTS=//')
  # Merge and de-duplicate
  COMBINED=$(printf "%s,%s" "$CUR" "$EXTRA_HOSTS" | tr ',' '\n' | awk 'NF{print tolower($0)}' | awk '!x[$0]++' | paste -sd "," -)
  sed -i "s|^ALLOWED_HOSTS=.*|ALLOWED_HOSTS=$COMBINED|" "$ENV_FILE"
else
  echo "ALLOWED_HOSTS=localhost,127.0.0.1,$EXTRA_HOSTS" >> "$ENV_FILE"
fi

echo "Updated ALLOWED_HOSTS: $(grep '^ALLOWED_HOSTS=' "$ENV_FILE" | cut -d= -f2-)"

# Recreate django service with docker-compose (preferred) or docker compose
if command -v docker-compose >/dev/null 2>&1; then
  docker-compose up -d --force-recreate django
elif docker --help 2>/dev/null | grep -q " compose "; then
  docker compose up -d --force-recreate django
else
  echo "Neither docker-compose nor docker compose found. Please install one of them."
  exit 4
fi

# Verify
sudo docker exec -it "$CONTAINER_NAME" printenv | egrep 'ALLOWED_HOSTS'
echo "Done. Test the login endpoint now."


