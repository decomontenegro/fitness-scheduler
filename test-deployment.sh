#!/bin/bash

# 🧪 Testar Deploy do Fitness Scheduler
echo "🚀 Testando Deploy do Fitness Scheduler"
echo "======================================"
echo ""

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# URL base do Railway (você precisa pegar isso do dashboard)
echo -e "${YELLOW}📋 Para testar o deploy:${NC}"
echo ""
echo "1. Acesse o Railway Dashboard:"
echo "   ${BLUE}https://railway.app/dashboard${NC}"
echo ""
echo "2. No projeto fitness-scheduler, procure a URL do app"
echo "   (algo como: fitness-scheduler-production-xxxx.up.railway.app)"
echo ""
echo "3. Cole a URL aqui:"
read -p "URL do app Railway (ou Enter para pular): " RAILWAY_URL

if [ -z "$RAILWAY_URL" ]; then
    echo ""
    echo -e "${YELLOW}⚠️  URL não fornecida. Usando exemplos de teste:${NC}"
    RAILWAY_URL="https://fitness-scheduler-production.up.railway.app"
    echo "   Exemplo: $RAILWAY_URL"
fi

# Remover trailing slash se houver
RAILWAY_URL=${RAILWAY_URL%/}

echo ""
echo -e "${BLUE}🔍 Testando endpoints...${NC}"
echo ""

# Função para testar endpoint
test_endpoint() {
    local endpoint=$1
    local description=$2
    local method=${3:-GET}
    local data=${4:-}
    
    echo -n "Testing $description: "
    
    if [ "$method" = "POST" ] && [ -n "$data" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$RAILWAY_URL$endpoint" 2>/dev/null)
    else
        response=$(curl -s -o /dev/null -w "%{http_code}" "$RAILWAY_URL$endpoint" 2>/dev/null)
    fi
    
    if [ "$response" = "200" ] || [ "$response" = "201" ] || [ "$response" = "302" ] || [ "$response" = "304" ]; then
        echo -e "${GREEN}✅ OK ($response)${NC}"
        return 0
    elif [ "$response" = "401" ] || [ "$response" = "403" ]; then
        echo -e "${YELLOW}⚠️  Auth Required ($response)${NC}"
        return 0
    elif [ "$response" = "404" ]; then
        echo -e "${RED}❌ Not Found ($response)${NC}"
        return 1
    elif [ "$response" = "500" ] || [ "$response" = "502" ] || [ "$response" = "503" ]; then
        echo -e "${RED}❌ Server Error ($response)${NC}"
        return 1
    elif [ "$response" = "000" ]; then
        echo -e "${RED}❌ Cannot connect (site offline?)${NC}"
        return 1
    else
        echo -e "${YELLOW}⚠️  Response: $response${NC}"
        return 1
    fi
}

# Testar página inicial
echo -e "${BLUE}1. Páginas principais:${NC}"
test_endpoint "/" "Homepage"
test_endpoint "/login" "Login page"
test_endpoint "/register" "Register page"
test_endpoint "/schedule" "Schedule page"

echo ""
echo -e "${BLUE}2. APIs públicas:${NC}"
test_endpoint "/api/health" "Health check"
test_endpoint "/api/trainers" "Trainers list"

echo ""
echo -e "${BLUE}3. Teste de Login:${NC}"

# Testar login com credenciais
echo -e "${YELLOW}Testando login com trainer@test.com...${NC}"
login_response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"email":"trainer@test.com","password":"123456"}' \
    "$RAILWAY_URL/api/auth/login" 2>/dev/null)

if echo "$login_response" | grep -q "token\|success\|user"; then
    echo -e "${GREEN}✅ Login funcionando!${NC}"
    echo "   Resposta: $(echo $login_response | cut -c1-100)..."
elif echo "$login_response" | grep -q "Invalid\|Unauthorized\|not found"; then
    echo -e "${RED}❌ Login falhou - usuário não existe ou senha incorreta${NC}"
    echo "   Resposta: $login_response"
    echo ""
    echo -e "${YELLOW}💡 Solução:${NC}"
    echo "   1. Verifique se o seed-production foi executado"
    echo "   2. Verifique as variáveis de ambiente no Railway"
    echo "   3. Tente fazer redeploy"
else
    echo -e "${YELLOW}⚠️  Resposta inesperada${NC}"
    echo "   $login_response"
fi

echo ""
echo -e "${BLUE}4. Resumo:${NC}"
echo ""

# Verificar se o site está online
if curl -s -o /dev/null -w "%{http_code}" "$RAILWAY_URL" 2>/dev/null | grep -q "200\|302\|304"; then
    echo -e "${GREEN}✅ Site está ONLINE!${NC}"
    echo "   URL: $RAILWAY_URL"
    echo ""
    echo -e "${BLUE}Credenciais de teste:${NC}"
    echo "   Trainer: trainer@test.com / 123456"
    echo "   Cliente: client@test.com / 123456"
else
    echo -e "${RED}❌ Site parece estar OFFLINE ou com problemas${NC}"
    echo ""
    echo -e "${YELLOW}Possíveis problemas:${NC}"
    echo "   1. Deploy ainda em andamento"
    echo "   2. DATABASE_URL não configurada"
    echo "   3. Outras variáveis faltando"
    echo "   4. Erro no build"
    echo ""
    echo -e "${YELLOW}Verifique:${NC}"
    echo "   - Logs no Railway Dashboard"
    echo "   - Variáveis de ambiente configuradas"
    echo "   - Status do deployment"
fi

echo ""
echo -e "${BLUE}📊 Comandos úteis:${NC}"
echo "   railway logs     # Ver logs do app"
echo "   railway status   # Ver status"
echo "   ./check-deploy.sh   # Verificar configuração"
echo ""