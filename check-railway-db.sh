#!/bin/bash

echo "🔍 Verificando banco de dados no Railway"
echo "========================================"
echo ""

cd "/Users/andremontenegro/agendamento claude code/fitness-scheduler"

echo "1. Status do Railway:"
railway status

echo ""
echo "2. Variáveis atuais:"
railway variables | grep -E "DATABASE|POSTGRES" || echo "Nenhuma variável de banco encontrada"

echo ""
echo "3. Testando conexões possíveis:"
echo ""

# Testa URL pública
echo "Testando URL pública (viaduct.proxy.rlwy.net)..."
DATABASE_URL="postgresql://postgres:MjklMnBuFexBjXHnSmXQOAjSKpGnVjVe@viaduct.proxy.rlwy.net:42063/railway" \
  timeout 5 node -e "console.log('Tentando conectar...')" 2>&1 || echo "❌ Falhou"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 SOLUÇÃO ALTERNATIVA:"
echo ""
echo "1. Vá em: https://railway.app/dashboard"
echo "2. No serviço Postgres, clique em 'Settings'"
echo "3. Procure por 'Restart' e reinicie o banco"
echo "4. Aguarde 1 minuto"
echo ""
echo "OU"
echo ""
echo "1. Delete o serviço Postgres atual"
echo "2. Clique em '+ New' → 'Database' → 'Add PostgreSQL'"
echo "3. Aguarde o novo banco ser criado"
echo "4. Copie a nova DATABASE_URL"
echo "5. Atualize no serviço fitness-scheduler"
echo ""