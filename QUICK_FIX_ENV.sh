#!/bin/bash
# Quick fix for truncated SECURE_SSL_REDIRECT value

cd /var/www/vvv-frontpage

# Fix the truncated value using sed
sed -i 's/SECURE_SSL_REDIRECT=Fals/SECURE_SSL_REDIRECT=False/' env/backend.env

# Verify the fix
echo "Verifying fix:"
grep SECURE_SSL_REDIRECT env/backend.env

echo ""
echo "✅ Fixed! Now start containers:"
echo "docker-compose up -d"

