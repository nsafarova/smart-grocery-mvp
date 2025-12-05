# Fix: Vercel "12 Serverless Functions" Limit Error

## The Problem

Vercel Hobby plan allows only **12 serverless functions** per deployment. Your Express app is creating more than 12 functions, causing the deployment to fail.

## Root Cause

Vercel is detecting multiple files as separate serverless functions. This can happen if:
1. Multiple files exist in the `api/` folder
2. Compiled files in `dist/` are being detected as functions
3. TypeScript source files are being treated as functions

## The Solution

For an Express app, you only need **ONE** serverless function that handles all routes.

### What I've Done

1. ✅ Created `api/.vercelignore` to exclude unnecessary files
2. ✅ Ensured only `api/index.ts` exists in the `api/` folder
3. ✅ Configured `vercel.json` to route all requests to a single function

### If Still Failing

**Option 1: Check Vercel Project Settings**

1. Go to your API project in Vercel
2. Settings → General
3. Check **Root Directory**: Should be empty (or `api` if monorepo)
4. Make sure it's not detecting the entire monorepo

**Option 2: Use a Single File Approach**

Instead of `api/api/index.ts`, put the entry point directly at the root:

1. Move `api/api/index.ts` → `api/index.ts` (at root of API project)
2. Update `vercel.json`:
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "index.ts",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "/index.ts"
       }
     ]
   }
   ```

**Option 3: Upgrade to Pro Plan**

If you need more functions, upgrade to Vercel Pro plan ($20/month).

## Current Status

✅ Code pushed with `.vercelignore`
⏳ Waiting for Vercel to redeploy
⏳ Should only create 1 serverless function now

