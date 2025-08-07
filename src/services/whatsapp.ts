import twilio from 'twilio';
import { prisma } from '@/lib/prisma';

interface WhatsAppMessage {
  to: string;
  template: string;
  variables: Record<string, string>;
}

interface WhatsAppResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

class WhatsAppService {
  private client: twilio.Twilio;

  constructor() {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      throw new Error('Twilio credentials not configured');
    }

    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }

  private formatPhoneNumber(phone: string): string {
    // Remove non-numeric characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Add Brazil country code if not present
    if (cleaned.length === 11 && cleaned.startsWith('11')) {
      return `+55${cleaned}`;
    } else if (cleaned.length === 10) {
      return `+5511${cleaned}`;
    } else if (cleaned.startsWith('55')) {
      return `+${cleaned}`;
    }
    
    return `+55${cleaned}`;
  }

  private replaceVariables(template: string, variables: Record<string, string>): string {
    let message = template;
    
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      message = message.replace(regex, value);
    });
    
    return message;
  }

  async sendMessage({ to, template, variables }: WhatsAppMessage): Promise<WhatsAppResponse> {
    try {
      const phoneNumber = this.formatPhoneNumber(to);
      const message = this.replaceVariables(template, variables);

      const response = await this.client.messages.create({
        body: message,
        from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
        to: `whatsapp:${phoneNumber}`
      });

      // Log the message
      await this.logMessage({
        recipient: phoneNumber,
        message,
        status: 'sent',
        externalId: response.sid
      });

      return {
        success: true,
        messageId: response.sid
      };

    } catch (error: any) {
      console.error('WhatsApp send error:', error);

      // Log the error
      await this.logMessage({
        recipient: to,
        message: template,
        status: 'failed',
        errorMessage: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  private async logMessage(data: {
    recipient: string;
    message: string;
    status: string;
    externalId?: string;
    errorMessage?: string;
  }) {
    try {
      await prisma.notificationLog.create({
        data: {
          type: 'whatsapp',
          recipient: data.recipient,
          message: data.message,
          status: data.status,
          externalId: data.externalId,
          errorMessage: data.errorMessage
        }
      });
    } catch (error) {
      console.error('Failed to log WhatsApp message:', error);
    }
  }

  // Pre-defined templates
  static templates = {
    appointmentConfirmation: `🏋️ *Agendamento Confirmado*

Olá {{clientName}}!

Seu treino foi confirmado:
📅 Data: {{date}}
⏰ Horário: {{time}}
👨‍💼 Instrutor: {{trainerName}}
💪 Serviço: {{serviceName}}

📍 Local: {{location}}

Em caso de dúvidas, entre em contato conosco.

Fitness Scheduler 💪`,

    appointmentReminder24h: `⏰ *Lembrete de Treino*

Olá {{clientName}}!

Você tem um treino agendado para AMANHÃ:
📅 {{date}} às {{time}}
👨‍💼 Com {{trainerName}}

Não se esqueça! 💪

Fitness Scheduler`,

    appointmentReminder1h: `🔔 *Seu treino é em 1 hora!*

Olá {{clientName}}!

Seu treino com {{trainerName}} começa em 1 hora.
⏰ {{time}}

Prepare-se! 🏋️‍♀️

Fitness Scheduler`,

    appointmentCancellation: `❌ *Agendamento Cancelado*

Olá {{clientName}},

Seu agendamento foi cancelado:
📅 {{date}} às {{time}}
👨‍💼 {{trainerName}}

{{reason}}

Para reagendar, acesse nosso app.

Fitness Scheduler`,

    appointmentRescheduled: `🔄 *Agendamento Reagendado*

Olá {{clientName}}!

Seu treino foi reagendado:

❌ *Horário anterior:* {{oldDate}} às {{oldTime}}
✅ *Novo horário:* {{newDate}} às {{newTime}}
👨‍💼 Instrutor: {{trainerName}}

Fitness Scheduler 💪`,

    welcome: `🎉 *Bem-vindo ao Fitness Scheduler!*

Olá {{clientName}}!

Sua conta foi criada com sucesso!
Agora você pode:
• Agendar treinos
• Conversar com instrutores
• Acompanhar seu progresso

Vamos começar sua jornada fitness! 💪

Fitness Scheduler`,

    paymentConfirmation: `💳 *Pagamento Confirmado*

Olá {{clientName}}!

Pagamento recebido:
💰 Valor: R$ {{amount}}
📅 Treino: {{date}} às {{time}}
👨‍💼 {{trainerName}}

Recibo: {{receiptUrl}}

Obrigado pela preferência!

Fitness Scheduler`
  };

  // Quick send methods for common scenarios
  async sendAppointmentConfirmation(
    phone: string,
    data: {
      clientName: string;
      date: string;
      time: string;
      trainerName: string;
      serviceName: string;
      location: string;
    }
  ) {
    return this.sendMessage({
      to: phone,
      template: WhatsAppService.templates.appointmentConfirmation,
      variables: data
    });
  }

  async sendReminder24h(
    phone: string,
    data: {
      clientName: string;
      date: string;
      time: string;
      trainerName: string;
    }
  ) {
    return this.sendMessage({
      to: phone,
      template: WhatsAppService.templates.appointmentReminder24h,
      variables: data
    });
  }

  async sendReminder1h(
    phone: string,
    data: {
      clientName: string;
      time: string;
      trainerName: string;
    }
  ) {
    return this.sendMessage({
      to: phone,
      template: WhatsAppService.templates.appointmentReminder1h,
      variables: data
    });
  }

  async sendCancellation(
    phone: string,
    data: {
      clientName: string;
      date: string;
      time: string;
      trainerName: string;
      reason: string;
    }
  ) {
    return this.sendMessage({
      to: phone,
      template: WhatsAppService.templates.appointmentCancellation,
      variables: data
    });
  }

  async sendRescheduled(
    phone: string,
    data: {
      clientName: string;
      oldDate: string;
      oldTime: string;
      newDate: string;
      newTime: string;
      trainerName: string;
    }
  ) {
    return this.sendMessage({
      to: phone,
      template: WhatsAppService.templates.appointmentRescheduled,
      variables: data
    });
  }

  async sendWelcome(
    phone: string,
    data: {
      clientName: string;
    }
  ) {
    return this.sendMessage({
      to: phone,
      template: WhatsAppService.templates.welcome,
      variables: data
    });
  }

  async sendPaymentConfirmation(
    phone: string,
    data: {
      clientName: string;
      amount: string;
      date: string;
      time: string;
      trainerName: string;
      receiptUrl: string;
    }
  ) {
    return this.sendMessage({
      to: phone,
      template: WhatsAppService.templates.paymentConfirmation,
      variables: data
    });
  }

  // Check user opt-in status
  async checkOptInStatus(userId: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { whatsappNotifications: true }
      });

      return user?.whatsappNotifications ?? false;
    } catch (error) {
      console.error('Error checking WhatsApp opt-in:', error);
      return false;
    }
  }

  // Update opt-in status
  async updateOptInStatus(userId: string, optIn: boolean): Promise<boolean> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { whatsappNotifications: optIn }
      });

      return true;
    } catch (error) {
      console.error('Error updating WhatsApp opt-in:', error);
      return false;
    }
  }
}

export const whatsappService = new WhatsAppService();