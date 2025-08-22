# Quick Database Fix Guide

## Problem
The Railway PostgreSQL database has authentication issues and network connectivity problems.

## Solution: Use a Free External PostgreSQL Database

### Option 1: Neon (Recommended - Fastest)
1. Go to https://neon.tech
2. Sign up for free account (GitHub login available)
3. Create a new project
4. Copy the connection string (looks like: `postgresql://user:pass@host.neon.tech/database`)

### Option 2: Supabase
1. Go to https://supabase.com
2. Sign up for free account
3. Create a new project
4. Go to Settings > Database
5. Copy the connection string

### Option 3: Aiven
1. Go to https://aiven.io
2. Sign up for free trial
3. Create PostgreSQL service
4. Copy connection string

## After Getting Your Database URL:

### 1. Update Local Files
```bash
# Update .env file
DATABASE_URL="your-new-postgresql-url-here"

# Update .env.local file
DATABASE_URL="your-new-postgresql-url-here"
```

### 2. Push Schema to New Database
```bash
npx prisma db push
```

### 3. Seed the Database
```bash
npx tsx prisma/seed-production.ts
```

### 4. Update Railway
```bash
railway variables --set DATABASE_URL="your-new-postgresql-url-here"
railway up
```

### 5. Test Login
- Local: http://localhost:3000
- Production: https://fitness-scheduler-production.up.railway.app

**Default Credentials:**
- Trainer: trainer@test.com / 123456
- Client: client@test.com / 123456

## Alternative: Use SQLite Locally
If you just want to test locally without Railway:

1. Update `.env.local`:
```bash
DATABASE_URL="file:./dev.db"
```

2. Push schema:
```bash
npx prisma db push
```

3. Seed:
```bash
npx tsx prisma/seed-production.ts
```

4. Run locally:
```bash
npm run dev
```

This will work immediately for local development!