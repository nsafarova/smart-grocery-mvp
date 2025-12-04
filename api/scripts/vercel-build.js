#!/usr/bin/env node
// Vercel build script that handles optional DIRECT_URL

const { execSync } = require('child_process');

// Set DIRECT_URL to DATABASE_URL if not provided
if (!process.env.DIRECT_URL && process.env.DATABASE_URL) {
  process.env.DIRECT_URL = process.env.DATABASE_URL;
}

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

