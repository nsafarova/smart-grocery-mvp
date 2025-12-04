# Fix: API Returns NOT_FOUND on Vercel

## The Problem

Your API at `https://smart-grocery-mvp.vercel.app` returns `NOT_FOUND` for all endpoints.

## Root Cause

Vercel isn't finding your Express app. This happens when:
1. The `vercel.json` routing is incorrect
2. The TypeScript isn't being compiled correctly
3. The export format isn't compatible with Vercel

## The Fix

### Option 1: Use Root-Level `api/` Folder (Recommended for Monorepo)

If your API is deployed as a **separate Vercel project**, you need to restructure:

1. **Move Express app to root `api/` folder:**
   ```bash
   # In your API project root
   mkdir -p api
   # Create api/index.ts that imports from src/index.ts
   ```

2. **Update `vercel.json`:**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "api/index.ts",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "/api/index.ts"
       }
     ]
   }
   ```

### Option 2: Fix Current Structure (What We Just Did)

The current setup should work if:
1. ✅ `vercel.json` points to `src/index.ts`
2. ✅ Express app exports as `export default app`
3. ✅ Build script compiles TypeScript correctly

**Check these in Vercel:**

1. **Go to API Project Settings → Build & Development Settings**
   - **Root Directory**: Should be empty (or `api` if monorepo)
   - **Build Command**: Should be `npm run vercel-build`
   - **Output Directory**: Leave empty
   - **Install Command**: `npm install`

2. **Check Deployment Logs:**
   - Look for: `✅ Build completed successfully!`
   - Look for errors about `src/index.ts` not found

3. **Verify File Structure in Vercel:**
   - After deployment, check if `src/index.ts` exists
   - Check if `dist/index.js` was created

### Option 3: Use Compiled JavaScript

If TypeScript isn't working, use compiled JS:

1. **Update `vercel.json`:**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "dist/index.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "/dist/index.js"
       }
     ]
   }
   ```

2. **Ensure build creates `dist/index.js`**

## Quick Test

After redeploying, test these URLs:

1. `https://smart-grocery-mvp.vercel.app/health`
   - Should return: `{"status":"healthy","timestamp":"..."}`

2. `https://smart-grocery-mvp.vercel.app/api/users`
   - Should return: `{"success":true,"data":[...]}`

## If Still Not Working

1. **Check Vercel Function Logs:**
   - Go to API project → Functions tab
   - Click on a function → View logs
   - Look for runtime errors

2. **Try Manual Test:**
   ```bash
   # In your API project root
   npm run build
   node dist/index.js
   # Test locally: curl http://localhost:3000/health
   ```

3. **Verify Environment Variables:**
   - `DATABASE_URL` is set
   - `FRONTEND_URL` is set (for CORS)

## Current Status

✅ Code is pushed to GitHub
⏳ Waiting for Vercel to redeploy
⏳ Need to verify deployment logs

