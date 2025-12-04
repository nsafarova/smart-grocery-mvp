# Debug: Login "Failed to fetch" Issue

## Step-by-Step Debugging

### 1. Check Frontend Environment Variable

**In Vercel Frontend Project:**
1. Go to **Settings** → **Environment Variables**
2. Verify `NEXT_PUBLIC_API_URL` is set to: `https://smart-grocery-mvp.vercel.app`
3. Make sure it's set for **Production** environment
4. **Important**: After adding/changing, you MUST redeploy for it to take effect

### 2. Check API CORS

**In Vercel API Project:**
1. Go to **Settings** → **Environment Variables**
2. Verify `FRONTEND_URL` is set to: `https://smart-grocery-mvp-9scn.vercel.app`
3. Make sure it's set for **Production** environment

### 3. Test API Directly

Open browser console on your frontend page and run:

```javascript
// Test 1: Check if API URL is set
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);

// Test 2: Try direct fetch
fetch('https://smart-grocery-mvp.vercel.app/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);

// Test 3: Try login endpoint
fetch('https://smart-grocery-mvp.vercel.app/api/users/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'demo@smartgrocery.app' })
})
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

### 4. Common Issues

**Issue 1: Environment Variable Not Set**
- Symptom: `NEXT_PUBLIC_API_URL` is `undefined` or `http://localhost:3000`
- Fix: Set it in Vercel and redeploy

**Issue 2: CORS Error**
- Symptom: Browser console shows CORS error
- Fix: Set `FRONTEND_URL` in API project and redeploy

**Issue 3: API Not Responding**
- Symptom: Network timeout or connection refused
- Fix: Check API deployment status in Vercel

**Issue 4: Wrong API URL**
- Symptom: 404 or wrong domain
- Fix: Verify the correct API URL from Vercel dashboard

### 5. Quick Test URLs

Test these in your browser:

1. **Health Check**: `https://smart-grocery-mvp.vercel.app/health`
   - Should return: `{"status":"healthy","timestamp":"..."}`

2. **Users List**: `https://smart-grocery-mvp.vercel.app/api/users`
   - Should return: `{"success":true,"data":[...]}`

3. **Login (use Postman/curl)**:
   ```bash
   curl -X POST https://smart-grocery-mvp.vercel.app/api/users/login \
     -H "Content-Type: application/json" \
     -d '{"email":"demo@smartgrocery.app"}'
   ```

### 6. Check Browser Console

Open browser DevTools (F12) → Console tab and look for:
- CORS errors
- Network errors
- API URL being used
- Any JavaScript errors

### 7. Check Network Tab

Open DevTools → Network tab:
1. Try to login
2. Look for the API request
3. Check:
   - Request URL (is it correct?)
   - Status code (200, 404, 500?)
   - Response body (what error message?)
   - CORS headers (are they present?)

