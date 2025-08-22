#!/bin/bash

echo "🚀 Starting Fitness Scheduler Production"
echo "========================================"

# Debug environment
echo "📊 Environment Check:"
echo "  NODE_ENV: $NODE_ENV"
echo "  DATABASE_URL exists: $([ -n "$DATABASE_URL" ] && echo "Yes" || echo "No")"
echo "  PORT: ${PORT:-3000}"

# Check DATABASE_URL or use DATABASE_PUBLIC_URL
if [ -z "$DATABASE_URL" ]; then
    if [ -n "$DATABASE_PUBLIC_URL" ]; then
        echo "⚠️ DATABASE_URL not set, using DATABASE_PUBLIC_URL"
        export DATABASE_URL="$DATABASE_PUBLIC_URL"
    else
        echo "❌ ERROR: Neither DATABASE_URL nor DATABASE_PUBLIC_URL is set!"
        echo "Please configure DATABASE_URL in Railway variables."
        exit 1
    fi
fi

echo "✅ DATABASE_URL is configured"

# Wait for database
echo "⏳ Waiting for database..."
sleep 10

# Run migrations with retry
echo "📊 Running database migrations..."
npx prisma migrate deploy || {
    echo "⚠️ Migration failed, retrying..."
    sleep 5
    npx prisma migrate deploy || {
        echo "⚠️ Migrations failed, but continuing..."
    }
}

# Run seed (ignore errors)
echo "🌱 Running seed..."
npx tsx prisma/seed-production.ts 2>/dev/null || echo "ℹ️ Seed skipped or already done"

# Start server
echo "✅ Starting Next.js server..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 App URL: https://fitness-scheduler-production.up.railway.app"
echo "🔐 Credentials:"
echo "   Trainer: trainer@test.com / 123456"
echo "   Client: client@test.com / 123456"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Start Next.js
npm run start