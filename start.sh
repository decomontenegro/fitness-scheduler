#!/bin/bash

echo "🚀 Starting Fitness Scheduler..."

# Aguardar o banco estar pronto
echo "⏳ Waiting for database..."
sleep 5

# Executar migrações
echo "📊 Running database migrations..."
npx prisma migrate deploy

# Verificar se precisa fazer seed
echo "🌱 Checking if seed is needed..."
npx prisma db seed || echo "Seed already done or failed (might be ok)"

# Iniciar a aplicação
echo "✅ Starting Next.js server..."
npm run start