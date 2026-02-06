#!/bin/bash
# Staging environment startup script
# Run this on the server: bash /var/www/vvv-frontpage-staging/scripts/start-staging.sh

set -e

echo "=== Stopping existing staging containers ==="
docker rm -f staging_postgres staging_redis staging_backend staging_frontend 2>/dev/null || true

echo "=== Creating network ==="
docker network create vvv-frontpage-staging_vvv_network 2>/dev/null || true

echo "=== Starting PostgreSQL ==="
docker run -d \
  --name staging_postgres \
  --network vvv-frontpage-staging_vvv_network \
  --network-alias postgres \
  -e POSTGRES_DB=vvv_database_staging \
  -e POSTGRES_USER=vvv_user \
  -e 'POSTGRES_PASSWORD=Yo6g/LhuoAvQHd24QwhhmiQ5q7TGPc1HfA7Y7RB3gUE=' \
  -v vvv-frontpage-staging_postgres_data_v2:/var/lib/postgresql/data \
  postgres:15

echo "=== Starting Redis ==="
docker run -d \
  --name staging_redis \
  --network vvv-frontpage-staging_vvv_network \
  --network-alias redis \
  redis:7-alpine

echo "=== Waiting for databases to be ready ==="
sleep 5

echo "=== Starting Backend ==="
docker run -d \
  --name staging_backend \
  --network vvv-frontpage-staging_vvv_network \
  -p 8002:8000 \
  --env-file /var/www/vvv-frontpage-staging/env/backend.staging.env \
  ghcr.io/vevevedk/vvv-backend:staging-latest

echo "=== Starting Frontend ==="
docker run -d \
  --name staging_frontend \
  --network vvv-frontpage-staging_vvv_network \
  -p 3002:3000 \
  --env-file /var/www/vvv-frontpage-staging/env/frontend.staging.env \
  ghcr.io/vevevedk/vvv-frontend:staging-latest

echo "=== Waiting for services to start ==="
sleep 10

echo "=== Container Status ==="
docker ps --filter "name=staging"

echo "=== Running migrations ==="
docker exec staging_backend python manage.py migrate --noinput || echo "Migration failed - check backend logs"

echo "=== Done! ==="
echo "Test with:"
echo "  curl -I https://staging.veveve.io"
echo "  curl -I https://staging.veveve.io/api/test/"
