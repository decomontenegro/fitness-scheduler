#!/bin/bash

echo "🚀 Iniciando Fitness Scheduler em Produção"
echo ""

# Verificar se o build existe
if [ ! -d ".next" ]; then
    echo "📦 Build não encontrado. Executando build..."
    npm run build
fi

echo ""
echo "✅ Iniciando servidor de produção..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 Aplicação disponível em:"
echo "   http://localhost:3001"
echo ""
echo "🔐 Credenciais de teste:"
echo "   Trainer: test-trainer@fitness.com / 123456"
echo "   Cliente: test-client@fitness.com / 123456"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Iniciar servidor
PORT=3001 npm run start