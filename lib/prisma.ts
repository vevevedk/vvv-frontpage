import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

// Construct DATABASE_URL from environment variables
const DATABASE_URL = `postgresql://${process.env.DB_USER}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

export const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Test the connection
prisma.$connect()
  .then(() => {
    console.log('Successfully connected to database');
    console.log('Using connection string:', DATABASE_URL);
  })
  .catch((error) => {
    console.error('Failed to connect to database:', error);
    console.error('Attempted connection string:', DATABASE_URL);
  });

export default prisma; 