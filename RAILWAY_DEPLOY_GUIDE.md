# 🚂 Guia Completo de Deploy no Railway

## 📋 Pré-requisitos
✅ Railway CLI já instalado (versão 4.5.3)
✅ Build de produção testado e funcionando
✅ Configurações prontas (railway.json e railway.toml)

## 🚀 Passo a Passo para Deploy

### 1️⃣ **Fazer Login no Railway**
```bash
# Execute este comando e siga as instruções no browser
railway login
```
- Uma janela do navegador abrirá
- Faça login com sua conta Railway (ou crie uma gratuita)
- Autorize o CLI

### 2️⃣ **Criar Novo Projeto**
```bash
# No diretório do projeto
cd /Users/andremontenegro/agendamento\ claude\ code/fitness-scheduler

# Criar projeto no Railway
railway init
```
- Escolha: "Empty Project"
- Digite um nome: "fitness-scheduler"

### 3️⃣ **Adicionar PostgreSQL**
```bash
# Adicionar banco de dados PostgreSQL
railway add
```
- Escolha: "PostgreSQL"
- O Railway criará automaticamente o banco

### 4️⃣ **Configurar Variáveis de Ambiente**
```bash
# Abrir dashboard do Railway
railway open
```

No dashboard, vá em **Variables** e adicione:

```env
# Essenciais (COPIE E COLE)
NODE_ENV=production
JWT_SECRET=fitness-scheduler-jwt-super-secure-production-key-2024
JWT_EXPIRES_IN=1h
NEXTAUTH_SECRET=fitness-scheduler-nextauth-production-secret-2024
ENCRYPTION_KEY=fitness-scheduler-encryption-production-key-32

# O DATABASE_URL será configurado automaticamente pelo Railway
```

### 5️⃣ **Fazer Deploy**
```bash
# Deploy da aplicação
railway up
```
- O Railway fará automaticamente:
  - Build do projeto
  - Instalação de dependências
  - Migrations do Prisma
  - Start da aplicação

### 6️⃣ **Obter URL da Aplicação**
```bash
# Ver status e URL
railway status
railway domain
```

### 7️⃣ **Popular Banco de Dados**
```bash
# Conectar ao banco Railway
railway run npx prisma db push

# Popular com dados de teste (opcional)
railway run npm run seed
```

## 📊 Comandos Úteis Railway

```bash
# Ver logs em tempo real
railway logs

# Ver variáveis de ambiente
railway variables

# Abrir dashboard
railway open

# Ver status do deploy
railway status

# Destruir projeto (cuidado!)
railway down
```

## 🔐 Credenciais de Teste

Após o deploy, use estas credenciais:

| Tipo | Email | Senha |
|------|-------|-------|
| **Trainer** | trainer@test.com | 123456 |
| **Client** | client@test.com | 123456 |

## 🌐 URLs Importantes

Após o deploy, sua aplicação estará em:
```
https://fitness-scheduler-production-xxxx.up.railway.app
```

Principais rotas:
- `/` - Home
- `/login` - Login
- `/register` - Cadastro
- `/dashboard/trainer` - Dashboard Trainer
- `/dashboard/client` - Dashboard Cliente
- `/schedule` - Agendamento

## ⚡ Configuração Automática

O Railway automaticamente:
- ✅ Detecta Next.js
- ✅ Configura PORT
- ✅ Instala dependências
- ✅ Roda build
- ✅ Configura SSL/HTTPS
- ✅ Gerencia DATABASE_URL
- ✅ Faz health checks

## 🚨 Troubleshooting

> 📖 Para um guia completo de troubleshooting, veja: [RAILWAY_TROUBLESHOOTING.md](./RAILWAY_TROUBLESHOOTING.md)

### Verificar Credenciais de Teste
```bash
# Verificar se usuários de teste existem
railway run npm run check-users

# Criar/corrigir usuários de teste
railway run npm run seed-production
```

### Erro de Build
```bash
# Ver logs detalhados
railway logs

# Rebuild manual
railway up --detach
```

### Erro de Banco
```bash
# Resetar banco (CUIDADO - apaga tudo!)
railway run npx prisma db push --force-reset

# Verificar conexão
railway run npx prisma db pull
```

### Erro de Variáveis
```bash
# Listar variáveis
railway variables

# Adicionar variável
railway variables set KEY=value
```

## 📈 Monitoramento

No dashboard Railway você pode:
- Ver logs em tempo real
- Monitorar uso de recursos
- Ver métricas de performance
- Configurar alertas
- Gerenciar deploys

## 💰 Custos

**Plano Gratuito Railway:**
- $5 de crédito mensal
- 500 horas de execução
- 100GB de banda
- PostgreSQL incluído
- SSL gratuito

**Estimativa:** App roda ~30 dias no plano gratuito

## 🎯 Próximos Passos

1. Execute `railway login`
2. Siga os passos 2-7
3. Compartilhe a URL gerada
4. Teste a aplicação

## 🆘 Suporte

- [Railway Docs](https://docs.railway.app)
- [Railway Discord](https://discord.gg/railway)
- [Status Page](https://status.railway.app)

---

**🎉 Seu app estará online em menos de 5 minutos!**