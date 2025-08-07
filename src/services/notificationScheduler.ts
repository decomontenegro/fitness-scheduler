import cron from 'node-cron';
import { prisma } from '@/lib/prisma';
import { emailService } from './email';
import { whatsappService } from './whatsapp';
import { smsService } from './sms';
import { pushNotificationService } from './push';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NotificationData {
  user: any;
  appointment: any;
  trainer: any;
  service: any;
}

class NotificationSchedulerService {
  private isSchedulerRunning = false;

  constructor() {
    this.initializeScheduler();
  }

  initializeScheduler() {
    // Run every minute to check for pending notifications
    cron.schedule('* * * * *', () => {
      if (!this.isSchedulerRunning) {
        this.processScheduledNotifications();
      }
    });

    // Run every 5 minutes for appointment reminders
    cron.schedule('*/5 * * * *', () => {
      this.checkAppointmentReminders();
    });

    // Run every hour for daily reminders
    cron.schedule('0 * * * *', () => {
      this.checkDailyReminders();
    });

    console.log('Notification scheduler initialized');
  }

  private async processScheduledNotifications() {
    this.isSchedulerRunning = true;
    
    try {
      // Process any pending notification logs that failed
      await this.retryFailedNotifications();
    } catch (error) {
      console.error('Error processing scheduled notifications:', error);
    } finally {
      this.isSchedulerRunning = false;
    }
  }

  private async checkAppointmentReminders() {
    try {
      const now = new Date();
      const in1Hour = new Date(now.getTime() + 60 * 60 * 1000);
      const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // Find appointments that need reminders
      const appointments = await prisma.appointment.findMany({
        where: {
          status: 'CONFIRMED',
          startTime: {
            gte: now,
            lte: in24Hours
          }
        },
        include: {
          client: {
            include: {
              user: true
            }
          },
          trainer: {
            include: {
              user: true
            }
          },
          service: true
        }
      });

      for (const appointment of appointments) {
        const appointmentTime = new Date(appointment.startTime);
        const timeDiff = appointmentTime.getTime() - now.getTime();
        const hoursUntil = Math.round(timeDiff / (60 * 60 * 1000));

        // Send 24h reminder
        if (hoursUntil === 24) {
          await this.sendAppointmentReminder(appointment, 24);
        }
        
        // Send 1h reminder
        if (hoursUntil === 1) {
          await this.sendAppointmentReminder(appointment, 1);
        }
      }

    } catch (error) {
      console.error('Error checking appointment reminders:', error);
    }
  }

  private async checkDailyReminders() {
    try {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

      // Find appointments for tomorrow
      const tomorrowAppointments = await prisma.appointment.findMany({
        where: {
          status: 'CONFIRMED',
          startTime: {
            gte: tomorrow,
            lt: dayAfterTomorrow
          }
        },
        include: {
          client: {
            include: {
              user: true
            }
          },
          trainer: {
            include: {
              user: true
            }
          },
          service: true
        }
      });

      // Send daily summary to clients with appointments tomorrow
      for (const appointment of tomorrowAppointments) {
        await this.sendDailySummary(appointment);
      }

    } catch (error) {
      console.error('Error checking daily reminders:', error);
    }
  }

  private async sendAppointmentReminder(appointment: any, hours: number) {
    try {
      const user = appointment.client.user;
      const trainer = appointment.trainer.user;
      const service = appointment.service;

      const appointmentData = {
        clientName: user.name,
        trainerName: trainer.name,
        serviceName: service.name,
        date: format(new Date(appointment.startTime), 'dd/MM/yyyy', { locale: ptBR }),
        time: format(new Date(appointment.startTime), 'HH:mm', { locale: ptBR }),
        location: 'Academia Fitness Scheduler', // Default location
        appointmentId: appointment.id,
        hours
      };

      // Send email reminder
      if (user.emailNotifications) {
        await emailService.sendReminder(user.email, appointmentData);
      }

      // Send WhatsApp reminder
      if (user.whatsappNotifications && user.whatsapp) {
        if (hours === 24) {
          await whatsappService.sendReminder24h(user.whatsapp, appointmentData);
        } else {
          await whatsappService.sendReminder1h(user.whatsapp, appointmentData);
        }
      }

      // Send push notification reminder
      if (user.pushNotifications) {
        await pushNotificationService.sendAppointmentReminder(user.id, {
          trainerName: trainer.name,
          time: appointmentData.time,
          hours,
          appointmentId: appointment.id
        });
      }

      // Send SMS for 1h reminder (urgent)
      if (hours === 1 && user.smsNotifications && user.phone) {
        await smsService.sendUrgentReminder(user.phone, {
          clientName: user.name,
          time: appointmentData.time,
          trainerName: trainer.name
        });
      }

      console.log(`Sent ${hours}h reminder for appointment ${appointment.id}`);

    } catch (error) {
      console.error(`Error sending ${hours}h reminder:`, error);
    }
  }

