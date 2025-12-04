# Simple Fix: Deploy Without DIRECT_URL (For Now)

I've updated the code to make `DIRECT_URL` optional. However, you **still need `DATABASE_URL`** for the app to work.

## Quick Solution: Use Free Vercel Postgres (2 Minutes)

Even for MVP, you need a database. But it's **100% FREE** and takes 2 minutes:

### Step 1: Create Free Database
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Storage** → **Create Database** → **Postgres**
3. Name: `smartpantry-db`
4. Click **Create**

### Step 2: Copy Connection String
After creating, you'll see:
- **POSTGRES_URL** → Copy this entire string

### Step 3: Add to Vercel Project
1. Go to your **API project** in Vercel
2. **Settings** → **Environment Variables**
3. Add:
   - **Name**: `DATABASE_URL`
   - **Value**: Paste the POSTGRES_URL you copied
   - **Environments**: ✅ Production, ✅ Preview, ✅ Development
   - Click **Save**

### Step 4: Redeploy
1. Go to **Deployments**
2. Click **...** → **Redeploy**

**That's it!** The app will now work. `DIRECT_URL` is optional - if not set, it uses `DATABASE_URL`.

---

## What I Changed

1. ✅ Made `DIRECT_URL` optional in build script
2. ✅ Build script now uses `DATABASE_URL` as fallback for `DIRECT_URL`
3. ✅ Migration will work even without `DIRECT_URL`

---

## After Deployment

Once it deploys successfully:
1. Visit your API URL: `https://your-api.vercel.app/health`
2. Should return: `{"status":"healthy"}`

Then you can:
- Deploy the frontend
- Test the login page
- Add demo data (optional)

---

## Cost: $0

Vercel Postgres free tier includes:
- 256MB storage (plenty for MVP)
- 60 hours compute/month
- No credit card required

You won't be charged anything for MVP use!

