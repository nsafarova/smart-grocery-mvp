# Debug: Login "Failed to fetch" + CORS Errors

## What You're Seeing

From the screenshot:
- ✅ Frontend is loading correctly
- ❌ Login requests are failing
- ❌ Network tab shows:
  - **3 requests with "CORS error"** (fetch type)
  - **3 requests with "404"** (preflight/OPTIONS type)

## Root Causes

### 1. API Not Deployed (404 Errors)
The API is returning 404, which means:
- The deployment failed (likely the 12-function limit issue)
- OR the API URL is incorrect

### 2. CORS Errors
CORS errors happen when:
- API doesn't allow requests from your frontend domain
- OR API isn't responding at all (404)

## Step-by-Step Fix

### Step 1: Check API Deployment Status

1. Go to Vercel Dashboard
2. Open your **API project** (`smart-grocery-mvp`)
3. Check **Deployments** tab
4. Look at the latest deployment:
   - ✅ **Ready** = API is deployed
   - ❌ **Error** = Deployment failed (check logs)

### Step 2: Verify API is Working

Test in browser:
```
https://smart-grocery-mvp.vercel.app/health
```

**Expected:** `{"status":"healthy","timestamp":"..."}`
**If 404:** API isn't deployed yet

### Step 3: Check Frontend Environment Variable

1. Go to Vercel Dashboard
2. Open your **Frontend project** (`smart-grocery-mvp-9scn`)
3. Go to **Settings** → **Environment Variables**
4. Check if `NEXT_PUBLIC_API_URL` exists:
   - **Should be:** `https://smart-grocery-mvp.vercel.app`
   - **If missing:** Add it and redeploy

### Step 4: Check API CORS Settings

1. Go to your **API project** in Vercel
2. **Settings** → **Environment Variables**
3. Check `FRONTEND_URL`:
   - **Should be:** `https://smart-grocery-mvp-9scn.vercel.app`
   - **If missing:** Add it and redeploy

### Step 5: Check Browser Console

Open DevTools → **Console** tab and look for:
- What URL is being called?
- Any error messages?

The frontend should be calling:
```
https://smart-grocery-mvp.vercel.app/api/users/login
```

If it's calling `http://localhost:3000`, the environment variable isn't set.

## Quick Test in Browser Console

Open Console (F12) and run:

```javascript
// Check what API URL is configured
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);

// Try direct fetch
fetch('https://smart-grocery-mvp.vercel.app/health')
  .then(r => r.json())
  .then(console.log)
  .catch(err => console.error('API Error:', err));
```

## If API Deployment Failed

If the API deployment failed due to the 12-function limit:

1. **Check deployment logs** in Vercel
2. **Look for:** "No more than 12 Serverless Functions"
3. **Solution:** The `.vercelignore` file should fix this
4. **Redeploy** the API project

## Current Status Checklist

- [ ] API deployment is successful (not 404)
- [ ] `NEXT_PUBLIC_API_URL` is set in frontend
- [ ] `FRONTEND_URL` is set in API
- [ ] Both projects are redeployed after env var changes
- [ ] API `/health` endpoint works
- [ ] Browser console shows correct API URL

## Next Steps

1. **First:** Make sure API is deployed (check Vercel dashboard)
2. **Then:** Set environment variables
3. **Finally:** Redeploy both projects

Once API is working, the login should work! 🎉

