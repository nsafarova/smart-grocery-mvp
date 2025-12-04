# Step-by-Step Vercel Deployment Guide

This guide will walk you through deploying SmartPantry to Vercel, step by step.

## 📋 Prerequisites

Before you start, make sure you have:
- ✅ A GitHub account
- ✅ Your code pushed to GitHub (already done!)
- ✅ A Vercel account (sign up at https://vercel.com/signup - it's free)

---

## 🗄️ Step 1: Set Up PostgreSQL Database

You need a PostgreSQL database. Here are your options:

### Option A: Vercel Postgres (Easiest - Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Storage** in the left sidebar
3. Click **Create Database**
4. Select **Postgres**
5. Name it: `smartpantry-db`
6. Choose a region (closest to you)
7. Click **Create**
8. **Important**: Copy these two connection strings:
   - `POSTGRES_URL` (this is your `DATABASE_URL` - pooled connection)
   - `POSTGRES_PRISMA_URL` (this is your `DIRECT_URL` - direct connection)
   - Save them somewhere safe - you'll need them in Step 3!

### Option B: Neon (Free tier - Alternative)

1. Go to [Neon.tech](https://neon.tech/) and sign up
2. Click **Create Project**
3. Name it: `smartpantry`
4. Choose a region
5. Click **Create Project**
6. Go to **Connection Details**
7. Copy the connection string (looks like: `postgresql://user:pass@host/dbname`)
8. You'll use this for both `DATABASE_URL` and `DIRECT_URL`

---

## 🚀 Step 2: Install Vercel CLI (Optional but Recommended)

You can deploy via the web interface, but CLI is faster:

```bash
npm install -g vercel
```

Then login:
```bash
vercel login
```

---

## 🔧 Step 3: Deploy the API

### 3.1: Deploy via Vercel Dashboard (Easiest Method)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New...** → **Project**
3. Import your GitHub repository: `smart-grocery-mvp`
4. **Configure Project**:
   - **Framework Preset**: Other
   - **Root Directory**: `api` (click "Edit" and set to `api`)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. Click **Deploy**

### 3.2: Set Environment Variables for API

After deployment starts, you need to add environment variables:

1. Go to your project → **Settings** → **Environment Variables**
2. Add these variables (one by one):

   **Variable 1:**
   - **Name**: `DATABASE_URL`
   - **Value**: Paste your pooled PostgreSQL connection string
   - **Environment**: Production, Preview, Development (check all)
   - Click **Save**

   **Variable 2:**
   - **Name**: `DIRECT_URL`
   - **Value**: Paste your direct PostgreSQL connection string
   - **Environment**: Production, Preview, Development (check all)
   - Click **Save**

   **Variable 3:**
   - **Name**: `FRONTEND_URL`
   - **Value**: `https://smartpantry.vercel.app` (we'll update this after frontend deploys)
   - **Environment**: Production, Preview, Development (check all)
   - Click **Save**

   **Variable 4 (Optional - for AI meal suggestions):**
   - **Name**: `OPENAI_API_KEY`
   - **Value**: Your OpenAI API key (if you have one)
   - **Environment**: Production, Preview, Development (check all)
   - Click **Save**

### 3.3: Run Database Migration

After the API is deployed, you need to run migrations:

**Option A: Via Vercel Dashboard**
1. Go to your API project → **Deployments**
2. Click on the latest deployment
3. Click **View Function Logs**
4. Check if migration ran (it should run automatically via `vercel-build` script)

**Option B: Via CLI (if migration didn't run)**
```bash
cd api
vercel env pull .env.local
npx prisma migrate deploy
```

### 3.4: Seed the Database (Optional)

To populate with demo data:
```bash
cd api
# Make sure you have DATABASE_URL set
npm run seed
```

### 3.5: Get Your API URL

After deployment completes:
1. Go to your API project dashboard
2. Copy the **Production URL** (e.g., `https://smartpantry-api.vercel.app`)
3. Save it - you'll need it for the frontend!

---

## 🎨 Step 4: Deploy the Frontend

### 4.1: Deploy via Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New...** → **Project**
3. Import your GitHub repository: `smart-grocery-mvp` (same repo!)
4. **Configure Project**:
   - **Framework Preset**: Next.js (should auto-detect)
   - **Root Directory**: `web` (click "Edit" and set to `web`)
   - **Build Command**: `npm run build` (auto-filled)
   - **Output Directory**: `.next` (auto-filled)
   - **Install Command**: `npm install` (auto-filled)
5. Click **Deploy**

### 4.2: Set Environment Variables for Frontend

1. Go to your frontend project → **Settings** → **Environment Variables**
2. Add this variable:

   **Variable:**
   - **Name**: `NEXT_PUBLIC_API_URL`
   - **Value**: Your API URL from Step 3.5 (e.g., `https://smartpantry-api.vercel.app`)
   - **Environment**: Production, Preview, Development (check all)
   - Click **Save**

3. **Redeploy** the frontend (go to **Deployments** → click **...** → **Redeploy**)

### 4.3: Update API CORS Settings

Now update the API's `FRONTEND_URL`:

1. Go back to your **API project** → **Settings** → **Environment Variables**
2. Find `FRONTEND_URL`
3. Click **Edit**
4. Update value to your frontend URL (e.g., `https://smartpantry.vercel.app`)
5. Click **Save**
6. **Redeploy** the API

---

## ✅ Step 5: Verify Everything Works

1. **Test API Health**: Visit `https://your-api-url.vercel.app/health`
   - Should return: `{"status":"healthy","timestamp":"..."}`

2. **Test Frontend**: Visit `https://your-frontend-url.vercel.app`
   - Should show the login page
   - Try logging in with: `demo@smartgrocery.app`

3. **Test Login**: 
   - Enter email: `demo@smartgrocery.app`
   - Should redirect to home page
   - Should see pantry items and dashboard

---

## 🔄 Step 6: Set Up Automatic Deployments

Both projects should already be connected to GitHub. To verify:

1. Go to each project → **Settings** → **Git**
2. Make sure your repository is connected
3. **Production Branch**: Set to `main` or `feature/mvp-implementation`
4. Now every push to that branch will auto-deploy!

---

## 📝 Quick Reference: Environment Variables

### API Project (`api/`)
| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL pooled connection | `postgresql://...` |
| `DIRECT_URL` | PostgreSQL direct connection | `postgresql://...` |
| `FRONTEND_URL` | Frontend URL for CORS | `https://smartpantry.vercel.app` |
| `OPENAI_API_KEY` | OpenAI API key (optional) | `sk-...` |

### Frontend Project (`web/`)
| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | API base URL | `https://smartpantry-api.vercel.app` |

---

## 🐛 Troubleshooting

### Issue: "Database connection failed"
- ✅ Check `DATABASE_URL` is set correctly
- ✅ Make sure database is running (Vercel Postgres should be automatic)
- ✅ Check if IP restrictions exist on your database

### Issue: "CORS error" in browser
- ✅ Make sure `FRONTEND_URL` in API matches your actual frontend URL
- ✅ Check both URLs use `https://` (not `http://`)
- ✅ Redeploy API after changing `FRONTEND_URL`

### Issue: "404 Not Found" on API routes
- ✅ Check `vercel.json` is in the `api/` folder
- ✅ Make sure build completed successfully
- ✅ Check function logs in Vercel dashboard

### Issue: Frontend can't connect to API
- ✅ Check `NEXT_PUBLIC_API_URL` is set correctly
- ✅ Make sure API is deployed and accessible
- ✅ Test API health endpoint manually

### Issue: Migration didn't run
```bash
# Run manually via CLI
cd api
vercel env pull .env.local
npx prisma migrate deploy
```

---

## 💰 Cost Estimate

**Free Tier Includes:**
- ✅ Vercel: 100GB bandwidth/month, unlimited serverless functions
- ✅ Vercel Postgres: 256MB storage, 60 hours compute/month
- ✅ Neon (if used): 512MB storage, 0.5GB transfer/month

**You'll likely stay within free tier for MVP!**

---

## 🎉 You're Done!

Your app should now be live at:
- **Frontend**: `https://your-project.vercel.app`
- **API**: `https://your-api-project.vercel.app`

Share the frontend URL with anyone to test your app!

---

## 📚 Next Steps (Optional)

1. **Custom Domain**: Add your own domain in Vercel project settings
2. **Analytics**: Enable Vercel Analytics to track usage
3. **Monitoring**: Set up error tracking (Sentry, etc.)
4. **CI/CD**: Already set up! Every push auto-deploys

---

## 🆘 Need Help?

- Vercel Docs: https://vercel.com/docs
- Vercel Discord: https://vercel.com/discord
- Check deployment logs in Vercel Dashboard → Deployments → View Function Logs

