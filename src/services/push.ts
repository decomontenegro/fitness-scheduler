import webpush from 'web-push';
import { prisma } from '@/lib/prisma';

interface PushNotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  data?: any;
}

interface PushResponse {
  success: boolean;
  error?: string;
}

class PushNotificationService {
  constructor() {
    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
      console.warn('VAPID keys not configured - push notifications disabled');
      return;
    }

    webpush.setVapidDetails(
      `mailto:${process.env.VAPID_EMAIL || 'admin@fitnessscheduler.com'}`,
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
  }

  async sendToUser(userId: string, notification: PushNotificationData): Promise<PushResponse> {
    try {
      // Get user's push subscriptions
      const subscriptions = await prisma.pushSubscription.findMany({
        where: {
          userId,
          isActive: true
        }
      });

      if (subscriptions.length === 0) {
        return { success: false, error: 'No active subscriptions found' };
      }

      const promises = subscriptions.map(sub => this.sendToSubscription(sub, notification));
      const results = await Promise.allSettled(promises);

      // Check if at least one succeeded
      const hasSuccess = results.some(result => 
        result.status === 'fulfilled' && result.value.success
      );

      return { success: hasSuccess };

    } catch (error: any) {
      console.error('Push notification error:', error);
      return { success: false, error: error.message };
    }
  }

  private async sendToSubscription(
    subscription: any,
    notification: PushNotificationData
  ): Promise<PushResponse> {
    try {
      const pushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth
        }
      };

      const payload = JSON.stringify({
        title: notification.title,
        body: notification.body,
        icon: notification.icon || '/favicon.ico',
        badge: notification.badge || '/favicon.ico',
        url: notification.url,
        data: notification.data
      });

      await webpush.sendNotification(pushSubscription, payload);

      // Log successful push
      await this.logPushNotification({
        recipient: subscription.endpoint,
        title: notification.title,
        message: notification.body,
        status: 'sent'
      });

      return { success: true };

    } catch (error: any) {
      console.error('Push send error:', error);

      // Handle invalid subscriptions
      if (error.statusCode === 410 || error.statusCode === 404) {
        await this.removeInvalidSubscription(subscription.id);
      }

      // Log failed push
      await this.logPushNotification({
        recipient: subscription.endpoint,
        title: notification.title,
        message: notification.body,
        status: 'failed',
        errorMessage: error.message
      });

      return { success: false, error: error.message };
    }
  }

  async saveSubscription(userId: string, subscription: any, userAgent?: string): Promise<boolean> {
    try {
      await prisma.pushSubscription.upsert({
        where: {
          endpoint: subscription.endpoint
        },
        update: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          userAgent,
          isActive: true
        },
        create: {
          userId,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          userAgent,
          isActive: true
        }
      });

      return true;
    } catch (error) {
      console.error('Error saving push subscription:', error);
      return false;
    }
  }

  async removeSubscription(endpoint: string): Promise<boolean> {
    try {
      await prisma.pushSubscription.update({
        where: { endpoint },
        data: { isActive: false }
      });

      return true;
    } catch (error) {
      console.error('Error removing push subscription:', error);
      return false;
    }
  }

  private async removeInvalidSubscription(subscriptionId: string): Promise<void> {
    try {
      await prisma.pushSubscription.update({
        where: { id: subscriptionId },
        data: { isActive: false }
      });
    } catch (error) {
      console.error('Error removing invalid subscription:', error);
    }
  }

  private async logPushNotification(data: {
    recipient: string;
    title: string;
    message: string;
    status: string;
    errorMessage?: string;
  }) {
    try {
      await prisma.notificationLog.create({
        data: {
          type: 'push',
          recipient: data.recipient,
          subject: data.title,
          message: data.message,
          status: data.status,
          errorMessage: data.errorMessage
        }
      });
    } catch (error) {
      console.error('Failed to log push notification:', error);
    }
  }

  // Pre-built notification templates
  async sendAppointmentConfirmation(
    userId: string,
    data: {
      trainerName: string;
      serviceName: string;
      date: string;
      time: string;
      appointmentId: string;
    }
  ) {
    return this.sendToUser(userId, {
      title: '✅ Agendamento Confirmado',
      body: `Treino com ${data.trainerName} em ${data.date} às ${data.time}`,
      icon: '/icons/appointment.png',
      url: `/appointments/${data.appointmentId}`,
      data: {
        type: 'appointment',
        appointmentId: data.appointmentId
      }
    });
  }

  async sendAppointmentReminder(
    userId: string,
    data: {
      trainerName: string;
      time: string;
      hours: number;
      appointmentId: string;
    }
  ) {
    const timeText = data.hours >= 24 ? 'amanhã' : `em ${data.hours}h`;
    
    return this.sendToUser(userId, {
      title: '⏰ Lembrete de Treino',
      body: `Seu treino com ${data.trainerName} é ${timeText} às ${data.time}`,
      icon: '/icons/reminder.png',
      url: `/appointments/${data.appointmentId}`,
      data: {
        type: 'reminder',
        appointmentId: data.appointmentId
      }
    });
  }

  async sendNewMessage(
    userId: string,
    data: {
      senderName: string;
      message: string;
      messageId: string;
    }
  ) {
    return this.sendToUser(userId, {
      title: '💬 Nova mensagem',
      body: `${data.senderName}: ${data.message.substring(0, 100)}${data.message.length > 100 ? '...' : ''}`,
      icon: '/icons/message.png',
      url: '/messages',
      data: {
        type: 'message',
        messageId: data.messageId
      }
    });
  }

  async sendPaymentConfirmation(
    userId: string,
    data: {
      amount: string;
      serviceName: string;
      appointmentId: string;
    }
  ) {
    return this.sendToUser(userId, {
      title: '💳 Pagamento Confirmado',
      body: `Pagamento de R$ ${data.amount} para ${data.serviceName} foi confirmado`,
      icon: '/icons/payment.png',
      url: `/appointments/${data.appointmentId}`,
      data: {
        type: 'payment',
        appointmentId: data.appointmentId
      }
    });
  }

  async sendAppointmentCancellation(
    userId: string,
    data: {
      trainerName: string;
      date: string;
      time: string;
      reason?: string;
    }
  ) {
    return this.sendToUser(userId, {
      title: '❌ Agendamento Cancelado',
      body: `Treino com ${data.trainerName} em ${data.date} às ${data.time} foi cancelado`,
      icon: '/icons/cancel.png',
      url: '/appointments',
      data: {
        type: 'cancellation',
        reason: data.reason
      }
    });
  }

  async sendGeneralNotification(
    userId: string,
    data: {
      title: string;
      message: string;
      url?: string;
    }
  ) {
    return this.sendToUser(userId, {
      title: data.title,
      body: data.message,
      icon: '/icons/notification.png',
      url: data.url || '/',
      data: {
        type: 'general'
      }
    });
  }

  // Check if user has push notifications enabled
  async isPushEnabled(userId: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { pushNotifications: true }
      });

      return user?.pushNotifications ?? false;
    } catch (error) {
      console.error('Error checking push notification status:', error);
      return false;
    }
  }

  // Get user's active subscriptions count
  async getActiveSubscriptionsCount(userId: string): Promise<number> {
    try {
      const count = await prisma.pushSubscription.count({
        where: {
          userId,
          isActive: true
        }
      });

      return count;
    } catch (error) {
      console.error('Error getting subscriptions count:', error);
      return 0;
    }
  }
}

export const pushNotificationService = new PushNotificationService();