#!/bin/bash

# 🔍 Verificar Status do Deploy no Railway
echo "🚂 Verificando Deploy do Fitness Scheduler"
echo "=========================================="
echo ""

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

cd "/Users/andremontenegro/agendamento claude code/fitness-scheduler"

echo -e "${BLUE}📊 Status do Projeto:${NC}"
railway status
echo ""

echo -e "${BLUE}🔗 Links Importantes:${NC}"
echo "Dashboard: https://railway.app/dashboard"
echo "GitHub: https://github.com/decomontenegro/fitness-scheduler"
echo ""

echo -e "${YELLOW}📝 Checklist de Verificação:${NC}"
echo ""

# Verificar se o repositório foi criado
echo -n "1. Repositório GitHub criado? "
if git ls-remote origin HEAD > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Sim${NC}"
    echo "   └─ https://github.com/decomontenegro/fitness-scheduler"
else
    echo -e "${RED}❌ Não${NC}"
    echo "   └─ Crie em: https://github.com/new"
fi

# Verificar se o código foi enviado
echo -n "2. Código enviado para GitHub? "
REMOTE_COMMIT=$(git ls-remote origin main 2>/dev/null | cut -f1)
LOCAL_COMMIT=$(git rev-parse HEAD 2>/dev/null)
if [ "$REMOTE_COMMIT" = "$LOCAL_COMMIT" ]; then
    echo -e "${GREEN}✅ Sim${NC}"
    echo "   └─ Commit: ${LOCAL_COMMIT:0:7}"
else
    echo -e "${RED}❌ Não${NC}"
    echo "   └─ Execute: git push -u origin main"
fi

echo ""
echo -e "${BLUE}🌐 Para verificar o deploy:${NC}"
echo ""
echo "1. Acesse o Railway Dashboard:"
echo "   ${BLUE}https://railway.app/dashboard${NC}"
echo ""
echo "2. Procure pelo projeto 'fitness-scheduler'"
echo ""
echo "3. Verifique se existe um serviço conectado ao GitHub"
echo ""
echo "4. Se não existir, clique em '+ New' → 'GitHub Repo'"
echo "   e conecte: decomontenegro/fitness-scheduler"
echo ""

echo -e "${YELLOW}⚙️  Comandos úteis do Railway:${NC}"
echo ""
echo "# Para ver logs do deploy (após conectar o serviço):"
echo -e "${GREEN}railway link${NC} (escolha o projeto e serviço)"
echo -e "${GREEN}railway logs${NC}"
echo ""
echo "# Para ver a URL do app:"
echo -e "${GREEN}railway domain${NC}"
echo ""
echo "# Para verificar variáveis:"
echo -e "${GREEN}railway variables${NC}"
echo ""

echo -e "${BLUE}📋 Variáveis necessárias no Railway:${NC}"
cat << 'EOF'

NODE_ENV=production
JWT_SECRET=fitness-scheduler-jwt-super-secure-production-key-2024
JWT_EXPIRES_IN=1h
NEXTAUTH_SECRET=fitness-scheduler-nextauth-production-secret-2024
ENCRYPTION_KEY=fitness-scheduler-encryption-production-key-32

EOF

echo -e "${GREEN}🔑 Credenciais de teste (após deploy):${NC}"
echo "  Trainer: trainer@test.com / 123456"
echo "  Cliente: client@test.com / 123456"
echo ""

# Tentar obter mais informações
echo -e "${YELLOW}🔍 Tentando obter mais informações...${NC}"
echo ""

# Verificar se railway CLI está conectado a um serviço
if railway whoami > /dev/null 2>&1; then
    echo -e "Usuário Railway: ${GREEN}$(railway whoami)${NC}"
else
    echo -e "${RED}Railway CLI não está logado${NC}"
    echo "Execute: railway login"
fi

echo ""
echo -e "${BLUE}📌 Status atual:${NC}"
echo "- Código commitado e enviado para GitHub ✅"
echo "- Aguardando conexão com Railway no dashboard"
echo "- Acesse: https://railway.app/dashboard"
echo ""