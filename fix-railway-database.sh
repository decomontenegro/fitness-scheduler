#!/bin/bash

# 🔧 Fix Railway Database Connection
echo "🚂 Corrigindo conexão com banco de dados no Railway"
echo "=================================================="
echo ""

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

cd "/Users/andremontenegro/agendamento claude code/fitness-scheduler"

echo -e "${YELLOW}📋 INSTRUÇÕES IMPORTANTES:${NC}"
echo ""
echo -e "${BLUE}1. Acesse o Railway Dashboard:${NC}"
echo "   https://railway.app/dashboard"
echo ""

echo -e "${BLUE}2. No projeto fitness-scheduler:${NC}"
echo "   - Clique no serviço ${GREEN}fitness-scheduler${NC}"
echo "   - Vá na aba ${GREEN}Variables${NC}"
echo ""

echo -e "${BLUE}3. Adicione TODAS estas variáveis:${NC}"
echo ""
echo -e "${GREEN}DATABASE_URL${NC}"
echo "   👉 Clique em 'Add Reference' → Selecione 'Postgres' → 'DATABASE_URL'"
echo "   (Isso conecta automaticamente ao banco PostgreSQL)"
echo ""

echo -e "${GREEN}Copie e cole as outras variáveis:${NC}"
cat << 'EOF'
NODE_ENV=production
JWT_SECRET=fitness-scheduler-jwt-super-secure-production-key-2024
JWT_EXPIRES_IN=1h
NEXTAUTH_SECRET=fitness-scheduler-nextauth-production-secret-2024
ENCRYPTION_KEY=fitness-scheduler-encryption-production-key-32
EOF

echo ""
echo -e "${BLUE}4. Após adicionar todas as variáveis:${NC}"
echo "   - Clique em ${GREEN}Deploy${NC} (canto superior direito)"
echo "   - Ou aguarde o redeploy automático"
echo ""

echo -e "${YELLOW}⚠️  IMPORTANTE:${NC}"
echo "   A variável DATABASE_URL DEVE ser uma referência ao PostgreSQL"
echo "   NÃO digite manualmente - use 'Add Reference'"
echo ""

echo -e "${BLUE}5. Acompanhe o deploy:${NC}"
echo "   - Vá na aba ${GREEN}Deployments${NC}"
echo "   - Veja os logs em tempo real"
echo "   - Aguarde aparecer 'Deployment successful'"
echo ""

echo -e "${GREEN}✅ Quando o deploy terminar:${NC}"
echo "   - Acesse a URL do seu app"
echo "   - Use as credenciais:"
echo "     Trainer: trainer@test.com / 123456"
echo "     Cliente: client@test.com / 123456"
echo ""

echo -e "${RED}🔴 Status atual do erro:${NC}"
echo "   DATABASE_URL não está configurada"
echo "   Por isso o build falhou"
echo ""
echo -e "${GREEN}✅ A solução:${NC}"
echo "   Adicionar DATABASE_URL como referência ao PostgreSQL"
echo "   nas variáveis do serviço fitness-scheduler"
echo ""