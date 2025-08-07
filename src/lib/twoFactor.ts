import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { prisma } from './prisma';
import { encrypt, decrypt, logAuditEvent } from './auth';

const APP_NAME = process.env.APP_NAME || 'Fitness Scheduler';

export interface TwoFactorSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

// Generate backup codes
export function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    codes.push(code);
  }
  return codes;
}

// Setup 2FA for a user
export async function setupTwoFactor(userId: string): Promise<TwoFactorSetup> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true, twoFactorEnabled: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (user.twoFactorEnabled) {
    throw new Error('Two-factor authentication is already enabled');
  }

  // Generate secret
  const secret = speakeasy.generateSecret({
    name: `${APP_NAME} (${user.email})`,
    issuer: APP_NAME,
    length: 32,
  });

  // Generate QR code
  const qrCodeUrl = speakeasy.otpauthURL({
    secret: secret.ascii,
    label: `${APP_NAME}:${user.email}`,
    issuer: APP_NAME,
    encoding: 'ascii',
  });

  const qrCode = await QRCode.toDataURL(qrCodeUrl);

  // Generate backup codes
  const backupCodes = generateBackupCodes();

  // Store encrypted secret and backup codes (not enabled yet)
  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorSecret: encrypt(secret.base32),
      backupCodes: encrypt(JSON.stringify(backupCodes)),
    },
  });

  return {
    secret: secret.base32,
    qrCode,
    backupCodes,
  };
}

// Verify 2FA token and enable 2FA
export async function verifyAndEnable2FA(
  userId: string,
  token: string,
  ipAddress?: string,
  userAgent?: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { 
      id: true,
      email: true,
      twoFactorSecret: true, 
      twoFactorEnabled: true 
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (user.twoFactorEnabled) {
    throw new Error('Two-factor authentication is already enabled');
  }

  if (!user.twoFactorSecret) {
    throw new Error('Two-factor authentication not set up. Please set up 2FA first.');
  }

  // Decrypt secret
  const decryptedSecret = decrypt(user.twoFactorSecret);

  // Verify token
  const verified = speakeasy.totp.verify({
    secret: decryptedSecret,
    encoding: 'base32',
    token,
    window: 2, // Allow 2 time steps tolerance
  });

  if (!verified) {
    await logAuditEvent({
      userId,
      action: '2fa_verification_failed',
      ipAddress,
      userAgent,
      success: false,
      errorMessage: 'Invalid 2FA token during setup',
    });
    return false;
  }

  // Enable 2FA
  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorEnabled: true,
    },
  });

  await logAuditEvent({
    userId,
    action: '2fa_enabled',
    ipAddress,
    userAgent,
    success: true,
  });

  return true;
}

// Verify 2FA token for login
export async function verify2FAToken(
  userId: string,
  token: string,
  ipAddress?: string,
  userAgent?: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { 
      id: true,
      email: true,
      twoFactorSecret: true, 
      twoFactorEnabled: true,
      backupCodes: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (!user.twoFactorEnabled || !user.twoFactorSecret) {
    throw new Error('Two-factor authentication is not enabled');
  }

  // Check if it's a backup code first
  if (user.backupCodes && token.length === 6 && /^[A-Z0-9]+$/.test(token)) {
    const backupCodes = JSON.parse(decrypt(user.backupCodes));
    const codeIndex = backupCodes.indexOf(token);
    
    if (codeIndex !== -1) {
      // Remove used backup code
      backupCodes.splice(codeIndex, 1);
      await prisma.user.update({
        where: { id: userId },
        data: {
          backupCodes: encrypt(JSON.stringify(backupCodes)),
        },
      });

      await logAuditEvent({
        userId,
        action: '2fa_backup_code_used',
        ipAddress,
        userAgent,
        success: true,
      });

      return true;
    }
  }

  // Verify TOTP token
  const decryptedSecret = decrypt(user.twoFactorSecret);
  const verified = speakeasy.totp.verify({
    secret: decryptedSecret,
    encoding: 'base32',
    token,
    window: 2,
  });

  await logAuditEvent({
    userId,
    action: verified ? '2fa_verification_success' : '2fa_verification_failed',
    ipAddress,
    userAgent,
    success: verified,
    errorMessage: verified ? undefined : 'Invalid 2FA token',
  });

  return verified;
}

// Disable 2FA
export async function disable2FA(
  userId: string,
  password: string,
  ipAddress?: string,
  userAgent?: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { 
      id: true,
      email: true,
      password: true,
      twoFactorEnabled: true 
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (!user.twoFactorEnabled) {
    throw new Error('Two-factor authentication is not enabled');
  }

  // Verify password
  const { verifyPassword } = await import('./auth');
  const isValidPassword = await verifyPassword(password, user.password);
  
  if (!isValidPassword) {
    await logAuditEvent({
      userId,
      action: '2fa_disable_failed',
      ipAddress,
      userAgent,
      success: false,
      errorMessage: 'Invalid password',
    });
    throw new Error('Invalid password');
  }

  // Disable 2FA
  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      backupCodes: null,
    },
  });

  await logAuditEvent({
    userId,
    action: '2fa_disabled',
    ipAddress,
    userAgent,
    success: true,
  });

  return true;
}

// Get remaining backup codes count
export async function getBackupCodesCount(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { backupCodes: true, twoFactorEnabled: true },
  });

  if (!user || !user.twoFactorEnabled || !user.backupCodes) {
    return 0;
  }

  const backupCodes = JSON.parse(decrypt(user.backupCodes));
  return backupCodes.length;
}

// Regenerate backup codes
export async function regenerateBackupCodes(
  userId: string,
  password: string,
  ipAddress?: string,
  userAgent?: string
): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { 
      id: true,
      password: true,
      twoFactorEnabled: true 
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (!user.twoFactorEnabled) {
    throw new Error('Two-factor authentication is not enabled');
  }

  // Verify password
  const { verifyPassword } = await import('./auth');
  const isValidPassword = await verifyPassword(password, user.password);
  
  if (!isValidPassword) {
    await logAuditEvent({
      userId,
      action: 'backup_codes_regenerate_failed',
      ipAddress,
      userAgent,
      success: false,
      errorMessage: 'Invalid password',
    });
    throw new Error('Invalid password');
  }

  // Generate new backup codes
  const newBackupCodes = generateBackupCodes();

  await prisma.user.update({
    where: { id: userId },
    data: {
      backupCodes: encrypt(JSON.stringify(newBackupCodes)),
    },
  });

  await logAuditEvent({
    userId,
    action: 'backup_codes_regenerated',
    ipAddress,
    userAgent,
    success: true,
  });

  return newBackupCodes;
}