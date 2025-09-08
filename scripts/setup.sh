#!/bin/bash

# Install dependencies
npm install @prisma/client bcryptjs jsonwebtoken nodemailer
npm install -D prisma @types/bcryptjs @types/jsonwebtoken @types/nodemailer

# Initialize Prisma
npx prisma generate
npx prisma db push

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
  echo "Creating .env file..."
  cat > .env << EOL
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/vvv_frontpage"

# JWT
JWT_SECRET="your-secret-key"

# SMTP
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-smtp-user"
SMTP_PASS="your-smtp-password"
SMTP_FROM="noreply@example.com"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
EOL
  echo "Please update the .env file with your actual configuration values."
fi

echo "Setup complete!" 