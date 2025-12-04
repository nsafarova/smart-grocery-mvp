#!/bin/sh
# Vercel build script that handles optional DIRECT_URL

# Generate Prisma client
npx prisma generate

# Set DIRECT_URL to DATABASE_URL if not provided
if [ -z "$DIRECT_URL" ]; then
  export DIRECT_URL="$DATABASE_URL"
fi

# Try to run migrations, fallback to db push if migrations don't exist
npx prisma migrate deploy || npx prisma db push --accept-data-loss

# Build TypeScript
npx tsc

