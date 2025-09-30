#!/bin/bash

# Fix production issues script
set -e

echo "🔧 Fixing production issues..."

# 1. Fix nginx proxy cache permissions
echo "📁 Fixing nginx proxy cache permissions..."
sudo mkdir -p /var/lib/nginx/proxy
sudo chown -R www-data:www-data /var/lib/nginx/proxy
sudo chmod -R 755 /var/lib/nginx/proxy

# 2. Fix backend environment file
echo "⚙️ Fixing backend environment configuration..."
if [ ! -f "env/backend.env" ]; then
    echo "❌ Backend environment file not found!"
    exit 1
fi

# Update ALLOWED_HOSTS to include veveve.dk
sed -i 's/ALLOWED_HOSTS=.*/ALLOWED_HOSTS=veveve.dk,www.veveve.dk,localhost,127.0.0.1/' env/backend.env

# 3. Restart services
echo "🔄 Restarting services..."
docker-compose down
docker-compose up -d

# 4. Wait for services
echo "⏳ Waiting for services to start..."
sleep 10

# 5. Test database connection
echo "🗄️ Testing database connection..."
if docker-compose exec backend python manage.py shell -c "from django.db import connection; connection.ensure_connection(); print('DB OK')" 2>/dev/null; then
    echo "✅ Database connection successful"
else
    echo "❌ Database connection failed - checking credentials..."
    echo "Current DB config:"
    grep -E "(DB_USER|DB_PASSWORD|DB_NAME)" env/backend.env
fi

# 6. Test nginx
echo "🌐 Testing nginx..."
sudo nginx -t && sudo systemctl reload nginx

echo "✅ Production fixes completed!"
echo "🌐 Your site should now be available at https://veveve.dk"
