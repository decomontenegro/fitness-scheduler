#!/usr/bin/env tsx

/**
 * Comprehensive Notification System Test Suite
 * 
 * This script tests all notification channels:
 * - Email (Resend)
 * - WhatsApp (Twilio)
 * - SMS (Twilio)
 * - Push Notifications (Web Push)
 * - In-app Notifications (Database)
 * 
 * Usage: npx tsx src/scripts/testNotifications.ts
 */

import { emailService } from '../services/email';
import { whatsappService } from '../services/whatsapp';
import { smsService } from '../services/sms';
import { pushNotificationService } from '../services/push';
import { notificationScheduler } from '../services/notificationScheduler';
import { prisma } from '../lib/prisma';

interface TestResult {
  service: string;
  test: string;
  success: boolean;
  error?: string;
  duration?: number;
}

class NotificationTester {
  private results: TestResult[] = [];
  private testUserId = 'test-user-id';
  private testEmail = 'test@example.com';
  private testPhone = '+5511999999999';

  constructor() {
    console.log('🧪 Iniciando testes do sistema de notificações...\n');
  }

  private addResult(service: string, test: string, success: boolean, error?: string, duration?: number) {
    this.results.push({ service, test, success, error, duration });
    const status = success ? '✅' : '❌';
    const time = duration ? ` (${duration}ms)` : '';
    console.log(`${status} ${service}: ${test}${time}`);
    if (error) {
      console.log(`   Error: ${error}`);
    }
  }

  private async measureTime<T>(fn: () => Promise<T>): Promise<[T, number]> {
    const start = Date.now();
    try {
      const result = await fn();
      return [result, Date.now() - start];
    } catch (error) {
      return [error as T, Date.now() - start];
    }
  }

  async testEmailService() {
    console.log('\n📧 Testando serviço de Email...');

    // Test 1: Welcome Email
    try {
      const [result, duration] = await this.measureTime(() =>
        emailService.sendWelcomeEmail(this.testEmail, 'João Teste')
      );

      this.addResult('Email', 'Welcome Email', result.success, result.error, duration);
    } catch (error: any) {
      this.addResult('Email', 'Welcome Email', false, error.message);
    }

    // Test 2: Appointment Confirmation
    try {
      const [result, duration] = await this.measureTime(() =>
        emailService.sendAppointmentConfirmation(this.testEmail, {
          clientName: 'João Teste',
          trainerName: 'Carlos Silva',
          serviceName: 'Personal Training',
          date: '15/08/2025',
          time: '14:00',
          location: 'Academia Fitness',
          price: '150.00',
          appointmentId: 'test-appointment-123'
        })
      );

      this.addResult('Email', 'Appointment Confirmation', result.success, result.error, duration);
    } catch (error: any) {
      this.addResult('Email', 'Appointment Confirmation', false, error.message);
    }

    // Test 3: Reminder Email
    try {
      const [result, duration] = await this.measureTime(() =>
        emailService.sendReminder(this.testEmail, {
          clientName: 'João Teste',
          trainerName: 'Carlos Silva',
          serviceName: 'Personal Training',
          date: '16/08/2025',
          time: '14:00',
          location: 'Academia Fitness',
          appointmentId: 'test-appointment-123',
          hours: 24
        })
      );

      this.addResult('Email', '24h Reminder', result.success, result.error, duration);
    } catch (error: any) {
      this.addResult('Email', '24h Reminder', false, error.message);
    }
  }

  async testWhatsAppService() {
    console.log('\n📱 Testando serviço de WhatsApp...');

    // Test 1: Welcome Message
    try {
      const [result, duration] = await this.measureTime(() =>
        whatsappService.sendWelcome(this.testPhone, { clientName: 'João Teste' })
      );

      this.addResult('WhatsApp', 'Welcome Message', result.success, result.error, duration);
    } catch (error: any) {
      this.addResult('WhatsApp', 'Welcome Message', false, error.message);
    }

    // Test 2: Appointment Confirmation
    try {
      const [result, duration] = await this.measureTime(() =>
        whatsappService.sendAppointmentConfirmation(this.testPhone, {
          clientName: 'João Teste',
          date: '15/08/2025',
          time: '14:00',
          trainerName: 'Carlos Silva',
          serviceName: 'Personal Training',
          location: 'Academia Fitness'
        })
      );

      this.addResult('WhatsApp', 'Appointment Confirmation', result.success, result.error, duration);
    } catch (error: any) {
      this.addResult('WhatsApp', 'Appointment Confirmation', false, error.message);
    }

    // Test 3: 24h Reminder
    try {
      const [result, duration] = await this.measureTime(() =>
        whatsappService.sendReminder24h(this.testPhone, {
          clientName: 'João Teste',
          date: '16/08/2025',
          time: '14:00',
          trainerName: 'Carlos Silva'
        })
      );

      this.addResult('WhatsApp', '24h Reminder', result.success, result.error, duration);
    } catch (error: any) {
      this.addResult('WhatsApp', '24h Reminder', false, error.message);
    }
  }

