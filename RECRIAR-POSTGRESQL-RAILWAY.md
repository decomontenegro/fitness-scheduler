# 🔄 Como Recriar PostgreSQL no Railway do Zero

## 📋 Passos Manuais no Railway Dashboard

### 1. Acesse o Railway
- Vá para: https://railway.app
- Faça login com sua conta

### 2. Entre no Projeto
- Clique no projeto `fitness-scheduler`

### 3. Remova o Banco Antigo (se existir)
- Se houver um serviço PostgreSQL com problemas:
  - Clique no serviço `Postgres`
  - Clique nos 3 pontos (⋮) no canto superior direito
  - Selecione `Remove Service`
  - Confirme a remoção

### 4. Adicione Novo PostgreSQL
- Clique no botão `+ New` (canto superior direito)
- Selecione `Database`
- Escolha `Add PostgreSQL`
- Aguarde cerca de 30 segundos para criar

### 5. Obtenha a Connection String
- Clique no serviço `Postgres` recém-criado
- Vá na aba `Variables`
- Procure por `DATABASE_URL`
- Clique no ícone de copiar 📋

### 6. Configure as Variáveis
- Ainda no Railway, clique no serviço `fitness-scheduler` (não no Postgres)
- Vá na aba `Variables`
- Adicione/Atualize:
  - `DATABASE_URL` = (cole a URL que você copiou)
  - `DATABASE_PUBLIC_URL` = (cole a mesma URL)

## 🚀 Execução Automática

Depois de criar o PostgreSQL no Railway, execute:

```bash
cd "/Users/andremontenegro/agendamento claude code/fitness-scheduler"
./setup-railway-postgres.sh
```

O script vai:
1. Pedir a DATABASE_URL que você copiou
2. Atualizar todos os arquivos .env
3. Configurar o schema para PostgreSQL
4. Criar as tabelas no banco
5. Popular com dados de teste
6. Fazer deploy no Railway
7. Reiniciar o servidor local

## ✅ Resultado Final

Após executar o script, você terá:

- **Local funcionando**: http://localhost:3000
- **Production funcionando**: https://fitness-scheduler-production.up.railway.app

### Credenciais de Teste:
- **Trainer**: trainer@test.com / 123456
- **Client**: client@test.com / 123456

## 🆘 Se Algo Der Errado

Se houver algum erro durante o processo:

1. **Verifique se o PostgreSQL foi criado** no Railway dashboard
2. **Confirme que a DATABASE_URL** está correta
3. **Tente executar manualmente**:
   ```bash
   # Atualizar schema
   npx prisma db push
   
   # Popular banco
   npx tsx prisma/seed-production.ts
   
   # Deploy
   railway up
   ```

## 📝 Notas Importantes

- O banco PostgreSQL do Railway é **gratuito** por 500 horas/mês
- A URL do banco muda quando você recria o serviço
- Sempre faça backup dos dados importantes antes de recriar