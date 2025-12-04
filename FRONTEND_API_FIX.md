# Fix: "Failed to fetch" Login Error

## The Problem

Your frontend (`smart-grocery-mvp-9scn.vercel.app`) can't connect to your API (`smart-grocery-mvp.vercel.app`).

## Root Cause

1. **Frontend doesn't know API URL**: `NEXT_PUBLIC_API_URL` environment variable is not set
2. **API CORS not configured**: API doesn't allow requests from your frontend domain

## The Fix (2 Steps)

### Step 1: Set Frontend Environment Variable

1. Go to your **Frontend project** in Vercel (`smart-grocery-mvp-9scn`)
2. Go to **Settings** → **Environment Variables**
3. Add:
   - **Name**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://smart-grocery-mvp.vercel.app`
   - **Environments**: ✅ Production, ✅ Preview, ✅ Development
   - Click **Save**

### Step 2: Update API CORS Settings

1. Go to your **API project** in Vercel (`smart-grocery-mvp`)
2. Go to **Settings** → **Environment Variables**
3. Find or add:
   - **Name**: `FRONTEND_URL`
   - **Value**: `https://smart-grocery-mvp-9scn.vercel.app`
   - **Environments**: ✅ Production, ✅ Preview, ✅ Development
   - Click **Save**

### Step 3: Redeploy Both

1. **Frontend**: Go to Deployments → Click "..." → Redeploy
2. **API**: Go to Deployments → Click "..." → Redeploy

## Why This Happened

**What was happening:**
- Frontend tried to call API at `http://localhost:3000` (default fallback)
- This doesn't exist in production → "Failed to fetch"
- Even if URL was correct, CORS would block it

**What should happen:**
- Frontend reads `NEXT_PUBLIC_API_URL` from environment
- Makes request to `https://smart-grocery-mvp.vercel.app/api/users/login`
- API checks CORS, sees frontend URL is allowed
- Request succeeds

## After Fixing

1. Wait for both deployments to complete
2. Refresh your frontend page
3. Try logging in again
4. Should work! ✅

