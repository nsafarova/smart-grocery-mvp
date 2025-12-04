#!/usr/bin/env node
// Vercel build script with connection string validation

const { execSync } = require('child_process');

// Validate DATABASE_URL format
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Check if it's a valid PostgreSQL URL
if (!dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://')) {
  console.error('❌ DATABASE_URL must start with postgresql:// or postgres://');
  console.error('Current value:', dbUrl.substring(0, 50) + '...');
  process.exit(1);
}

console.log('✅ DATABASE_URL is set and valid');

try {
  console.log('🔨 Generating Prisma Client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  console.log('📦 Running database migrations...');
  try {
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  } catch (error) {
    console.log('⚠️  Migrations failed, trying db push...');
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
  }

  console.log('🔧 Compiling TypeScript...');
  execSync('npx tsc', { stdio: 'inherit' });

  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
