#!/bin/bash

echo "🚀 Deploying Authentication Fixes..."

# 1. Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# 2. Stop all containers
echo "🛑 Stopping all containers..."
docker-compose down

# 3. Remove all containers and networks
echo "🗑️ Removing containers and networks..."
docker-compose rm -f
docker system prune -f

# 4. Remove old images to force rebuild
echo "🗑️ Removing old images..."
docker image rm vvv-frontend:latest vvv-backend:latest || true

# 5. Build fresh images
echo "🏗️ Building fresh images..."
docker build -f frontend.Dockerfile -t vvv-frontend:latest .
docker build -f backend/Dockerfile -t vvv-backend:latest .

# 6. Start services
echo "🚀 Starting services..."
docker-compose up -d

# 7. Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 30

# 8. Check service status
echo "📊 Checking service status..."
docker-compose ps

# 9. Test backend connectivity
echo "🧪 Testing backend connectivity..."
sleep 10
curl -s http://localhost:8001/api/test/ || echo "❌ Backend not responding"

# 10. Test frontend connectivity  
echo "🧪 Testing frontend connectivity..."
curl -s http://localhost:3000/api/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"test","password":"test"}' || echo "❌ Frontend API not responding"

echo "✅ Deployment complete!"
echo ""
echo "🔧 Next steps:"
echo "1. Clear browser localStorage completely"
echo "2. Refresh the page"
echo "3. Log in fresh"
echo "4. Check console for any remaining errors"
