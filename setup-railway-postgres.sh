#!/bin/bash

echo "🚀 Configurando PostgreSQL no Railway do Zero"
echo "============================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "\n${YELLOW}📋 INSTRUÇÕES MANUAIS NO RAILWAY:${NC}"
echo -e "${BLUE}----------------------------------------${NC}"
echo -e "1. Acesse: ${GREEN}https://railway.app${NC}"
echo -e "2. Entre no projeto: ${GREEN}fitness-scheduler${NC}"
echo -e "3. Clique em: ${GREEN}+ New${NC} (botão no canto superior direito)"
echo -e "4. Selecione: ${GREEN}Database${NC}"
echo -e "5. Escolha: ${GREEN}Add PostgreSQL${NC}"
echo -e "6. Aguarde a criação (cerca de 30 segundos)"
echo -e "7. Clique no serviço ${GREEN}Postgres${NC} criado"
echo -e "8. Vá na aba ${GREEN}Variables${NC}"
echo -e "9. Copie o valor de ${GREEN}DATABASE_URL${NC}"
echo -e "${BLUE}----------------------------------------${NC}"

echo -e "\n${YELLOW}Pressione ENTER quando tiver criado o banco no Railway...${NC}"
read

echo -e "\n${YELLOW}📝 Cole aqui a DATABASE_URL do Railway PostgreSQL:${NC}"
read -r DATABASE_URL

if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ DATABASE_URL não pode estar vazia!${NC}"
    exit 1
fi

echo -e "\n${GREEN}✅ DATABASE_URL recebida!${NC}"

# Passo 1: Atualizar variáveis do Railway
echo -e "\n${YELLOW}1️⃣ Configurando variáveis no Railway...${NC}"
railway variables --set DATABASE_URL="$DATABASE_URL"
railway variables --set DATABASE_PUBLIC_URL="$DATABASE_URL"

# Passo 2: Atualizar arquivos locais
echo -e "\n${YELLOW}2️⃣ Atualizando arquivos locais...${NC}"

# Atualizar .env
cat > .env << EOF
# Database
DATABASE_URL="$DATABASE_URL"

# JWT Configuration
JWT_SECRET="fitness-scheduler-jwt-super-secure-secret-key-development-only-32-chars"
JWT_REFRESH_SECRET="fitness-scheduler-refresh-super-secure-secret-key-development-only-32"
JWT_EXPIRES_IN="1h"
JWT_REFRESH_EXPIRES_IN="7d"

# Encryption
ENCRYPTION_KEY="fitness-scheduler-encryption-key32"

# Email Configuration (for password reset and notifications)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
FROM_EMAIL="noreply@fitnessscheduler.com"
FROM_NAME="Fitness Scheduler"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"

# Rate Limiting
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_TIME_MINUTES=15

# 2FA
APP_NAME="Fitness Scheduler"
EOF

# Atualizar .env.local
cat > .env.local << EOF
# Database (Railway PostgreSQL)
DATABASE_URL="$DATABASE_URL"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-change-in-production"

# JWT
JWT_SECRET="fitness-scheduler-jwt-secret-key-super-secure-random-string"
JWT_EXPIRES_IN="1h"

# App
APP_URL="http://localhost:3000"
NODE_ENV="development"
EOF

# Atualizar .env.production
cat > .env.production << EOF
# Railway PostgreSQL
DATABASE_URL="$DATABASE_URL"

# JWT Configuration
JWT_SECRET="fitness-scheduler-jwt-super-secure-production-key-2024"
JWT_REFRESH_SECRET="fitness-scheduler-refresh-super-secure-production-key-2024"
JWT_EXPIRES_IN="1h"
JWT_REFRESH_EXPIRES_IN="7d"

# Encryption
ENCRYPTION_KEY="fitness-scheduler-encryption-production-key-32"

# NextAuth
NEXTAUTH_URL="https://fitness-scheduler-production.up.railway.app"
NEXTAUTH_SECRET="fitness-scheduler-nextauth-production-secret-2024"

# Application
NEXT_PUBLIC_APP_URL="https://fitness-scheduler-production.up.railway.app"
NODE_ENV="production"

# Rate Limiting
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_TIME_MINUTES=15

# 2FA
APP_NAME="Fitness Scheduler"
EOF

echo -e "${GREEN}✅ Arquivos .env atualizados!${NC}"

# Passo 3: Atualizar schema para PostgreSQL
echo -e "\n${YELLOW}3️⃣ Atualizando schema para PostgreSQL...${NC}"
sed -i '' 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma

# Passo 4: Push do schema e seed
echo -e "\n${YELLOW}4️⃣ Criando tabelas no banco...${NC}"
npx prisma db push --accept-data-loss

echo -e "\n${YELLOW}5️⃣ Populando banco com dados iniciais...${NC}"
npx tsx prisma/seed-production.ts

# Passo 5: Deploy no Railway
echo -e "\n${YELLOW}6️⃣ Fazendo deploy no Railway...${NC}"
railway up

echo -e "\n${GREEN}✨ CONFIGURAÇÃO COMPLETA!${NC}"
echo -e "${BLUE}----------------------------------------${NC}"
echo -e "${GREEN}✅ Local:${NC} http://localhost:3000"
echo -e "${GREEN}✅ Production:${NC} https://fitness-scheduler-production.up.railway.app"
echo -e "\n${YELLOW}📧 Credenciais de teste:${NC}"
echo -e "   Trainer: trainer@test.com / 123456"
echo -e "   Client: client@test.com / 123456"
echo -e "${BLUE}----------------------------------------${NC}"

# Reiniciar servidor local
echo -e "\n${YELLOW}Reiniciando servidor local...${NC}"
pkill -f "next dev" 2>/dev/null
npm run dev