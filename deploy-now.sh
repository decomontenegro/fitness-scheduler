#!/bin/bash

# 🚀 Deploy Rápido para Railway
echo "🚂 Deploy para Railway - Fitness Scheduler"
echo "=========================================="
echo ""

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Navegar para o diretório
cd "/Users/andremontenegro/agendamento claude code/fitness-scheduler"

echo -e "${BLUE}📁 Diretório: $(pwd)${NC}"
echo ""

# Verificar se está logado
echo -e "${YELLOW}🔐 Verificando login no Railway...${NC}"
if railway whoami > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Logado no Railway${NC}"
else
    echo -e "${YELLOW}⚠️  Fazendo login no Railway...${NC}"
    railway login
fi

echo ""
echo -e "${BLUE}📦 Preparando deploy...${NC}"
echo ""

# Opções de deploy
echo "Escolha uma opção:"
echo "1) Deploy via GitHub (recomendado)"
echo "2) Deploy direto do código local"
echo "3) Apenas configurar variáveis"
echo ""
read -p "Opção (1-3): " choice

case $choice in
    1)
        echo ""
        echo -e "${YELLOW}📝 Para deploy via GitHub:${NC}"
        echo ""
        echo "1. Crie um repositório no GitHub:"
        echo "   ${BLUE}https://github.com/new${NC}"
        echo ""
        echo "2. Configure o git local:"
        echo -e "${GREEN}"
        echo "   git remote add origin https://github.com/SEU_USUARIO/fitness-scheduler.git"
        echo "   git push -u origin main"
        echo -e "${NC}"
        echo "3. No Railway Dashboard:"
        echo "   a) Acesse: ${BLUE}https://railway.app/dashboard${NC}"
        echo "   b) Selecione o projeto 'fitness-scheduler'"
        echo "   c) Clique em '+ New' → 'GitHub Repo'"
        echo "   d) Conecte seu repositório"
        echo ""
        echo "4. Configure as variáveis de ambiente no Railway:"
        echo "   ${BLUE}https://railway.app/project/fitness-scheduler/settings${NC}"
        echo ""
        echo -e "${GREEN}Variáveis necessárias:${NC}"
        cat << 'EOF'

NODE_ENV=production
JWT_SECRET=fitness-scheduler-jwt-super-secure-production-key-2024
JWT_EXPIRES_IN=1h
NEXTAUTH_SECRET=fitness-scheduler-nextauth-production-secret-2024
ENCRYPTION_KEY=fitness-scheduler-encryption-production-key-32

EOF
        ;;
        
    2)
        echo ""
        echo -e "${YELLOW}🚀 Fazendo deploy direto...${NC}"
        echo ""
        echo "Execute manualmente:"
        echo -e "${GREEN}"
        echo "1. railway link"
        echo "   - Escolha: fitness-scheduler"
        echo "   - Escolha o serviço principal (geralmente o primeiro)"
        echo ""
        echo "2. railway up"
        echo -e "${NC}"
        echo ""
        echo "Depois configure as variáveis:"
        echo "railway variables set NODE_ENV=production"
        echo "railway variables set JWT_SECRET=fitness-scheduler-jwt-super-secure-production-key-2024"
        echo "railway variables set JWT_EXPIRES_IN=1h"
        echo "railway variables set NEXTAUTH_SECRET=fitness-scheduler-nextauth-production-secret-2024"
        echo "railway variables set ENCRYPTION_KEY=fitness-scheduler-encryption-production-key-32"
        ;;
        
    3)
        echo ""
        echo -e "${YELLOW}⚙️  Configurando apenas variáveis...${NC}"
        echo ""
        echo "Execute estes comandos após linkar o serviço:"
        echo -e "${GREEN}"
        cat << 'EOF'
railway link
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=fitness-scheduler-jwt-super-secure-production-key-2024
railway variables set JWT_EXPIRES_IN=1h
railway variables set NEXTAUTH_SECRET=fitness-scheduler-nextauth-production-secret-2024
railway variables set ENCRYPTION_KEY=fitness-scheduler-encryption-production-key-32
railway redeploy
EOF
        echo -e "${NC}"
        ;;
esac

echo ""
echo -e "${BLUE}📊 Comandos úteis:${NC}"
echo "  railway logs     - Ver logs do deploy"
echo "  railway open     - Abrir dashboard"
echo "  railway domain   - Ver URL do app"
echo "  railway status   - Ver status"
echo ""
echo -e "${GREEN}🔑 Credenciais de teste:${NC}"
echo "  Trainer: trainer@test.com / 123456"
echo "  Cliente: client@test.com / 123456"
echo ""
echo -e "${YELLOW}✨ Boa sorte com o deploy!${NC}"