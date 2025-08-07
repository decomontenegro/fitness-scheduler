import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@fitnessscheduler.com';
const FROM_NAME = process.env.FROM_NAME || 'Fitness Scheduler';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Create transporter
const transporter = nodemailer.createTransporter({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465, // true for 465, false for other ports
  auth: SMTP_USER && SMTP_PASS ? {
    user: SMTP_USER,
    pass: SMTP_PASS,
  } : undefined,
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Skip email in development if no SMTP configured
    if (process.env.NODE_ENV === 'development' && (!SMTP_USER || !SMTP_PASS)) {
      console.log('📧 Email would be sent in production:');
      console.log('To:', options.to);
      console.log('Subject:', options.subject);
      console.log('Text:', options.text || 'HTML content provided');
      return true;
    }

    await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
}

export function generatePasswordResetEmail(email: string, token: string, userName: string): EmailOptions {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;
  
  return {
    to: email,
    subject: 'Redefinir Senha - Fitness Scheduler',
    text: `
Olá ${userName},

Você solicitou a redefinição de senha para sua conta no Fitness Scheduler.

Clique no link abaixo para redefinir sua senha:
${resetUrl}

Este link expira em 1 hora.

Se você não solicitou esta redefinição, ignore este email.

Atenciosamente,
Equipe Fitness Scheduler
    `.trim(),
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redefinir Senha</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f3f4f6;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 32px 24px;
      text-align: center;
    }
    .content {
      padding: 32px 24px;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      padding: 16px 32px;
      border-radius: 8px;
      font-weight: 600;
      margin: 24px 0;
      text-align: center;
    }
    .warning {
      background-color: #fef3c7;
      border: 1px solid #f59e0b;
      color: #92400e;
      padding: 16px;
      border-radius: 6px;
      margin: 24px 0;
    }
    .footer {
      background-color: #f9fafb;
      padding: 24px;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 28px;">🏋️ Fitness Scheduler</h1>
      <p style="margin: 8px 0 0 0; opacity: 0.9;">Redefinição de Senha</p>
    </div>
    
    <div class="content">
      <h2 style="color: #1f2937; margin-bottom: 16px;">Olá ${userName}!</h2>
      
      <p style="color: #4b5563; line-height: 1.6; margin-bottom: 24px;">
        Você solicitou a redefinição de senha para sua conta no Fitness Scheduler.
        Clique no botão abaixo para criar uma nova senha:
      </p>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${resetUrl}" class="button">Redefinir Senha</a>
      </div>
      
      <div class="warning">
        <strong>⏰ Importante:</strong> Este link expira em <strong>1 hora</strong> por motivos de segurança.
      </div>
      
      <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">
        Se você não conseguir clicar no botão, copie e cole o link abaixo no seu navegador:<br>
        <span style="word-break: break-all; color: #4f46e5;">${resetUrl}</span>
      </p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
      
      <p style="color: #6b7280; font-size: 14px;">
        Se você não solicitou esta redefinição, pode ignorar este email com segurança.
        Sua conta permanecerá protegida.
      </p>
    </div>
    
    <div class="footer">
      <p style="margin: 0;">
        Este email foi enviado pelo <strong>Fitness Scheduler</strong><br>
        <span style="color: #9ca3af;">Sistema de agendamento fitness</span>
      </p>
    </div>
  </div>
</body>
</html>
    `.trim(),
  };
}

export function generateWelcomeEmail(email: string, userName: string, userRole: string): EmailOptions {
  const dashboardUrl = `${APP_URL}/dashboard/${userRole.toLowerCase()}`;
  
  return {
    to: email,
    subject: 'Bem-vindo ao Fitness Scheduler! 🏋️',
    text: `
Olá ${userName}!

Seja bem-vindo ao Fitness Scheduler!

Sua conta foi criada com sucesso como ${userRole === 'TRAINER' ? 'Personal Trainer' : 'Cliente'}.

Acesse seu dashboard em: ${dashboardUrl}

Aproveite nossa plataforma para ${userRole === 'TRAINER' ? 'gerenciar seus clientes e horários' : 'agendar seus treinos'}.

Atenciosamente,
Equipe Fitness Scheduler
    `.trim(),
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bem-vindo ao Fitness Scheduler</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f3f4f6;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 32px 24px;
      text-align: center;
    }
    .content {
      padding: 32px 24px;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      text-decoration: none;
      padding: 16px 32px;
      border-radius: 8px;
      font-weight: 600;
      margin: 24px 0;
      text-align: center;
    }
    .feature {
      display: flex;
      align-items: flex-start;
      margin: 16px 0;
      padding: 12px;
      background-color: #f0fdf4;
      border-radius: 6px;
    }
    .footer {
      background-color: #f9fafb;
      padding: 24px;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 32px;">🏋️ Fitness Scheduler</h1>
      <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 18px;">Bem-vindo!</p>
    </div>
    
    <div class="content">
      <h2 style="color: #1f2937; margin-bottom: 16px;">Olá ${userName}! 👋</h2>
      
      <p style="color: #4b5563; line-height: 1.6; margin-bottom: 24px;">
        Seja bem-vindo ao <strong>Fitness Scheduler</strong>! Sua conta foi criada com sucesso 
        como <strong>${userRole === 'TRAINER' ? 'Personal Trainer' : 'Cliente'}</strong>.
      </p>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${dashboardUrl}" class="button">Acessar Dashboard</a>
      </div>
      
      <h3 style="color: #1f2937; margin: 32px 0 16px 0;">
        ${userRole === 'TRAINER' ? '🎯 Como Personal Trainer, você pode:' : '💪 Como Cliente, você pode:'}
      </h3>
      
      ${userRole === 'TRAINER' ? `
        <div class="feature">
          <span style="margin-right: 12px; font-size: 20px;">📅</span>
          <div>
            <strong>Gerenciar sua agenda</strong><br>
            <span style="color: #6b7280;">Configure horários e disponibilidade</span>
          </div>
        </div>
        
        <div class="feature">
          <span style="margin-right: 12px; font-size: 20px;">👥</span>
          <div>
            <strong>Acompanhar clientes</strong><br>
            <span style="color: #6b7280;">Visualize agendamentos e histórico</span>
          </div>
        </div>
        
        <div class="feature">
          <span style="margin-right: 12px; font-size: 20px;">💰</span>
          <div>
            <strong>Definir serviços e preços</strong><br>
            <span style="color: #6b7280;">Configure seus serviços e valores</span>
          </div>
        </div>
      ` : `
        <div class="feature">
          <span style="margin-right: 12px; font-size: 20px;">🔍</span>
          <div>
            <strong>Encontrar Personal Trainers</strong><br>
            <span style="color: #6b7280;">Busque profissionais qualificados</span>
          </div>
        </div>
        
        <div class="feature">
          <span style="margin-right: 12px; font-size: 20px;">📅</span>
          <div>
            <strong>Agendar treinos</strong><br>
            <span style="color: #6b7280;">Marque sessões nos horários disponíveis</span>
          </div>
        </div>
        
        <div class="feature">
          <span style="margin-right: 12px; font-size: 20px;">📊</span>
          <div>
            <strong>Acompanhar progresso</strong><br>
            <span style="color: #6b7280;">Veja seu histórico de treinos</span>
          </div>
        </div>
      `}
    </div>
    
    <div class="footer">
      <p style="margin: 0 0 8px 0;">
        <strong>Fitness Scheduler</strong> - Conectando pessoas ao fitness
      </p>
      <p style="margin: 0; color: #9ca3af;">
        Dúvidas? Responda este email e nossa equipe te ajudará!
      </p>
    </div>
  </div>
</body>
</html>
    `.trim(),
  };
}