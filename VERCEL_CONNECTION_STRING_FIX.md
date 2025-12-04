# Fix: Invalid Database Connection String Error

The error "The scheme is not recognized in database URL" usually means:
1. The connection string has extra spaces or characters
2. The password contains special characters that need URL encoding
3. The connection string is malformed

## Quick Fix

### Step 1: Check Your Connection String in Vercel

1. Go to your API project → **Settings** → **Environment Variables**
2. Find `DATABASE_URL`
3. Click to view/edit it
4. Make sure it looks exactly like this (no extra spaces, no quotes):

```
postgresql://neondb_owner:npg_2M9NEFWTvXPo@ep-still-block-ah51g49m-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### Step 2: Common Issues

**Issue 1: Extra spaces or quotes**
- ❌ Wrong: `"postgresql://..."` (with quotes)
- ❌ Wrong: ` postgresql://... ` (with spaces)
- ✅ Correct: `postgresql://...` (no quotes, no spaces)

**Issue 2: Password needs URL encoding**
If your password has special characters like `@`, `#`, `%`, etc., they need to be URL encoded:
- `@` becomes `%40`
- `#` becomes `%23`
- `%` becomes `%25`

But your password `npg_2M9NEFWTvXPo` should be fine as-is.

**Issue 3: Copy-paste issues**
Sometimes copying from Neon adds hidden characters. Try:
1. Delete the entire value
2. Type or paste it fresh
3. Make sure there are no trailing spaces

### Step 3: Use the Correct Connection String

From your Neon dashboard, use the **exact** connection string shown. It should be:

**For DATABASE_URL (pooled - recommended):**
```
postgresql://neondb_owner:npg_2M9NEFWTvXPo@ep-still-block-ah51g49m-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**For DIRECT_URL (optional - direct connection):**
```
postgresql://neondb_owner:npg_2M9NEFWTvXPo@ep-still-block-ah51g49m.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
```
(Note: This one doesn't have `-pooler` in the hostname)

### Step 4: Verify in Vercel

1. Go to **Settings** → **Environment Variables**
2. Click on `DATABASE_URL` to edit
3. Make sure:
   - No quotes around the value
   - No spaces at the beginning or end
   - Starts with `postgresql://`
   - Has the format: `postgresql://user:password@host/database?params`

### Step 5: Redeploy

After fixing the connection string:
1. Click **Save**
2. Go to **Deployments**
3. Click **...** → **Redeploy**

## Alternative: Get Fresh Connection String

If it still doesn't work:

1. Go to Neon dashboard
2. Go to your project → **Connection Details**
3. Click **Copy** next to the connection string
4. Paste it directly into Vercel (don't modify it)
5. Make sure to select the **pooled** connection for `DATABASE_URL`

## Test Connection String Locally (Optional)

You can test if the connection string works:

```bash
# In your api/ folder
DATABASE_URL="your-connection-string" npx prisma db pull
```

If this works locally, the connection string is valid and the issue is in how it's set in Vercel.

