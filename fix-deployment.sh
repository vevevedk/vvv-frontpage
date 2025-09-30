#!/bin/bash

# Fix deployment script for veveve.dk
set -e

echo "🔧 Fixing veveve.dk deployment issues..."

# Stop existing containers
echo "📦 Stopping existing containers..."
docker-compose down || true

# Remove old images to force rebuild
echo "🗑️ Removing old images..."
docker image rm vvv-frontend:latest vvv-backend:latest || true

# Build new images
echo "🏗️ Building new images..."
docker-compose build --no-cache

# Start services
echo "🚀 Starting services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service health
echo "🏥 Checking service health..."
docker-compose ps

# Test frontend
echo "🧪 Testing frontend..."
curl -f http://localhost:3000/health || echo "Frontend health check failed"

# Test backend
echo "🧪 Testing backend..."
curl -f http://localhost:8001/admin/ || echo "Backend health check failed"

# Reload nginx if it exists
echo "🔄 Reloading nginx..."
sudo nginx -t && sudo systemctl reload nginx || echo "Nginx reload failed"

echo "✅ Deployment fix completed!"
echo "🌐 Your site should now be available at https://veveve.dk"