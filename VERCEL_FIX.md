# Fix: DIRECT_URL Environment Variable Error

## The Problem
Vercel deployment is failing because `DIRECT_URL` environment variable is missing.

## Quick Fix (2 minutes)

### Step 1: Go to Your Vercel Project
1. Open [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your **API project** (the one that's failing)

### Step 2: Add Environment Variables
1. Go to **Settings** → **Environment Variables**
2. You need to add **TWO** variables:

   **Variable 1: DATABASE_URL**
   - **Name**: `DATABASE_URL`
   - **Value**: Your PostgreSQL connection string (pooled)
   - **Environment**: ✅ Production, ✅ Preview, ✅ Development
   - Click **Save**

   **Variable 2: DIRECT_URL** (This is the missing one!)
   - **Name**: `DIRECT_URL`
   - **Value**: Your PostgreSQL direct connection string
   - **Environment**: ✅ Production, ✅ Preview, ✅ Development
   - Click **Save**

### Step 3: Where to Get These Values?

#### If using Vercel Postgres:
1. Go to **Storage** → Your database
2. You'll see:
   - `POSTGRES_URL` → This is your `DATABASE_URL`
   - `POSTGRES_PRISMA_URL` → This is your `DIRECT_URL`

#### If using Neon:
- Use the same connection string for both `DATABASE_URL` and `DIRECT_URL`
- Format: `postgresql://user:password@host/database?sslmode=require`

#### If using Supabase:
- Go to **Settings** → **Database** → **Connection string**
- Use the **URI** format for both

### Step 4: Redeploy
1. Go to **Deployments** tab
2. Click the **...** (three dots) on the latest deployment
3. Click **Redeploy**
4. Wait for it to complete

## Alternative: Make DIRECT_URL Optional (Quick Fix)

If you want to deploy quickly without setting DIRECT_URL, you can temporarily make it optional:

**Edit `api/prisma/schema.prisma`:**
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")  // Remove this line temporarily
}
```

Then change to:
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  // directUrl = env("DIRECT_URL")  // Commented out
}
```

**But this is NOT recommended** - migrations might fail. Better to set the environment variable properly.

## Verify It Works

After redeploying, check:
1. Go to **Deployments** → Latest deployment
2. Should show ✅ "Ready" status
3. Visit: `https://your-api-url.vercel.app/health`
4. Should return: `{"status":"healthy","timestamp":"..."}`

## Still Having Issues?

1. **Check variable names**: Make sure they're exactly:
   - `DATABASE_URL` (not `DATABASE_URLS` or `DB_URL`)
   - `DIRECT_URL` (not `DIRECTURL` or `DIRECT_URLS`)

2. **Check environments**: Make sure you checked all three:
   - ✅ Production
   - ✅ Preview  
   - ✅ Development

3. **Check connection strings**: Make sure they're valid PostgreSQL URLs starting with `postgresql://`

4. **Redeploy**: After adding variables, you MUST redeploy for them to take effect