  private async sendDailySummary(appointment: any) {
    try {
      const user = appointment.client.user;
      const trainer = appointment.trainer.user;
      
      // Create in-app notification
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: 'Treino amanhã!',
          message: `Você tem treino com ${trainer.name} amanhã às ${format(new Date(appointment.startTime), 'HH:mm')}`,
          type: 'reminder',
          metadata: {
            appointmentId: appointment.id,
            type: 'daily_summary'
          }
        }
      });

      console.log(`Sent daily summary for user ${user.id}`);

    } catch (error) {
      console.error('Error sending daily summary:', error);
    }
  }

  private async retryFailedNotifications() {
    try {
      // Find failed notifications from last 24 hours
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const failedLogs = await prisma.notificationLog.findMany({
        where: {
          status: 'failed',
          createdAt: {
            gte: oneDayAgo
          }
        },
        take: 10 // Limit retries
      });

      for (const log of failedLogs) {
        try {
          // Retry based on type
          switch (log.type) {
            case 'email':
              // Implement email retry logic
              break;
            case 'whatsapp':
              // Implement WhatsApp retry logic
              break;
            case 'sms':
              // Implement SMS retry logic
              break;
            case 'push':
              // Implement push retry logic
              break;
          }
        } catch (retryError) {
          console.error(`Retry failed for log ${log.id}:`, retryError);
        }
      }

    } catch (error) {
      console.error('Error retrying failed notifications:', error);
    }
  }

  // Manual methods for immediate notifications
  async sendAppointmentConfirmation(appointmentId: string) {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          client: {
            include: {
              user: true
            }
          },
          trainer: {
            include: {
              user: true
            }
          },
          service: true
        }
      });

      if (!appointment) {
        throw new Error('Appointment not found');
      }

      const user = appointment.client.user;
      const trainer = appointment.trainer.user;
      const service = appointment.service;

      const appointmentData = {
        clientName: user.name,
        trainerName: trainer.name,
        serviceName: service.name,
        date: format(new Date(appointment.startTime), 'dd/MM/yyyy', { locale: ptBR }),
        time: format(new Date(appointment.startTime), 'HH:mm', { locale: ptBR }),
        location: 'Academia Fitness Scheduler',
        price: appointment.price.toString(),
        appointmentId: appointment.id
      };

      // Send email confirmation
      if (user.emailNotifications) {
        await emailService.sendAppointmentConfirmation(user.email, appointmentData);
      }

      // Send WhatsApp confirmation
      if (user.whatsappNotifications && user.whatsapp) {
        await whatsappService.sendAppointmentConfirmation(user.whatsapp, appointmentData);
      }

      // Send push notification
      if (user.pushNotifications) {
        await pushNotificationService.sendAppointmentConfirmation(user.id, {
          trainerName: trainer.name,
          serviceName: service.name,
          date: appointmentData.date,
          time: appointmentData.time,
          appointmentId: appointment.id
        });
      }

      // Create in-app notification
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: 'Agendamento confirmado!',
          message: `Seu treino com ${trainer.name} foi confirmado para ${appointmentData.date} às ${appointmentData.time}`,
          type: 'appointment',
          metadata: {
            appointmentId: appointment.id,
            type: 'confirmation'
          }
        }
      });

      console.log(`Sent appointment confirmation for ${appointmentId}`);

    } catch (error) {
      console.error('Error sending appointment confirmation:', error);
      throw error;
    }
  }

  async sendWelcomeNotifications(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Send welcome email
      if (user.emailNotifications) {
        await emailService.sendWelcomeEmail(user.email, user.name);
      }

      // Send welcome WhatsApp
      if (user.whatsappNotifications && user.whatsapp) {
        await whatsappService.sendWelcome(user.whatsapp, { clientName: user.name });
      }

      // Send welcome SMS
      if (user.smsNotifications && user.phone) {
        await smsService.sendWelcomeSMS(user.phone, { clientName: user.name });
      }

      // Create in-app notification
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: 'Bem-vindo ao Fitness Scheduler!',
          message: 'Sua conta foi criada com sucesso. Explore nossos serviços e agende seu primeiro treino!',
          type: 'reminder',
          metadata: {
            type: 'welcome'
          }
        }
      });

      console.log(`Sent welcome notifications for user ${userId}`);

    } catch (error) {
      console.error('Error sending welcome notifications:', error);
      throw error;
    }
  }

  async sendPaymentConfirmation(appointmentId: string) {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          client: {
            include: {
              user: true
            }
          },
          trainer: {
            include: {
              user: true
            }
          },
          service: true,
          payment: true
        }
      });

      if (!appointment || !appointment.payment) {
        throw new Error('Appointment or payment not found');
      }

      const user = appointment.client.user;
      const trainer = appointment.trainer.user;

      // Send push notification
      if (user.pushNotifications) {
        await pushNotificationService.sendPaymentConfirmation(user.id, {
          amount: appointment.payment.amount.toString(),
          serviceName: appointment.service.name,
          appointmentId: appointment.id
        });
      }

      // Create in-app notification
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: 'Pagamento confirmado!',
          message: `Pagamento de R$ ${appointment.payment.amount} foi confirmado para o treino com ${trainer.name}`,
          type: 'payment',
          metadata: {
            appointmentId: appointment.id,
            paymentId: appointment.payment.id,
            amount: appointment.payment.amount
          }
        }
      });

      console.log(`Sent payment confirmation for appointment ${appointmentId}`);

    } catch (error) {
      console.error('Error sending payment confirmation:', error);
      throw error;
    }
  }
}

export const notificationScheduler = new NotificationSchedulerService();