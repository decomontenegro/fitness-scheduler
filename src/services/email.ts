import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';

interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

class EmailService {
  private resend: Resend | null;

  constructor() {
    // Email service is optional - will work without it but emails will not be sent
    if (process.env.RESEND_API_KEY) {
      this.resend = new Resend(process.env.RESEND_API_KEY);
    } else {
      this.resend = null;
      console.warn('Email service not configured - emails will not be sent');
    }
  }

  async sendEmail({ to, subject, html, text }: EmailData): Promise<EmailResponse> {
    // If email service is not configured, just log and return success
    if (!this.resend) {
      console.log('Email would be sent to:', to, 'Subject:', subject);
      return { success: true, messageId: 'mock-' + Date.now() };
    }

    try {
      const response = await this.resend.emails.send({
        from: process.env.FROM_EMAIL || 'Fitness Scheduler <noreply@fitnessscheduler.com>',
        to: [to],
        subject,
        html,
        text
      });

      // Log the email
      await this.logEmail({
        recipient: to,
        subject,
        message: html,
        status: 'sent',
        externalId: response.data?.id
      });

      return {
        success: true,
        messageId: response.data?.id
      };

    } catch (error: any) {
      console.error('Email send error:', error);

      // Log the error
      await this.logEmail({
        recipient: to,
        subject,
        message: html,
        status: 'failed',
        errorMessage: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  private async logEmail(data: {
    recipient: string;
    subject: string;
    message: string;
    status: string;
    externalId?: string;
    errorMessage?: string;
  }) {
    try {
      await prisma.notificationLog.create({
        data: {
          type: 'email',
          recipient: data.recipient,
          subject: data.subject,
          message: data.message,
          status: data.status,
          externalId: data.externalId,
          errorMessage: data.errorMessage
        }
      });
    } catch (error) {
      console.error('Failed to log email:', error);
    }
  }

  // Welcome email template
  generateWelcomeEmail(data: {
    clientName: string;
    loginUrl: string;
    unsubscribeUrl: string;
  }): { html: string; text: string } {
    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Bem-vindo ao Fitness Scheduler</title>
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center; padding: 2rem; }
              .content { padding: 2rem; }
              .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 1rem 0; }
              .footer { background: #f8f9fa; padding: 1rem; text-align: center; font-size: 0.875rem; color: #666; }
              .logo { font-size: 2rem; font-weight: bold; }
          </style>
      </head>
      <body>
          <div class="header">
              <div class="logo">💪 Fitness Scheduler</div>
              <h1>Bem-vindo, ${data.clientName}!</h1>
          </div>
          
          <div class="content">
              <h2>🎉 Sua conta foi criada com sucesso!</h2>
              
              <p>Estamos muito felizes em tê-lo conosco! Com o Fitness Scheduler, você pode:</p>
              
              <ul>
                  <li>🗓️ Agendar treinos facilmente</li>
                  <li>💬 Conversar diretamente com seus instrutores</li>
                  <li>📊 Acompanhar seu progresso</li>
                  <li>💳 Gerenciar pagamentos de forma segura</li>
                  <li>⏰ Receber lembretes automáticos</li>
              </ul>
              
              <p>Para começar sua jornada fitness, acesse sua conta:</p>
              
              <a href="${data.loginUrl}" class="button">Acessar Minha Conta</a>
              
              <h3>📱 Dicas para aproveitar ao máximo:</h3>
              <ul>
                  <li>Complete seu perfil com suas metas e histórico médico</li>
                  <li>Explore os diferentes serviços disponíveis</li>
                  <li>Configure suas preferências de notificação</li>
                  <li>Agende seu primeiro treino!</li>
              </ul>
              
              <p>Se tiver qualquer dúvida, nossa equipe está sempre disponível para ajudar.</p>
              
              <p><strong>Vamos começar essa jornada juntos! 💪</strong></p>
          </div>
          
          <div class="footer">
              <p>Este email foi enviado para você porque criou uma conta no Fitness Scheduler.</p>
              <p>Se não deseja mais receber emails, <a href="${data.unsubscribeUrl}">clique aqui</a>.</p>
              <p>&copy; 2025 Fitness Scheduler. Todos os direitos reservados.</p>
          </div>
      </body>
      </html>
    `;

    const text = `
      Bem-vindo ao Fitness Scheduler, ${data.clientName}!
      
      Sua conta foi criada com sucesso!
      
      Com o Fitness Scheduler, você pode:
      - Agendar treinos facilmente
      - Conversar diretamente com seus instrutores
      - Acompanhar seu progresso
      - Gerenciar pagamentos de forma segura
      - Receber lembretes automáticos
      
      Acesse sua conta: ${data.loginUrl}
      
      Dicas para começar:
      - Complete seu perfil com suas metas
      - Explore os serviços disponíveis
      - Configure suas notificações
      - Agende seu primeiro treino!
      
      Vamos começar essa jornada juntos!
      
      Para cancelar o recebimento destes emails: ${data.unsubscribeUrl}
    `;

    return { html, text };
  }

  // Appointment confirmation email template
  generateAppointmentConfirmationEmail(data: {
    clientName: string;
    trainerName: string;
    serviceName: string;
    date: string;
    time: string;
    location: string;
    price: string;
    appointmentUrl: string;
    unsubscribeUrl: string;
  }): { html: string; text: string } {
    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Agendamento Confirmado</title>
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
              .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; text-align: center; padding: 2rem; }
              .content { padding: 2rem; }
              .appointment-card { background: #f8f9fa; padding: 1.5rem; border-radius: 8px; border-left: 4px solid #10b981; margin: 1rem 0; }
              .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 1rem 0; }
              .footer { background: #f8f9fa; padding: 1rem; text-align: center; font-size: 0.875rem; color: #666; }
              .highlight { color: #10b981; font-weight: bold; }
          </style>
      </head>
      <body>
          <div class="header">
              <h1>✅ Agendamento Confirmado!</h1>
          </div>
          
          <div class="content">
              <p>Olá <strong>${data.clientName}</strong>,</p>
              
              <p>Seu treino foi confirmado com sucesso! Aqui estão os detalhes:</p>
              
              <div class="appointment-card">
                  <h3>📅 Detalhes do Agendamento</h3>
                  <p><strong>Serviço:</strong> ${data.serviceName}</p>
                  <p><strong>Instrutor:</strong> ${data.trainerName}</p>
                  <p><strong>Data:</strong> <span class="highlight">${data.date}</span></p>
                  <p><strong>Horário:</strong> <span class="highlight">${data.time}</span></p>
                  <p><strong>Local:</strong> ${data.location}</p>
                  <p><strong>Valor:</strong> <span class="highlight">R$ ${data.price}</span></p>
              </div>
              
              <h3>📝 Preparação para o Treino:</h3>
              <ul>
                  <li>Chegue 10 minutos antes do horário</li>
                  <li>Traga roupas confortáveis para exercícios</li>
                  <li>Não se esqueça da toalha e garrafa d'água</li>
                  <li>Informe sobre qualquer problema de saúde</li>
              </ul>
              
              <p>Para ver mais detalhes ou fazer alterações:</p>
              <a href="${data.appointmentUrl}" class="button">Ver Agendamento</a>
              
              <p><strong>🤝 Política de Cancelamento:</strong><br>
              Cancelamentos podem ser feitos até 2 horas antes do horário agendado sem cobrança.</p>
              
              <p>Estamos ansiosos para seu treino! 💪</p>
          </div>
          
          <div class="footer">
              <p>Fitness Scheduler - Sua jornada fitness começa aqui!</p>
              <p><a href="${data.unsubscribeUrl}">Cancelar recebimento de emails</a></p>
          </div>
      </body>
      </html>
    `;

    const text = `
      Agendamento Confirmado!
      
      Olá ${data.clientName},
      
      Seu treino foi confirmado:
      
      Serviço: ${data.serviceName}
      Instrutor: ${data.trainerName}
      Data: ${data.date}
      Horário: ${data.time}
      Local: ${data.location}
      Valor: R$ ${data.price}
      
      Preparação:
      - Chegue 10 minutos antes
      - Traga roupas confortáveis
      - Toalha e garrafa d'água
      - Informe problemas de saúde
      
      Ver detalhes: ${data.appointmentUrl}
      
      Política: Cancelamentos até 2h antes sem cobrança.
      
      Para cancelar emails: ${data.unsubscribeUrl}
    `;

    return { html, text };
  }

  // Reminder email template
  generateReminderEmail(data: {
    clientName: string;
    trainerName: string;
    serviceName: string;
    date: string;
    time: string;
    location: string;
    appointmentUrl: string;
    hours: number;
    unsubscribeUrl: string;
  }): { html: string; text: string } {
    const isNextDay = data.hours >= 24;
    const timeText = isNextDay ? 'amanhã' : `em ${data.hours}h`;
    
    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Lembrete de Treino</title>
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
              .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; text-align: center; padding: 2rem; }
              .content { padding: 2rem; }
              .reminder-card { background: #fef3c7; padding: 1.5rem; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 1rem 0; }
              .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 1rem 0; }
              .footer { background: #f8f9fa; padding: 1rem; text-align: center; font-size: 0.875rem; color: #666; }
              .highlight { color: #d97706; font-weight: bold; }
          </style>
      </head>
      <body>
          <div class="header">
              <h1>⏰ Lembrete de Treino!</h1>
          </div>
          
          <div class="content">
              <p>Olá <strong>${data.clientName}</strong>,</p>
              
              <p>Não se esqueça! Você tem um treino agendado <strong>${timeText}</strong>:</p>
              
              <div class="reminder-card">
                  <h3>🏋️ Detalhes do Treino</h3>
                  <p><strong>Serviço:</strong> ${data.serviceName}</p>
                  <p><strong>Instrutor:</strong> ${data.trainerName}</p>
                  <p><strong>Data:</strong> <span class="highlight">${data.date}</span></p>
                  <p><strong>Horário:</strong> <span class="highlight">${data.time}</span></p>
                  <p><strong>Local:</strong> ${data.location}</p>
              </div>
              
              ${isNextDay ? `
              <h3>📋 Checklist para Amanhã:</h3>
              <ul>
                  <li>☑️ Separar roupas de treino</li>
                  <li>☑️ Preparar mochila com toalha e água</li>
                  <li>☑️ Confirmar transporte</li>
                  <li>☑️ Ter uma boa noite de sono</li>
              </ul>
              ` : `
              <h3>⚡ Preparação Rápida:</h3>
              <ul>
                  <li>🏃‍♂️ Vista suas roupas de treino</li>
                  <li>💧 Pegue sua garrafa d'água</li>
                  <li>🏃‍♂️ Saia de casa com antecedência</li>
              </ul>
              `}
              
              <a href="${data.appointmentUrl}" class="button">Ver Detalhes Completos</a>
              
              <p><strong>Precisa cancelar?</strong> Faça isso com pelo menos 2 horas de antecedência.</p>
              
              <p>Nos vemos ${timeText}! 💪</p>
          </div>
          
          <div class="footer">
              <p>Fitness Scheduler - Mantendo você motivado!</p>
              <p><a href="${data.unsubscribeUrl}">Cancelar lembretes</a></p>
          </div>
      </body>
      </html>
    `;

    const text = `
      Lembrete de Treino!
      
      Olá ${data.clientName},
      
      Você tem treino ${timeText}:
      
      ${data.serviceName}
      ${data.trainerName}
      ${data.date} às ${data.time}
      Local: ${data.location}
      
      ${isNextDay ? 'Prepare-se hoje à noite!' : 'Prepare-se agora!'}
      
      Ver detalhes: ${data.appointmentUrl}
      
      Cancelamentos até 2h antes.
      
      Para cancelar lembretes: ${data.unsubscribeUrl}
    `;

    return { html, text };
  }

  // Quick send methods
  async sendWelcomeEmail(email: string, clientName: string) {
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL}/login`;
    const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe`;
    
    const { html, text } = this.generateWelcomeEmail({
      clientName,
      loginUrl,
      unsubscribeUrl
    });

    return this.sendEmail({
      to: email,
      subject: '🎉 Bem-vindo ao Fitness Scheduler!',
      html,
      text
    });
  }

  async sendAppointmentConfirmation(
    email: string,
    data: {
      clientName: string;
      trainerName: string;
      serviceName: string;
      date: string;
      time: string;
      location: string;
      price: string;
      appointmentId: string;
    }
  ) {
    const appointmentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/appointments/${data.appointmentId}`;
    const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe`;
    
    const { html, text } = this.generateAppointmentConfirmationEmail({
      ...data,
      appointmentUrl,
      unsubscribeUrl
    });

    return this.sendEmail({
      to: email,
      subject: '✅ Agendamento Confirmado - Fitness Scheduler',
      html,
      text
    });
  }

  async sendReminder(
    email: string,
    data: {
      clientName: string;
      trainerName: string;
      serviceName: string;
      date: string;
      time: string;
      location: string;
      appointmentId: string;
      hours: number;
    }
  ) {
    const appointmentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/appointments/${data.appointmentId}`;
    const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe`;
    
    const { html, text } = this.generateReminderEmail({
      ...data,
      appointmentUrl,
      unsubscribeUrl
    });

    const subject = data.hours >= 24 
      ? '⏰ Lembrete: Treino Amanhã - Fitness Scheduler'
      : `⏰ Lembrete: Treino em ${data.hours}h - Fitness Scheduler`;

    return this.sendEmail({
      to: email,
      subject,
      html,
      text
    });
  }
}

export const emailService = new EmailService();