# Sistema de Notificações e Comunicação - Fitness Scheduler

## 📋 Visão Geral

Este documento detalha o sistema completo de notificações e comunicação implementado no Fitness Scheduler, incluindo todos os canais de comunicação, APIs, componentes e configurações necessárias.

## 🚀 Recursos Implementados

### 1. Notificações em Tempo Real
- ✅ Socket.io para comunicação bidirecional
- ✅ Context API para gerenciamento de estado
- ✅ Toast notifications com react-hot-toast
- ✅ Badges de contagem de notificações não lidas
- ✅ Som de notificação configurável
- ✅ Reconexão automática

### 2. Integração WhatsApp Business API
- ✅ Twilio WhatsApp Business API
- ✅ Templates profissionais de mensagem
- ✅ Confirmação de agendamento
- ✅ Lembretes 24h e 1h antes
- ✅ Cancelamentos e reagendamentos
- ✅ Mensagens de boas-vindas
- ✅ Sistema de opt-in/opt-out
- ✅ Formatação automática de números

### 3. Sistema de Email Transacional
- ✅ Resend API para envio
- ✅ Templates HTML profissionais responsivos
- ✅ Emails de boas-vindas
- ✅ Confirmações de agendamento
- ✅ Lembretes de treino
- ✅ Recibos de pagamento
- ✅ Links de unsubscribe obrigatórios
- ✅ Tracking de abertura

### 4. Push Notifications (Browser)
- ✅ Service Worker para PWA
- ✅ Permissões de notificação
- ✅ Notificações mesmo com app fechado
- ✅ Ícones e imagens personalizadas
- ✅ Click actions para abrir app
- ✅ VAPID keys para autenticação

### 5. Central de Notificações
- ✅ Página /notifications com histórico
- ✅ Marcar como lida/não lida
- ✅ Filtros por tipo de notificação
- ✅ Configurações de preferências
- ✅ Silenciar temporariamente
- ✅ Interface responsiva

### 6. Sistema de SMS
- ✅ Twilio SMS API
- ✅ Apenas para urgências
- ✅ Lembretes de última hora
- ✅ Confirmação por SMS
- ✅ Respostas automáticas (webhook)
- ✅ Validação de números telefônicos

## 🏗️ Arquitetura do Sistema

### Estrutura de Diretórios
```
src/
├── contexts/
│   └── NotificationContext.tsx      # Context para notificações
├── services/
│   ├── email.ts                     # Serviço de email
│   ├── whatsapp.ts                  # Serviço WhatsApp
│   ├── sms.ts                       # Serviço SMS
│   ├── push.ts                      # Serviço push notifications
│   └── notificationScheduler.ts     # Agendador de notificações
├── app/
│   ├── api/
│   │   ├── notifications/           # APIs de notificações
│   │   ├── push/                    # APIs push notifications
│   │   └── users/preferences/       # APIs de preferências
│   ├── notifications/               # Página central
│   └── unsubscribe/                 # Página de cancelamento
├── components/
│   └── common/
│       └── NotificationIcon.tsx     # Ícone de notificações
├── lib/
│   └── socket.ts                    # Configuração Socket.io
└── scripts/
    └── testNotifications.ts         # Testes automatizados
```

### Banco de Dados
```sql
-- Novos campos em User
whatsapp                  String?
emailNotifications        Boolean @default(true)
smsNotifications         Boolean @default(false)  
whatsappNotifications    Boolean @default(true)
pushNotifications        Boolean @default(true)

-- Novas tabelas
PushSubscription         # Inscrições push notifications
NotificationTemplate     # Templates reutilizáveis
NotificationLog          # Log de notificações enviadas
```

## 📡 Canais de Comunicação

### 1. Email (Resend)
**Casos de uso:**
- Boas-vindas
- Confirmações de agendamento
- Lembretes de treino
- Recibos de pagamento
- Newsletter mensal

**Templates disponíveis:**
- Welcome Email
- Appointment Confirmation
- Appointment Reminder (24h/1h)
- Payment Receipt
- Newsletter

### 2. WhatsApp (Twilio)
**Casos de uso:**
- Confirmações imediatas
- Lembretes importantes
- Cancelamentos
- Reagendamentos
- Comunicação direta

**Templates disponíveis:**
```javascript
// Confirmação de agendamento
WhatsAppService.templates.appointmentConfirmation

// Lembretes
WhatsAppService.templates.appointmentReminder24h
WhatsAppService.templates.appointmentReminder1h

// Cancelamento
WhatsAppService.templates.appointmentCancellation

// Reagendamento
WhatsAppService.templates.appointmentRescheduled
```

### 3. SMS (Twilio)
**Casos de uso:**
- Urgências e lembretes de última hora
- Confirmações críticas
- Mudanças de horário imediatas

**Limitações:**
- Apenas para situações urgentes
- Mensagens curtas (160 caracteres)
- Opt-in obrigatório

### 4. Push Notifications
**Casos de uso:**
- Notificações em tempo real
- Funcionamento offline
- Engajamento do usuário

**Recursos:**
- Service Worker integrado
- VAPID authentication
- Click actions customizáveis
- Ícones e badges personalizados

### 5. In-App Notifications
**Casos de uso:**
- Histórico de notificações
- Notificações não críticas
- Comunicação interna

## 🔧 Configuração e Instalação

### 1. Variáveis de Ambiente
```bash
# Copie o arquivo de exemplo
cp .env.example .env.local

# Configure as seguintes variáveis:
RESEND_API_KEY="your-resend-api-key"
TWILIO_ACCOUNT_SID="your-twilio-account-sid"
TWILIO_AUTH_TOKEN="your-twilio-auth-token" 
TWILIO_PHONE_NUMBER="your-twilio-phone-number"
TWILIO_WHATSAPP_NUMBER="your-twilio-whatsapp-number"
VAPID_PUBLIC_KEY="your-vapid-public-key"
VAPID_PRIVATE_KEY="your-vapid-private-key"
```

