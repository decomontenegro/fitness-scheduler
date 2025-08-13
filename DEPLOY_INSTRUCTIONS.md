# 🚀 Instruções de Deploy - Fitness Scheduler

## Deploy Rápido - 3 Opções

### Opção 1: Deploy Local em Produção (MAIS RÁPIDO)

Execute o script pronto:
```bash
./start-production.sh
```

Ou manualmente:
```bash
npm run build
PORT=3000 npm run start
```

**Acesse**: http://localhost:3000

---

### Opção 2: Deploy com Render (RECOMENDADO - GRATUITO)

1. **Crie uma conta em**: https://render.com

2. **Faça upload do código**:
   - New > Web Service
   - Build and deploy from a Git repository
   - Connect GitHub ou GitLab

3. **Configure** (já está tudo no render.yaml):
   - Name: `fitness-scheduler`
   - Runtime: Node
   - Build: `npm install && npx prisma generate && npm run build`
   - Start: `npm run start`

4. **Deploy automático!**

**URL Final**: https://fitness-scheduler.onrender.com

---

### Opção 3: Deploy com Railway (RÁPIDO)

1. **Crie uma conta em**: https://railway.app

2. **Deploy via CLI**:
```bash
# Se não tem o CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway up
```

3. **Ou via GitHub**:
   - New Project > Deploy from GitHub repo
   - Selecione este repositório
   - Deploy automático!

**URL Final**: https://fitness-scheduler.up.railway.app

---

## 🎯 Deploy Manual em VPS

Se você tem um servidor (DigitalOcean, AWS EC2, etc):

```bash
# No servidor
git clone [seu-repo]
cd fitness-scheduler
npm install
npm run build

# Instalar PM2 para manter rodando
npm install -g pm2
pm2 start npm --name "fitness" -- start
pm2 save
pm2 startup
```

---

## 📱 URLs e Credenciais

### URLs da Aplicação
- **Home**: /
- **Login**: /login
- **Teste**: /test
- **Dashboard Trainer**: /dashboard/trainer
- **Dashboard Cliente**: /dashboard/client

### Credenciais de Teste
- **Trainer**: test-trainer@fitness.com / 123456
- **Cliente**: test-client@fitness.com / 123456

---

## ⚙️ Variáveis de Ambiente (Produção)

Adicione estas no painel do serviço de deploy:

```env
NODE_ENV=production
DATABASE_URL=file:./dev.db
JWT_SECRET=fitness-scheduler-jwt-super-secure-secret-key-production-32-chars
NEXTAUTH_SECRET=[gere um random]
PORT=3000
```

---

## 🔧 Problemas Comuns

### Build falha no deploy
```bash
# Adicione ao package.json scripts:
"build": "prisma generate && next build"
"postinstall": "prisma generate"
```

### Banco de dados não funciona
- Use PostgreSQL em produção (Supabase, Neon.tech)
- Ou mantenha SQLite para testes

### Porta não disponível
- Render/Railway configuram automaticamente
- Em VPS, use `PORT=3001` ou outra disponível

---

## ✅ Checklist de Deploy

- [ ] Build local funcionando (`npm run build`)
- [ ] Teste local em produção (`npm run start`)
- [ ] Escolha plataforma de deploy
- [ ] Configure variáveis de ambiente
- [ ] Faça o deploy
- [ ] Teste a aplicação online
- [ ] Configure domínio customizado (opcional)

---

## 🎉 Pronto!

Seu Fitness Scheduler está pronto para produção. Escolha uma das opções acima e faça o deploy em menos de 5 minutos!