  async testSMSService() {
    console.log('\n📲 Testando serviço de SMS...');

    // Test 1: Welcome SMS
    try {
      const [result, duration] = await this.measureTime(() =>
        smsService.sendWelcomeSMS(this.testPhone, { clientName: 'João Teste' })
      );

      this.addResult('SMS', 'Welcome SMS', result.success, result.error, duration);
    } catch (error: any) {
      this.addResult('SMS', 'Welcome SMS', false, error.message);
    }

    // Test 2: Urgent Reminder
    try {
      const [result, duration] = await this.measureTime(() =>
        smsService.sendUrgentReminder(this.testPhone, {
          clientName: 'João Teste',
          time: '14:00',
          trainerName: 'Carlos Silva'
        })
      );

      this.addResult('SMS', 'Urgent Reminder', result.success, result.error, duration);
    } catch (error: any) {
      this.addResult('SMS', 'Urgent Reminder', false, error.message);
    }

    // Test 3: Phone Number Validation
    const validNumbers = [
      '+5511999999999',
      '11999999999',
      '(11) 99999-9999',
      '+55 11 99999-9999'
    ];

    const invalidNumbers = [
      'invalid-phone',
      '123',
      '',
      '+1234567890123456'
    ];

    let validCount = 0;
    let invalidCount = 0;

    validNumbers.forEach(phone => {
      if (smsService.isValidPhoneNumber(phone)) {
        validCount++;
      }
    });

    invalidNumbers.forEach(phone => {
      if (!smsService.isValidPhoneNumber(phone)) {
        invalidCount++;
      }
    });

    const phoneValidationSuccess = validCount === validNumbers.length && invalidCount === invalidNumbers.length;
    this.addResult('SMS', 'Phone Validation', phoneValidationSuccess, 
      phoneValidationSuccess ? undefined : 'Some phone validations failed');
  }

  async testPushNotificationService() {
    console.log('\n🔔 Testando serviço de Push Notifications...');

    // Test 1: Save Subscription (mock)
    try {
      const mockSubscription = {
        endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint',
        keys: {
          p256dh: 'test-p256dh-key',
          auth: 'test-auth-key'
        }
      };

      const [result, duration] = await this.measureTime(() =>
        pushNotificationService.saveSubscription(this.testUserId, mockSubscription, 'Test Browser')
      );

      this.addResult('Push', 'Save Subscription', result, result ? undefined : 'Failed to save subscription', duration);
    } catch (error: any) {
      this.addResult('Push', 'Save Subscription', false, error.message);
    }

    // Test 2: Check Push Enabled Status
    try {
      const [result, duration] = await this.measureTime(() =>
        pushNotificationService.isPushEnabled(this.testUserId)
      );

      this.addResult('Push', 'Check Push Status', typeof result === 'boolean', undefined, duration);
    } catch (error: any) {
      this.addResult('Push', 'Check Push Status', false, error.message);
    }

    // Test 3: Get Subscriptions Count
    try {
      const [result, duration] = await this.measureTime(() =>
        pushNotificationService.getActiveSubscriptionsCount(this.testUserId)
      );

      this.addResult('Push', 'Get Subscriptions Count', typeof result === 'number', undefined, duration);
    } catch (error: any) {
      this.addResult('Push', 'Get Subscriptions Count', false, error.message);
    }
  }

