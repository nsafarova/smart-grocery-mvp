# How to Test Your API

## Quick Methods

### 1. Browser Testing (Easiest)

Open these URLs directly in your browser:

**Health Check:**
```
https://smart-grocery-mvp.vercel.app/health
```
Should return: `{"status":"healthy","timestamp":"..."}`

**Get All Users:**
```
https://smart-grocery-mvp.vercel.app/api/users
```
Should return: `{"success":true,"data":[...]}`

**Get User by ID:**
```
https://smart-grocery-mvp.vercel.app/api/users/1
```

**Get Pantry Items:**
```
https://smart-grocery-mvp.vercel.app/api/pantry?userId=1
```

**Get Grocery Lists:**
```
https://smart-grocery-mvp.vercel.app/api/grocery-lists?userId=1
```

**Get Meal Ideas:**
```
https://smart-grocery-mvp.vercel.app/api/meals?userId=1
```

**Get Notifications:**
```
https://smart-grocery-mvp.vercel.app/api/notifications?userId=1
```

### 2. Using curl (Terminal)

**Health Check:**
```bash
curl https://smart-grocery-mvp.vercel.app/health
```

**Get All Users:**
```bash
curl https://smart-grocery-mvp.vercel.app/api/users
```

**Login (POST request):**
```bash
curl -X POST https://smart-grocery-mvp.vercel.app/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@smartgrocery.app"}'
```

**Get Pantry Items:**
```bash
curl "https://smart-grocery-mvp.vercel.app/api/pantry?userId=1"
```

**Pretty Print JSON:**
```bash
curl https://smart-grocery-mvp.vercel.app/api/users | python3 -m json.tool
# or with jq (if installed):
curl https://smart-grocery-mvp.vercel.app/api/users | jq
```

### 3. Browser DevTools (Network Tab)

1. Open your frontend: `https://smart-grocery-mvp-9scn.vercel.app`
2. Press `F12` to open DevTools
3. Go to **Network** tab
4. Try to login or navigate the app
5. Click on any API request to see:
   - Request URL
   - Request Headers
   - Request Body
   - Response Status
   - Response Body

### 4. Browser Console (JavaScript)

Open browser console (F12 → Console) and run:

```javascript
// Test health endpoint
fetch('https://smart-grocery-mvp.vercel.app/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);

// Get all users
fetch('https://smart-grocery-mvp.vercel.app/api/users')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);

// Login
fetch('https://smart-grocery-mvp.vercel.app/api/users/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'demo@smartgrocery.app' })
})
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);

// Get pantry items
fetch('https://smart-grocery-mvp.vercel.app/api/pantry?userId=1')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

### 5. Using Postman or Insomnia

1. **Download Postman**: https://www.postman.com/downloads/
2. Create a new request
3. Set method (GET, POST, etc.)
4. Enter URL: `https://smart-grocery-mvp.vercel.app/api/users`
5. For POST requests:
   - Go to **Body** tab
   - Select **raw** and **JSON**
   - Enter: `{"email":"demo@smartgrocery.app"}`
6. Click **Send**

### 6. Check Database Directly (If Needed)

If you want to see the raw database data:

**Using Prisma Studio (Local):**
```bash
cd api
npm run studio
```
Opens a GUI at `http://localhost:5555` to browse your database.

**Using Neon Console:**
1. Go to your Neon dashboard
2. Click on your database
3. Use the SQL Editor to run queries:
   ```sql
   SELECT * FROM "user";
   SELECT * FROM "PantryItem";
   SELECT * FROM "GroceryList";
   ```

## Available Demo Users

You can test login with these emails:
- `demo@smartgrocery.app`
- `sarah@smartgrocery.app`
- `mike@smartgrocery.app`
- `emily@smartgrocery.app`

## Common Issues

**404 Not Found:**
- API might not be deployed yet
- Check Vercel deployment status

**CORS Error:**
- Make sure `FRONTEND_URL` is set in API environment variables
- Should be: `https://smart-grocery-mvp-9scn.vercel.app`

**Empty Response:**
- Database might not be seeded
- Check if data exists in database

**500 Error:**
- Check Vercel function logs
- Look for database connection issues

## Quick Test Script

Save this as `test-api.sh`:

```bash
#!/bin/bash

API_URL="https://smart-grocery-mvp.vercel.app"

echo "Testing Health..."
curl -s "$API_URL/health" | python3 -m json.tool

echo -e "\n\nTesting Users..."
curl -s "$API_URL/api/users" | python3 -m json.tool

echo -e "\n\nTesting Login..."
curl -s -X POST "$API_URL/api/users/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@smartgrocery.app"}' | python3 -m json.tool

echo -e "\n\nTesting Pantry (userId=1)..."
curl -s "$API_URL/api/pantry?userId=1" | python3 -m json.tool
```

Make it executable and run:
```bash
chmod +x test-api.sh
./test-api.sh
```

