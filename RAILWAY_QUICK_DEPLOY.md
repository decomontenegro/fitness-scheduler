# 🚂 Railway Deploy - Checklist Rápido

## ✨ Deploy em 5 Minutos!

### ☐ **Passo 1: Login**
```bash
railway login
```
> 🌐 Uma janela do browser abrirá para autenticação

---

### ☐ **Passo 2: Criar Projeto**
```bash
cd /Users/andremontenegro/agendamento\ claude\ code/fitness-scheduler
railway init
```
> 📝 Escolha: **Empty Project**  
> 📝 Nome: **fitness-scheduler**

---

### ☐ **Passo 3: Adicionar Banco**
```bash
railway add
```
> 🗄️ Escolha: **PostgreSQL**

---

### ☐ **Passo 4: Configurar Variáveis**
```bash
railway open
```

> 📋 No dashboard, vá em **Variables** e cole:

```env
NODE_ENV=production
JWT_SECRET=fitness-scheduler-jwt-super-secure-production-key-2024
JWT_EXPIRES_IN=1h
NEXTAUTH_SECRET=fitness-scheduler-nextauth-production-secret-2024
ENCRYPTION_KEY=fitness-scheduler-encryption-production-key-32
```

---

### ☐ **Passo 5: Deploy!**
```bash
railway up
```
> ⏱️ Aguarde 3-5 minutos...

---

### ☐ **Passo 6: Obter URL**
```bash
railway domain
```
> 🎉 Sua URL: `https://fitness-scheduler-xxxx.up.railway.app`

---

## 🎊 **Pronto! App Online!**

### 🔑 **Testar com:**
- **Trainer**: trainer@test.com / 123456
- **Cliente**: client@test.com / 123456

### 📊 **Comandos Úteis:**
```bash
railway logs      # Ver logs
railway status    # Ver status
railway open      # Dashboard
```

---

## 🆘 **Problemas?**

### Build falhou?
```bash
railway logs
npm run build  # Testar localmente
```

### Banco não conecta?
```bash
railway run npx prisma db push
railway run npm run seed
```

### Variáveis não funcionam?
```bash
railway variables  # Listar
railway variables set KEY=value  # Adicionar
```

---

## 💡 **Script Automatizado**

Use nosso script helper:
```bash
./deploy-railway.sh
```

Ele guiará você passo a passo! 🚀