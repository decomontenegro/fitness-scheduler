import twilio from 'twilio';
import { prisma } from '@/lib/prisma';

interface SMSMessage {
  to: string;
  message: string;
}

interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

class SMSService {
  private client: twilio.Twilio;

  constructor() {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      console.warn('Twilio SMS credentials not configured');
      return;
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

  async sendSMS({ to, message }: SMSMessage): Promise<SMSResponse> {
    try {
      if (!this.client) {
        throw new Error('SMS service not configured');
      }

      const phoneNumber = this.formatPhoneNumber(to);

      const response = await this.client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });

      // Log the SMS
      await this.logSMS({
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
      console.error('SMS send error:', error);

      // Log the error
      await this.logSMS({
        recipient: to,
        message,
        status: 'failed',
        errorMessage: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  private async logSMS(data: {
    recipient: string;
    message: string;
    status: string;
    externalId?: string;
    errorMessage?: string;
  }) {
    try {
      await prisma.notificationLog.create({
        data: {
          type: 'sms',
          recipient: data.recipient,
          message: data.message,
          status: data.status,
          externalId: data.externalId,
          errorMessage: data.errorMessage
        }
      });
    } catch (error) {
      console.error('Failed to log SMS:', error);
    }
  }

  // Pre-defined SMS templates (shorter versions for SMS)
  static templates = {
    urgentReminder: (data: { clientName: string; time: string; trainerName: string }) =>
      `🚨 LEMBRETE URGENTE: ${data.clientName}, seu treino com ${data.trainerName} é às ${data.time}! Não falte! - Fitness Scheduler`,

    lastMinuteChange: (data: { clientName: string; newTime: string; trainerName: string }) =>
      `⚠️ MUDANÇA: ${data.clientName}, seu treino foi reagendado para ${data.newTime} com ${data.trainerName}. Confirme o recebimento! - Fitness Scheduler`,

    emergencyCancel: (data: { clientName: string; trainerName: string; date: string; reason: string }) =>
      `❌ CANCELAMENTO: ${data.clientName}, treino com ${data.trainerName} em ${data.date} foi cancelado. Motivo: ${data.reason}. Entre em contato! - Fitness Scheduler`,

    confirmAttendance: (data: { clientName: string; time: string }) =>
      `📞 ${data.clientName}, confirme sua presença no treino das ${data.time}. Responda S para SIM ou N para NÃO. - Fitness Scheduler`,

    paymentReminder: (data: { clientName: string; amount: string; dueDate: string }) =>
      `💳 ${data.clientName}, lembrete: pagamento de R$ ${data.amount} vence em ${data.dueDate}. Acesse o app para pagar. - Fitness Scheduler`,

    welcomeSMS: (data: { clientName: string }) =>
      `🎉 Bem-vindo ${data.clientName}! Sua conta no Fitness Scheduler está pronta. Baixe o app e agende seu primeiro treino! - Fitness Scheduler`
  };

  // Quick send methods for urgent scenarios
  async sendUrgentReminder(
    phone: string,
    data: {
      clientName: string;
      time: string;
      trainerName: string;
    }
  ) {
    const message = SMSService.templates.urgentReminder(data);
    return this.sendSMS({ to: phone, message });
  }

  async sendLastMinuteChange(
    phone: string,
    data: {
      clientName: string;
      newTime: string;
      trainerName: string;
    }
  ) {
    const message = SMSService.templates.lastMinuteChange(data);
    return this.sendSMS({ to: phone, message });
  }

  async sendEmergencyCancel(
    phone: string,
    data: {
      clientName: string;
      trainerName: string;
      date: string;
      reason: string;
    }
  ) {
    const message = SMSService.templates.emergencyCancel(data);
    return this.sendSMS({ to: phone, message });
  }

  async sendConfirmAttendance(
    phone: string,
    data: {
      clientName: string;
      time: string;
    }
  ) {
    const message = SMSService.templates.confirmAttendance(data);
    return this.sendSMS({ to: phone, message });
  }

  async sendPaymentReminder(
    phone: string,
    data: {
      clientName: string;
      amount: string;
      dueDate: string;
    }
  ) {
    const message = SMSService.templates.paymentReminder(data);
    return this.sendSMS({ to: phone, message });
  }

  async sendWelcomeSMS(
    phone: string,
    data: {
      clientName: string;
    }
  ) {
    const message = SMSService.templates.welcomeSMS(data);
    return this.sendSMS({ to: phone, message });
  }

  // Check user opt-in status
  async checkOptInStatus(userId: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { smsNotifications: true }
      });

      return user?.smsNotifications ?? false;
    } catch (error) {
      console.error('Error checking SMS opt-in:', error);
      return false;
    }
  }

  // Update opt-in status
  async updateOptInStatus(userId: string, optIn: boolean): Promise<boolean> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { smsNotifications: optIn }
      });

      return true;
    } catch (error) {
      console.error('Error updating SMS opt-in:', error);
      return false;
    }
  }

  // Handle SMS replies (webhook)
  async handleSMSReply(from: string, body: string): Promise<void> {
    try {
      const phoneNumber = this.formatPhoneNumber(from);
      
      // Find user by phone number
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { phone: phoneNumber },
            { whatsapp: phoneNumber }
          ]
        }
      });

      if (!user) {
        console.log('SMS reply from unknown number:', phoneNumber);
        return;
      }

      const reply = body.trim().toUpperCase();

      // Handle confirmation replies
      if (reply === 'S' || reply === 'SIM' || reply === 'Y' || reply === 'YES') {
        // Handle positive confirmation
        console.log(`User ${user.name} confirmed via SMS`);
        // You can add logic here to update appointment status
      } else if (reply === 'N' || reply === 'NAO' || reply === 'NÃO' || reply === 'NO') {
        // Handle negative confirmation
        console.log(`User ${user.name} declined via SMS`);
        // You can add logic here to handle cancellation
      } else if (reply.includes('STOP') || reply.includes('PARAR')) {
        // Handle opt-out
        await this.updateOptInStatus(user.id, false);
        await this.sendSMS({
          to: phoneNumber,
          message: 'Você foi removido da lista de SMS. Para reativar, acesse o app. - Fitness Scheduler'
        });
      }

    } catch (error) {
      console.error('Error handling SMS reply:', error);
    }
  }

  // Validate phone number format
  isValidPhoneNumber(phone: string): boolean {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 13;
  }
}

export const smsService = new SMSService();