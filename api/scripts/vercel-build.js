#!/usr/bin/env node
// Vercel build script with connection string validation

const { execSync } = require('child_process');

// Validate DATABASE_URL format
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Trim whitespace and remove quotes if present
const cleanDbUrl = dbUrl.trim().replace(/^["']|["']$/g, '');

// Check if it's a valid PostgreSQL URL
if (!cleanDbUrl.startsWith('postgresql://') && !cleanDbUrl.startsWith('postgres://')) {
  console.error('❌ DATABASE_URL must start with postgresql:// or postgres://');
  console.error('Current value (first 50 chars):', cleanDbUrl.substring(0, 50));
  process.exit(1);
}

// Set cleaned URL back to environment
process.env.DATABASE_URL = cleanDbUrl;

console.log('✅ DATABASE_URL is set and valid');
console.log('📝 Connection string format:', cleanDbUrl.substring(0, 30) + '...');

try {
  console.log('🔨 Generating Prisma Client...');
  execSync('npx prisma generate', { stdio: 'inherit', env: process.env });

  console.log('📦 Running database migrations...');
  try {
    execSync('npx prisma migrate deploy', { stdio: 'inherit', env: process.env });
  } catch (error) {
    console.log('⚠️  Migrations failed, trying db push...');
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit', env: process.env });
  }

  console.log('🔧 Compiling TypeScript...');
  execSync('npx tsc', { stdio: 'inherit', env: process.env });

  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