### 2. Configuração VAPID (Push Notifications)
```bash
# Gerar chaves VAPID
npx web-push generate-vapid-keys

# Adicionar as chaves no .env.local
```

### 3. Executar Migrações
```bash
npx prisma migrate dev --name "add_notification_system"
npx prisma generate
```

### 4. Inicializar Serviços
```javascript
// Em server.js ou similar
import { socketManager } from '@/lib/socket';
import { notificationScheduler } from '@/services/notificationScheduler';

// Inicializar Socket.io
socketManager.initialize(server);

// Agendador já inicializa automaticamente
```

## 📊 Testes e Validação

### Executar Testes Automatizados
```bash
# Executar suite de testes completa
npx tsx src/scripts/testNotifications.ts

# Testes específicos podem ser executados individualmente
```

### Validações Incluídas
- ✅ Envio de emails (Resend)
- ✅ Mensagens WhatsApp (Twilio)
- ✅ SMS (Twilio)
- ✅ Push notifications (VAPID)
- ✅ Notificações in-app (Database)
- ✅ Agendador de notificações
- ✅ Validação de números telefônicos
- ✅ Tempos de resposta
- ✅ Limpeza automática de dados de teste

## 🎯 APIs Disponíveis

### Notificações
- `GET /api/notifications` - Listar notificações do usuário
- `POST /api/notifications` - Criar notificação (admin/trainer)
- `PATCH /api/notifications/[id]/read` - Marcar como lida
- `PATCH /api/notifications/read-all` - Marcar todas como lidas

### Push Notifications
- `POST /api/push/subscribe` - Inscrever para push notifications
- `POST /api/push/unsubscribe` - Cancelar inscrição

### Preferências
- `GET /api/users/preferences` - Obter preferências de notificação
- `PATCH /api/users/preferences` - Atualizar preferências

### Unsubscribe
- `GET /api/unsubscribe/validate` - Validar link de cancelamento
- `POST /api/unsubscribe/update` - Atualizar preferências via link

## 🔄 Fluxos de Notificação

### 1. Novo Agendamento
1. Cliente agenda treino
2. Sistema cria notificação in-app
3. Envia confirmação por email
4. Envia confirmação por WhatsApp (se habilitado)
5. Envia push notification
6. Registra logs de envio

### 2. Lembretes Automáticos
1. Cron job verifica agendamentos (a cada 5 minutos)
2. Identifica treinos nas próximas 24h e 1h
3. Envia lembretes pelos canais habilitados:
   - Email para lembretes 24h
   - WhatsApp para lembretes 24h e 1h
   - Push notification em tempo real
   - SMS apenas para lembretes 1h (urgente)

### 3. Cancelamento
1. Usuário/trainer cancela agendamento
2. Sistema cria notificação in-app
3. Envia notificação de cancelamento
4. Atualiza todas as partes envolvidas
5. Remove lembretes agendados

## 🛡️ Segurança e Privacidade

### Conformidade LGPD/GDPR
- ✅ Opt-in explícito para todos os canais
- ✅ Links de unsubscribe em todos os emails
- ✅ Página de gerenciamento de preferências
- ✅ Logs de auditoria para mudanças
- ✅ Criptografia de dados sensíveis

### Rate Limiting
- Implementado rate limiting nas APIs
- Controle de frequência de envio por usuário
- Prevenção de spam

### Validação
- Validação de dados de entrada
- Sanitização de mensagens
- Validação de números telefônicos
- Verificação de permissões

## 📈 Monitoramento e Analytics

### Métricas Rastreadas
- Taxa de entrega por canal
- Taxa de abertura (email)
- Tempo de resposta dos serviços
- Erros e falhas por tipo
- Opt-out rate por canal

### Logs
- Todos os envios são registrados em `NotificationLog`
- Status de entrega rastreado
- Mensagens de erro capturadas
- Métricas de performance

## 🚀 Próximos Passos

### Melhorias Futuras
- [ ] Integração com Google Analytics
- [ ] A/B testing para templates
- [ ] Notificações personalizadas por horário
- [ ] Integração com calendários externos
- [ ] Rich media em push notifications
- [ ] Chatbot WhatsApp automatizado
- [ ] Relatórios de engagement

### Otimizações
- [ ] Cache de templates
- [ ] Batch sending para emails
- [ ] Retry policies mais inteligentes
- [ ] Compressão de imagens em push notifications

## 🆘 Troubleshooting

### Problemas Comuns

**1. Emails não chegam**
- Verificar configuração Resend
- Validar domínio de envio
- Checar spam folder
- Verificar rate limits

**2. WhatsApp não funciona**
- Validar credenciais Twilio
- Verificar formato do número
- Confirmar template aprovado
- Checar limite de sandbox

**3. Push notifications não aparecem**
- Verificar permissões do browser
- Validar VAPID keys
- Verificar Service Worker
- Testar em modo incógnito

**4. SMS falhando**
- Validar número Twilio
- Verificar saldo da conta
- Confirmar formato do destinatário
- Checar região permitida

## 📞 Suporte

Para problemas técnicos:
1. Consulte os logs em `NotificationLog`
2. Execute o script de testes
3. Verifique configurações das APIs
4. Consulte documentação dos provedores

---

**Implementado por:** Claude Code SuperClaude  
**Data:** Agosto 2025  
**Versão:** 1.0.0