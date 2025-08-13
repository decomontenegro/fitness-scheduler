#!/bin/bash

# 🚂 Script de Deploy Automatizado para Railway
# Fitness Scheduler - Production Deployment

echo "════════════════════════════════════════════════════════════════"
echo "🚂 RAILWAY DEPLOY - FITNESS SCHEDULER"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para verificar comandos
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}❌ $1 não está instalado${NC}"
        return 1
    else
        echo -e "${GREEN}✅ $1 está instalado${NC}"
        return 0
    fi
}

# Função para pausar
pause() {
    read -p "Pressione ENTER para continuar..."
}

# 1. Verificar pré-requisitos
echo -e "${BLUE}📋 Verificando pré-requisitos...${NC}"
echo ""

check_command "railway"
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Instalando Railway CLI...${NC}"
    npm install -g @railway/cli
fi

check_command "node"
check_command "npm"
check_command "git"

echo ""
echo -e "${GREEN}✅ Todos os pré-requisitos atendidos!${NC}"
echo ""

# 2. Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erro: Execute este script no diretório do projeto${NC}"
    exit 1
fi

# 3. Build local
echo "════════════════════════════════════════════════════════════════"
echo -e "${BLUE}🔨 Executando build de produção...${NC}"
echo "════════════════════════════════════════════════════════════════"
echo ""

npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build falhou! Corrija os erros antes de continuar${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Build concluído com sucesso!${NC}"
echo ""

# 4. Instruções para login
echo "════════════════════════════════════════════════════════════════"
echo -e "${YELLOW}🔐 PASSO 1: LOGIN NO RAILWAY${NC}"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "Execute o comando abaixo e faça login no browser:"
echo ""
echo -e "${GREEN}railway login${NC}"
echo ""
echo "Após fazer login, volte aqui e continue."
echo ""
pause

# 5. Verificar login
echo "Verificando status do login..."
railway whoami &> /dev/null
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Você não está logado no Railway${NC}"
    echo "Execute: railway login"
    exit 1
fi

echo -e "${GREEN}✅ Login confirmado!${NC}"
echo ""

# 6. Criar projeto
echo "════════════════════════════════════════════════════════════════"
echo -e "${YELLOW}🚀 PASSO 2: CRIAR PROJETO${NC}"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "Vamos criar um novo projeto no Railway."
echo ""
echo -e "${YELLOW}Escolha uma opção:${NC}"
echo "1) Criar novo projeto"
echo "2) Usar projeto existente"
echo ""
read -p "Opção (1 ou 2): " option

if [ "$option" == "1" ]; then
    echo ""
    echo "Execute o comando:"
    echo -e "${GREEN}railway init${NC}"
    echo ""
    echo "- Escolha: Empty Project"
    echo "- Nome sugerido: fitness-scheduler"
    echo ""
    pause
fi

# 7. Adicionar PostgreSQL
echo "════════════════════════════════════════════════════════════════"
echo -e "${YELLOW}🗄️ PASSO 3: ADICIONAR POSTGRESQL${NC}"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "Execute o comando:"
echo -e "${GREEN}railway add${NC}"
echo ""
echo "- Escolha: PostgreSQL"
echo ""
pause

# 8. Configurar variáveis
echo "════════════════════════════════════════════════════════════════"
echo -e "${YELLOW}⚙️ PASSO 4: CONFIGURAR VARIÁVEIS${NC}"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "Abrindo o dashboard do Railway..."
echo ""
railway open

echo ""
echo "No dashboard, vá em VARIABLES e adicione:"
echo ""
echo -e "${GREEN}NODE_ENV=production"
echo "JWT_SECRET=fitness-scheduler-jwt-super-secure-production-key-2024"
echo "JWT_EXPIRES_IN=1h"
echo "NEXTAUTH_SECRET=fitness-scheduler-nextauth-production-secret-2024"
echo "ENCRYPTION_KEY=fitness-scheduler-encryption-production-key-32${NC}"
echo ""
echo "Copie e cole todas as variáveis acima."
echo ""
pause

# 9. Deploy
echo "════════════════════════════════════════════════════════════════"
echo -e "${YELLOW}🚀 PASSO 5: FAZER DEPLOY${NC}"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "Pronto para fazer o deploy?"
read -p "Continuar? (s/n): " confirm

if [ "$confirm" == "s" ] || [ "$confirm" == "S" ]; then
    echo ""
    echo -e "${BLUE}Iniciando deploy...${NC}"
    echo ""
    railway up
    
    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✅ Deploy realizado com sucesso!${NC}"
        echo ""
    else
        echo ""
        echo -e "${RED}❌ Erro no deploy${NC}"
        echo "Verifique os logs com: railway logs"
        exit 1
    fi
fi

# 10. Obter URL
echo "════════════════════════════════════════════════════════════════"
echo -e "${YELLOW}🌐 PASSO 6: OBTER URL DA APLICAÇÃO${NC}"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "Gerando domínio público..."
echo ""
railway domain

echo ""
echo "════════════════════════════════════════════════════════════════"
echo -e "${GREEN}🎉 DEPLOY CONCLUÍDO COM SUCESSO!${NC}"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "📊 Comandos úteis:"
echo ""
echo "  railway logs     - Ver logs em tempo real"
echo "  railway status   - Ver status do deploy"
echo "  railway open     - Abrir dashboard"
echo "  railway run npm run check-users - Verificar usuários de teste"
echo "  railway run npm run seed-production - Popular banco com dados de teste"
echo ""
echo "🔐 Credenciais de teste:"
echo ""
echo "  Trainer: trainer@test.com / 123456"
echo "  Cliente: client@test.com / 123456"
echo ""
echo "════════════════════════════════════════════════════════════════"
echo ""
echo -e "${GREEN}✨ Seu app está online e pronto para uso! ✨${NC}"
echo ""