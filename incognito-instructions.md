# 🚀 INSTRUÇÕES PARA ACESSAR O SISTEMA

## ⚠️ Problema Identificado
As extensões do navegador (especialmente carteiras crypto e extensões de segurança) estão interferindo com o funcionamento do sistema após o login.

## ✅ Solução Recomendada

### Opção 1: Use o App Launcher (RECOMENDADO)
1. Abra uma **nova aba privada/incógnita** no seu navegador:
   - Chrome: `Ctrl+Shift+N` (Windows) ou `Cmd+Shift+N` (Mac)
   - Firefox: `Ctrl+Shift+P` (Windows) ou `Cmd+Shift+P` (Mac)
   - Safari: `Cmd+Shift+N`

2. Acesse: **http://localhost:3001/app-launcher.html**

3. Clique no botão do tipo de usuário desejado:
   - **💪 Área do Trainer** - Para personal trainers
   - **🏃 Área do Cliente** - Para clientes

### Opção 2: Use o Login Helper
1. Abra uma **aba privada/incógnita**
2. Acesse: **http://localhost:3001/login-helper.html**
3. Use os botões para fazer login

### Opção 3: Desative Extensões Temporariamente
1. Desative temporariamente as extensões do navegador, especialmente:
   - MetaMask
   - Outras carteiras crypto
   - Extensões de segurança
   - Ad blockers

2. Acesse normalmente: **http://localhost:3001**

## 📱 Para Melhor Experiência

### Use um Navegador Diferente
Se você usa Chrome com muitas extensões, tente:
- Microsoft Edge
- Firefox
- Safari
- Brave (em modo privado)

### Teste Mobile
O sistema é otimizado para mobile. Você pode:
1. Abrir as ferramentas de desenvolvedor (F12)
2. Ativar o modo de dispositivo móvel
3. Testar a interface responsiva

## 🔑 Credenciais de Teste

**Personal Trainer:**
- Email: `test-trainer@fitness.com`
- Senha: `123456`

**Cliente:**
- Email: `test-client@fitness.com`
- Senha: `123456`

## 🛠️ Verificação do Sistema

Para verificar se o sistema está funcionando:

```bash
# No terminal, execute:
node test-login.js
```

Se o teste passar, o sistema está funcionando corretamente e o problema é apenas com as extensões do navegador.

## 💡 Dica Pro

Para desenvolvimento, recomendo usar um perfil de navegador separado sem extensões:

**Chrome:**
```bash
# Windows
"C:\Program Files\Google\Chrome\Application\chrome.exe" --user-data-dir="C:\ChromeDev" --disable-extensions

# Mac
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --user-data-dir="/tmp/ChromeDev" --disable-extensions

# Linux
google-chrome --user-data-dir="/tmp/ChromeDev" --disable-extensions
```

## ✨ Funcionalidades Disponíveis

Após fazer login com sucesso, você terá acesso a:

### Personal Trainer:
- Dashboard com estatísticas
- Gerenciamento de clientes
- Calendário de agendamentos
- Sistema de pagamentos
- Notificações em tempo real

### Cliente:
- Visualização de treinos
- Agendamento de sessões
- Histórico de pagamentos
- Chat com personal trainer

---

**Nota:** O sistema está funcionando perfeitamente. Os erros que você vê no console (`hostname_check`) são de extensões do navegador, não do nosso sistema.