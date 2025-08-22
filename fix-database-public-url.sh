#!/bin/bash

echo "🔧 Corrigindo URL do Banco de Dados"
echo "===================================="

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "\n${YELLOW}⚠️  IMPORTANTE:${NC}"
echo -e "${RED}A URL atual está usando 'postgres.railway.internal' que só funciona DENTRO do Railway!${NC}"
echo -e "${GREEN}Você precisa da URL PÚBLICA do PostgreSQL.${NC}"

echo -e "\n${BLUE}📋 INSTRUÇÕES:${NC}"
echo -e "1. Acesse: ${GREEN}https://railway.app${NC}"
echo -e "2. Entre no projeto: ${GREEN}fitness-scheduler${NC}"
echo -e "3. Clique no serviço: ${GREEN}Postgres${NC}"
echo -e "4. Na aba ${GREEN}Connect${NC}, procure por:"
echo -e "   - ${YELLOW}Postgres Connection URL${NC} (URL pública)"
echo -e "   - Deve ter formato: ${YELLOW}postgresql://postgres:senha@viaduct.proxy.rlwy.net:PORTA/railway${NC}"
echo -e "5. ${RED}NÃO use a URL com 'postgres.railway.internal'!${NC}"

echo -e "\n${YELLOW}Cole aqui a URL PÚBLICA do PostgreSQL (com viaduct.proxy.rlwy.net):${NC}"
read -r PUBLIC_DATABASE_URL

if [[ ! "$PUBLIC_DATABASE_URL" =~ "viaduct.proxy.rlwy.net" ]]; then
    echo -e "${RED}❌ ERRO: Esta não parece ser uma URL pública!${NC}"
    echo -e "${RED}A URL deve conter 'viaduct.proxy.rlwy.net'${NC}"
    exit 1
fi

echo -e "\n${GREEN}✅ URL pública detectada!${NC}"

# Atualizar arquivos locais
echo -e "\n${YELLOW}Atualizando arquivos locais...${NC}"

# .env
sed -i '' "s|DATABASE_URL=.*|DATABASE_URL=\"$PUBLIC_DATABASE_URL\"|" .env

# .env.local
sed -i '' "s|DATABASE_URL=.*|DATABASE_URL=\"$PUBLIC_DATABASE_URL\"|" .env.local

# .env.production
sed -i '' "s|DATABASE_URL=.*|DATABASE_URL=\"$PUBLIC_DATABASE_URL\"|" .env.production 2>/dev/null || true

echo -e "${GREEN}✅ Arquivos locais atualizados!${NC}"

# Atualizar Railway
echo -e "\n${YELLOW}Atualizando variáveis no Railway...${NC}"
railway variables --set DATABASE_URL="$PUBLIC_DATABASE_URL"
railway variables --set DATABASE_PUBLIC_URL="$PUBLIC_DATABASE_URL"

# Testar conexão
echo -e "\n${YELLOW}Testando conexão com o banco...${NC}"
npx prisma db push --accept-data-loss

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Conexão bem sucedida!${NC}"
    
    # Popular banco
    echo -e "\n${YELLOW}Populando banco de dados...${NC}"
    npx tsx prisma/seed-production.ts
    
    # Deploy
    echo -e "\n${YELLOW}Fazendo deploy no Railway...${NC}"
    railway up
    
    echo -e "\n${GREEN}✨ TUDO PRONTO!${NC}"
    echo -e "${BLUE}----------------------------------------${NC}"
    echo -e "${GREEN}Local:${NC} http://localhost:3000"
    echo -e "${GREEN}Production:${NC} https://fitness-scheduler-production.up.railway.app"
    echo -e "\n${YELLOW}Credenciais:${NC}"
    echo -e "  Trainer: trainer@test.com / 123456"
    echo -e "  Client: client@test.com / 123456"
    echo -e "${BLUE}----------------------------------------${NC}"
    
    # Reiniciar servidor local
    pkill -f "next dev" 2>/dev/null
    npm run dev
else
    echo -e "${RED}❌ Falha na conexão!${NC}"
    echo -e "${YELLOW}Verifique se copiou a URL correta do Railway.${NC}"
fi