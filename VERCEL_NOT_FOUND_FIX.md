# Comprehensive Guide: Fixing Vercel NOT_FOUND Error

## 1. **The Fix**

### Problem
Vercel is returning `NOT_FOUND` when trying to access your API routes.

### Solution
The issue is likely with how Vercel routes requests to your serverless function. Here are the fixes:

**Option A: Fix vercel.json routing (Recommended)**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/src/index.ts"
    }
  ]
}
```

**Option B: Create explicit API route handlers**
Create individual serverless functions for better control, but this is more complex.

**Option C: Use Vercel's API directory structure**
Move to `api/` folder structure, but this requires more refactoring.

---

## 2. **Root Cause Analysis**

### What Was Happening vs. What Should Happen

**What was happening:**
- Vercel receives a request like `GET /api/users`
- Vercel looks at `vercel.json` routing rules
- Routes to `src/index.ts` (your Express app)
- Express app should handle `/api/users` route
- But Vercel might not be correctly invoking the Express app handler

**What should happen:**
- Vercel receives request
- Routes to your Express app correctly
- Express middleware chain processes the request
- Route handler executes
- Response sent back

### Conditions That Triggered This Error

1. **Path mismatch**: The `dest` in `vercel.json` might need a leading slash
2. **Export format**: Vercel might expect a specific export format
3. **Build output**: The compiled JavaScript might not be in the expected location
4. **Route priority**: Vercel's routing might conflict with Express routing

### The Misconception

**Common misconception**: "If it works locally, it will work on Vercel"

**Reality**: 
- Local development runs a full Node.js server
- Vercel uses serverless functions (AWS Lambda-like)
- Serverless functions have different execution contexts
- Routing works differently in serverless vs. traditional servers

---

## 3. **Teaching the Concept**

### Why This Error Exists

**Vercel's NOT_FOUND error protects you from:**
- Wasted compute on invalid routes
- Security issues (exposing internal paths)
- Confusion about what endpoints exist
- Unnecessary function invocations

### The Mental Model

**Traditional Server (Local Development):**
```
Request → Server Process → Express App → Route Handler → Response
```
- One long-running process
- Express handles all routing internally
- Routes are matched within the Express app

**Serverless Functions (Vercel):**
```
Request → Vercel Router → Function Invocation → Express App → Route Handler → Response
```
- Each request triggers a new function invocation
- Vercel routes first, then invokes your function
- Your function must handle the routed path correctly

### How This Fits Into the Framework

**Express.js:**
- Designed for traditional servers
- Assumes it controls all routing
- Works in serverless but needs proper configuration

**Vercel Serverless:**
- Uses AWS Lambda under the hood
- Functions are stateless
- Each request is isolated
- Routing happens at the platform level first

**The Bridge:**
- `@vercel/node` adapter wraps your Express app
- Converts Lambda events to Express req/res objects
- Handles the translation between platforms

---

## 4. **Warning Signs & Patterns**

### What to Look For

**Code Smells:**
1. ✅ **Hardcoded paths**: If you see `/api/` hardcoded in multiple places
2. ✅ **Missing base path handling**: Not accounting for Vercel's routing
3. ✅ **Environment-specific code**: Code that works locally but not in production
4. ✅ **Incorrect exports**: Not exporting the handler correctly

**Patterns That Cause This:**
1. **Path prefix issues**: 
   - Your routes are `/api/users`
   - But Vercel might be routing to `/api/users` and your app expects just `/users`
   - Or vice versa

2. **Build output mismatch**:
   - TypeScript compiles to `dist/`
   - But `vercel.json` points to `src/`
   - Mismatch causes function not found

3. **Multiple route handlers**:
   - Conflicting route definitions
   - Vercel doesn't know which to use

### Similar Mistakes to Avoid

1. **Frontend routing**: Next.js has its own routing - don't mix Express routes with Next.js routes
2. **API versioning**: If you version APIs (`/api/v1/users`), make sure Vercel routes account for this
3. **Wildcard routes**: Be careful with `(.*)` - it might catch too much
4. **Static files**: Don't route static assets through your Express app

### Red Flags

- ✅ "Works locally but not on Vercel"
- ✅ "404 on all routes"
- ✅ "Function not found" errors
- ✅ Routes work sometimes but not others
- ✅ Health check works but API routes don't

---

## 5. **Alternative Approaches & Trade-offs**

### Approach 1: Single Express App (Current - Recommended for MVP)

**How it works:**
- One Express app handles all routes
- Vercel routes everything to one function
- Express handles internal routing

**Pros:**
- Simple setup
- Easy to maintain
- Works like traditional server
- Good for MVP

**Cons:**
- Cold starts affect all routes
- Can't optimize individual routes
- Larger function size

**Best for:** MVP, small APIs, rapid development

---

### Approach 2: Individual Serverless Functions

**How it works:**
- Create separate files: `api/users.ts`, `api/pantry.ts`, etc.
- Each is its own serverless function
- Vercel auto-discovers them

**Structure:**
```
api/
  users.ts      → /api/users
  pantry.ts     → /api/pantry
  meals.ts      → /api/meals
```

**Pros:**
- Faster cold starts (smaller functions)
- Better performance
- Can optimize per route
- Better error isolation

**Cons:**
- More files to maintain
- Code duplication risk
- More complex setup
- Harder to share middleware

**Best for:** Production apps, large APIs, performance-critical

---

### Approach 3: Hybrid Approach

**How it works:**
- Keep Express app for most routes
- Extract hot paths to individual functions
- Use both patterns together

**Pros:**
- Best of both worlds
- Optimize where needed
- Keep simplicity elsewhere

**Cons:**
- More complex architecture
- Two patterns to maintain
- Harder to reason about

**Best for:** Growing apps, performance optimization

---

### Approach 4: Use Vercel's API Routes (Next.js Style)

**How it works:**
- If using Next.js, use `pages/api/` or `app/api/`
- Each file is a route handler
- No Express needed

**Pros:**
- Native Vercel support
- Automatic routing
- Type-safe with TypeScript
- Integrated with Next.js

**Cons:**
- Only works with Next.js
- Less flexible than Express
- Different patterns to learn

**Best for:** Next.js apps, full-stack frameworks

---

## **Recommended Fix for Your Case**

Since you're using Express with Vercel, I recommend:

1. **Fix the `vercel.json` routing** (add leading slash to `dest`)
2. **Ensure proper export** (your current export is correct)
3. **Test with health endpoint first** (`/health`)
4. **Then test API routes** (`/api/users`)

The fix I applied should resolve the issue. The key change is ensuring Vercel correctly routes to your Express app handler.

---

## **Testing the Fix**

After deploying:

1. Test health: `https://your-api.vercel.app/health`
2. Test API: `https://your-api.vercel.app/api/users`
3. Check Vercel function logs for any errors
4. Verify the function is being invoked

If it still doesn't work, check:
- Function logs in Vercel dashboard
- Network tab in browser (what status code?)
- Whether the function is being invoked at all