  async testDatabaseNotifications() {
    console.log('\n🗄️ Testando notificações no banco de dados...');

    // Test 1: Create In-App Notification
    try {
      const [result, duration] = await this.measureTime(async () => {
        return await prisma.notification.create({
          data: {
            userId: this.testUserId,
            title: 'Teste de Notificação',
            message: 'Esta é uma notificação de teste para validar o sistema.',
            type: 'reminder',
            metadata: {
              test: true,
              timestamp: new Date().toISOString()
            }
          }
        });
      });

      this.addResult('Database', 'Create Notification', !!result.id, undefined, duration);
    } catch (error: any) {
      this.addResult('Database', 'Create Notification', false, error.message);
    }

    // Test 2: Create Notification Log
    try {
      const [result, duration] = await this.measureTime(async () => {
        return await prisma.notificationLog.create({
          data: {
            type: 'email',
            recipient: this.testEmail,
            subject: 'Teste de Log',
            message: 'Log de teste para validação do sistema',
            status: 'sent',
            metadata: {
              test: true
            }
          }
        });
      });

      this.addResult('Database', 'Create Log Entry', !!result.id, undefined, duration);
    } catch (error: any) {
      this.addResult('Database', 'Create Log Entry', false, error.message);
    }

    // Test 3: Query Notifications
    try {
      const [result, duration] = await this.measureTime(async () => {
        return await prisma.notification.findMany({
          where: { userId: this.testUserId },
          take: 10
        });
      });

      this.addResult('Database', 'Query Notifications', Array.isArray(result), undefined, duration);
    } catch (error: any) {
      this.addResult('Database', 'Query Notifications', false, error.message);
    }
  }

  async testScheduler() {
    console.log('\n⏰ Testando agendador de notificações...');

    // Test 1: Send Welcome Notifications (integration test)
    try {
      const [, duration] = await this.measureTime(() =>
        notificationScheduler.sendWelcomeNotifications(this.testUserId)
      );

      this.addResult('Scheduler', 'Send Welcome Notifications', true, undefined, duration);
    } catch (error: any) {
      this.addResult('Scheduler', 'Send Welcome Notifications', false, error.message);
    }
  }

  async cleanup() {
    console.log('\n🧹 Limpando dados de teste...');

    try {
      // Remove test notifications
      await prisma.notification.deleteMany({
        where: { userId: this.testUserId }
      });

      // Remove test logs
      await prisma.notificationLog.deleteMany({
        where: { 
          OR: [
            { recipient: this.testEmail },
            { recipient: this.testPhone }
          ]
        }
      });

      // Remove test push subscriptions
      await prisma.pushSubscription.deleteMany({
        where: { userId: this.testUserId }
      });

      console.log('✅ Limpeza concluída');
    } catch (error: any) {
      console.log('❌ Erro na limpeza:', error.message);
    }
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO DOS TESTES');
    console.log('='.repeat(60));

    const serviceGroups = this.results.reduce((groups, result) => {
      if (!groups[result.service]) {
        groups[result.service] = [];
      }
      groups[result.service].push(result);
      return groups;
    }, {} as Record<string, TestResult[]>);

    Object.entries(serviceGroups).forEach(([service, results]) => {
      const passed = results.filter(r => r.success).length;
      const total = results.length;
      const avgDuration = results
        .filter(r => r.duration)
        .reduce((sum, r) => sum + (r.duration || 0), 0) / results.filter(r => r.duration).length;

      console.log(`\n${service}:`);
      console.log(`  ✅ Aprovados: ${passed}/${total}`);
      if (avgDuration) {
        console.log(`  ⏱️  Tempo médio: ${Math.round(avgDuration)}ms`);
      }

      const failed = results.filter(r => !r.success);
      if (failed.length > 0) {
        console.log('  ❌ Falhas:');
        failed.forEach(f => {
          console.log(`    - ${f.test}: ${f.error || 'Unknown error'}`);
        });
      }
    });

    const totalPassed = this.results.filter(r => r.success).length;
    const totalTests = this.results.length;
    const successRate = Math.round((totalPassed / totalTests) * 100);

    console.log('\n' + '='.repeat(60));
    console.log(`📈 RESULTADO FINAL: ${totalPassed}/${totalTests} (${successRate}%)`);
    console.log('='.repeat(60));

    if (successRate >= 80) {
      console.log('🎉 Sistema de notificações está funcionando bem!');
    } else if (successRate >= 60) {
      console.log('⚠️  Sistema de notificações precisa de ajustes.');
    } else {
      console.log('🚨 Sistema de notificações precisa de correções urgentes.');
    }
  }

  async runAllTests() {
    const startTime = Date.now();

    try {
      await this.testDatabaseNotifications();
      await this.testEmailService();
      await this.testWhatsAppService();
      await this.testSMSService();
      await this.testPushNotificationService();
      await this.testScheduler();
    } catch (error: any) {
      console.error('❌ Erro crítico durante os testes:', error.message);
    }

    await this.cleanup();

    const totalTime = Date.now() - startTime;
    console.log(`\n⏱️  Tempo total: ${Math.round(totalTime / 1000)}s`);

    this.printSummary();
  }
}

// Execute tests if this file is run directly
if (require.main === module) {
  const tester = new NotificationTester();
  tester.runAllTests().catch(console.error);
}

export { NotificationTester };