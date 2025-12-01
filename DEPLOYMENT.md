# Deployment Guide - Vercel

This guide covers deploying SmartPantry to Vercel with a PostgreSQL database.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Vercel                              │
├─────────────────────┬───────────────────────────────────┤
│   Frontend (web/)   │   API (api/) - Serverless        │
│   Next.js App       │   Express + Prisma               │
│   smartpantry.vercel.app │  smartpantry-api.vercel.app │
└─────────────────────┴───────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    │  (Vercel/Neon)  │
                    └─────────────────┘
```

## Prerequisites

1. [Vercel Account](https://vercel.com/signup)
2. [Vercel CLI](https://vercel.com/docs/cli): `npm i -g vercel`
3. GitHub repository with your code

## Step 1: Set Up PostgreSQL Database

### Option A: Vercel Postgres (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Storage** → **Create Database** → **Postgres**
3. Name it `smartpantry-db`
4. Copy the connection strings:
   - `DATABASE_URL` (pooled connection)
   - `DIRECT_URL` (direct connection for migrations)

### Option B: Neon (Free tier available)

1. Go to [Neon](https://neon.tech/) and create a project
2. Copy your connection string
3. Format: `postgresql://user:pass@host/dbname?sslmode=require`

### Option C: Supabase

1. Go to [Supabase](https://supabase.com/) and create a project
2. Go to **Settings** → **Database** → **Connection string**
3. Use the **URI** format

## Step 2: Deploy the API

```bash
cd api

# Login to Vercel
vercel login

# Deploy (first time - will create project)
vercel

# When prompted:
# - Set up and deploy? Yes
# - Which scope? Select your account
# - Link to existing project? No
# - Project name: smartpantry-api
# - Directory: ./
# - Override settings? No
```

### Set Environment Variables

```bash
# Set database URL
vercel env add DATABASE_URL production
# Paste your pooled connection string

vercel env add DIRECT_URL production  
# Paste your direct connection string

# Set OpenAI key (optional, for AI meal suggestions)
vercel env add OPENAI_API_KEY production
# Paste your OpenAI API key

# Set frontend URL for CORS
vercel env add FRONTEND_URL production
# Enter: https://smartpantry.vercel.app (your frontend URL)
```

### Run Database Migration

```bash
# Pull env vars locally
vercel env pull .env.production

# Run migration against production DB
DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d '=' -f2) npx prisma migrate deploy

# Or use Vercel's build command (runs automatically on deploy)
vercel --prod
```

### Seed Production Database (Optional)

```bash
# Run seed script
DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d '=' -f2) npm run seed
```

## Step 3: Deploy the Frontend

```bash
cd ../web

# Deploy
vercel

# When prompted:
# - Project name: smartpantry
# - Directory: ./
```

### Set Environment Variables

```bash
# Set API URL
vercel env add NEXT_PUBLIC_API_URL production
# Enter: https://smartpantry-api.vercel.app (your API URL)
```

### Deploy to Production

```bash
vercel --prod
```

## Step 4: Verify Deployment

1. **API Health Check**: Visit `https://smartpantry-api.vercel.app/health`
2. **Frontend**: Visit `https://smartpantry.vercel.app`

## Environment Variables Summary

### API (`api/`)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection (pooled) | `postgresql://...` |
| `DIRECT_URL` | PostgreSQL connection (direct) | `postgresql://...` |
| `OPENAI_API_KEY` | OpenAI API key (optional) | `sk-...` |
| `FRONTEND_URL` | Frontend URL for CORS | `https://smartpantry.vercel.app` |

### Frontend (`web/`)

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | API base URL | `https://smartpantry-api.vercel.app` |

## Automatic Deployments

Once linked to GitHub:

1. Go to Vercel Dashboard → Your Project → **Settings** → **Git**
2. Connect your GitHub repository
3. Set:
   - **Production Branch**: `main`
   - **Root Directory**: `api` or `web` depending on project

Now every push to `main` will auto-deploy!

## Custom Domain (Optional)

1. Go to Vercel Dashboard → Your Project → **Settings** → **Domains**
2. Add your domain (e.g., `smartpantry.app`)
3. Update DNS records as instructed
4. Update `FRONTEND_URL` env var in API project

## Troubleshooting

### Database Connection Issues

```bash
# Test connection locally
DATABASE_URL="your-url" npx prisma db pull
```

### CORS Errors

Make sure `FRONTEND_URL` in API matches your actual frontend URL.

### Build Failures

```bash
# Check build logs
vercel logs

# Run build locally to debug
npm run build
```

### Cold Starts

Serverless functions have cold starts. First request may be slow (~1-2s).

## Local Development with Production DB

```bash
# In api/
vercel env pull .env.local

# Run locally against production DB (careful!)
npm run dev
```

## Costs

- **Vercel**: Free tier includes 100GB bandwidth, serverless functions
- **Vercel Postgres**: Free tier includes 256MB storage
- **Neon**: Free tier includes 512MB storage
- **OpenAI**: Pay per use (~$0.002 per meal suggestion)

## Security Notes

1. Never commit `.env` files
2. Use different databases for dev/prod
3. Rotate API keys periodically
4. Enable Vercel's DDoS protection (automatic)

