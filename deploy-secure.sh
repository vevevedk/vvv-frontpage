#!/bin/bash

# Secure deployment script for veveve.dk
set -e

echo "🔐 Deploying with secure credentials..."

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ docker-compose.yml not found. Please run this script from the project root."
    exit 1
fi

# Check if backend.env exists
if [ ! -f "env/backend.env" ]; then
    echo "📋 Creating backend.env from example..."
    cp env/backend.env.example env/backend.env
fi

# Stop existing containers
echo "📦 Stopping existing containers..."
docker-compose down

# Remove old postgres volume to start fresh with new credentials
echo "🗑️ Removing old postgres volume..."
docker volume rm vvv-frontpage_postgres_data 2>/dev/null || true

# Build and start services
echo "🏗️ Building and starting services..."
docker-compose up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 20

# Test database connection
echo "🗄️ Testing database connection..."
if docker-compose exec backend python manage.py shell -c "from django.db import connection; connection.ensure_connection(); print('✅ Database connection successful')" 2>/dev/null; then
    echo "✅ Database connection successful"
    
    # Run migrations
    echo "📊 Running database migrations..."
    docker-compose exec backend python manage.py migrate
    
    echo "✅ Secure deployment completed!"
    echo "🌐 Your site should now be available at https://veveve.dk"
else
    echo "❌ Database connection failed"
    echo "📋 Checking logs..."
    docker-compose logs backend | tail -10
    exit 1
fi
