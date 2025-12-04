# Quick Free Database Setup for MVP (2 Minutes)

You need a database for the app to work, but it's **FREE** and takes 2 minutes to set up!

## Option 1: Vercel Postgres (Easiest - Recommended)

### Step 1: Create Database (1 minute)
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Storage** in the left sidebar
3. Click **Create Database**
4. Select **Postgres**
5. Name it: `smartpantry-db`
6. Choose any region
7. Click **Create**

### Step 2: Copy Connection Strings (30 seconds)
After creating, you'll see two connection strings:
- **POSTGRES_URL** → Copy this (this is your `DATABASE_URL`)
- **POSTGRES_PRISMA_URL** → Copy this (this is your `DIRECT_URL`)

### Step 3: Add to Vercel Project (30 seconds)
1. Go to your **API project** in Vercel
2. **Settings** → **Environment Variables**
3. Add:
   - **Name**: `DATABASE_URL` → **Value**: Paste POSTGRES_URL
   - **Name**: `DIRECT_URL` → **Value**: Paste POSTGRES_PRISMA_URL
4. Check all environments (Production, Preview, Development)
5. Click **Save**

### Step 4: Redeploy
1. Go to **Deployments**
2. Click **...** → **Redeploy**

**Done!** Your database is ready and **completely FREE** (256MB storage, 60 hours compute/month).

---

## Option 2: Neon (Alternative - Also Free)

1. Go to [Neon.tech](https://neon.tech/) and sign up
2. Click **Create Project**
3. Name it: `smartpantry`
4. Copy the connection string
5. Use the **same string** for both `DATABASE_URL` and `DIRECT_URL` in Vercel
6. Add to environment variables and redeploy

**Free tier**: 512MB storage, 0.5GB transfer/month

---

## Why You Need a Database

The app stores:
- User accounts
- Pantry items
- Grocery lists
- Meal ideas
- Notifications

Without a database, the app won't work. But don't worry - both options above are **100% FREE** for MVP use!

---

## After Setup

Once you've added the environment variables:
1. The deployment will automatically run migrations
2. Your database will be empty (no data)
3. You can optionally seed it with demo data (see below)

### Optional: Add Demo Data

After deployment works, you can add demo users and data:

```bash
# Via Vercel CLI (if you have it)
cd api
vercel env pull .env.local
npm run seed
```

Or wait - we can add a seed endpoint to the API if you want!

---

## Cost: $0

Both Vercel Postgres and Neon are **completely free** for MVP use. You won't be charged anything.

