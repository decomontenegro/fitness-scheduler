#!/bin/bash

# 🚂 Setup Railway - Script Completo
echo "🚂 Configurando Railway - Fitness Scheduler"
echo "==========================================="
echo ""

# Navegar para o diretório correto
cd "/Users/andremontenegro/agendamento claude code/fitness-scheduler"

echo "📁 Diretório: $(pwd)"
echo ""
echo "🔗 Conectando ao Railway..."
echo ""
echo "INSTRUÇÕES:"
echo "1. Escolha: decomontenegro's Projects"
echo "2. Escolha: fitness-scheduler" 
echo "3. Escolha: production"
echo "4. Escolha o serviço web (NÃO o Postgres)"
echo ""
echo "Executando: railway link"
echo "-----------------------------------"

railway link

echo ""
echo "✅ Conectado! Agora vamos configurar..."
echo ""
echo "📊 Status atual:"
railway status

echo ""
echo "🌐 Verificando domínio..."
railway domain

echo ""
echo "⚙️ Configurando variáveis de ambiente..."
echo ""

# Configurar DATABASE_URL como referência
echo "1. Configurando DATABASE_URL..."
railway variables set DATABASE_URL='${{Postgres.DATABASE_URL}}'

# Configurar outras variáveis
echo "2. Configurando NODE_ENV..."
railway variables set NODE_ENV=production

echo "3. Configurando JWT_SECRET..."
railway variables set JWT_SECRET=fitness-scheduler-jwt-super-secure-production-key-2024

echo "4. Configurando JWT_EXPIRES_IN..."
railway variables set JWT_EXPIRES_IN=1h

echo "5. Configurando NEXTAUTH_SECRET..."
railway variables set NEXTAUTH_SECRET=fitness-scheduler-nextauth-production-secret-2024

echo "6. Configurando ENCRYPTION_KEY..."
railway variables set ENCRYPTION_KEY=fitness-scheduler-encryption-production-key-32

echo ""
echo "✅ Variáveis configuradas!"
echo ""
echo "📋 Verificando variáveis..."
railway variables

echo ""
echo "🚀 Fazendo deploy..."
echo ""
railway up

echo ""
echo "✅ Deploy iniciado!"
echo ""
echo "📊 Para ver os logs em tempo real:"
echo "   railway logs"
echo ""
echo "🌐 Para ver a URL do app:"
echo "   railway domain"
echo ""
echo "🔑 Credenciais de teste:"
echo "   Trainer: trainer@test.com / 123456"
echo "   Cliente: client@test.com / 123456"
echo ""