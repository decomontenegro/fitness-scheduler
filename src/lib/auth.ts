import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from './prisma';
import { NextRequest } from 'next/server';

// JWT Configuration - use environment variables in production, fallback for development
const JWT_SECRET = process.env.JWT_SECRET || 'fitness-scheduler-jwt-super-secure-secret-key-development-only-32-chars';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fitness-scheduler-refresh-super-secure-secret-key-development-only-32';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'fitness-scheduler-encryption-key-development-32';
const MAX_LOGIN_ATTEMPTS = parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5');
const LOCKOUT_TIME_MINUTES = parseInt(process.env.LOCKOUT_TIME_MINUTES || '15');

// Validate configuration (now hardcoded for development)
if (!JWT_SECRET || !JWT_REFRESH_SECRET || !ENCRYPTION_KEY) {
  throw new Error('Missing required JWT or encryption configuration');
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  tokenType?: 'access' | 'refresh';
  deviceId?: string;
}

export interface RefreshTokenData {
  userId: string;
  email: string;
  role: string;
  deviceId: string;
}

export interface AuditLogData {
  userId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateAccessToken(payload: TokenPayload): string {
  const accessPayload = { ...payload, tokenType: 'access' };
  return jwt.sign(accessPayload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

export function generateRefreshToken(payload: RefreshTokenData): string {
  const refreshPayload = { ...payload, tokenType: 'refresh' };
  return jwt.sign(refreshPayload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenData {
  return jwt.verify(token, JWT_REFRESH_SECRET) as RefreshTokenData;
}

// Generate secure random tokens for password reset
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Encrypt sensitive data
export function encrypt(text: string): string {
  const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

// Decrypt sensitive data
export function decrypt(encryptedText: string): string {
  const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Generate device fingerprint
export function generateDeviceId(userAgent: string, ip: string): string {
  return crypto.createHash('sha256')
    .update(userAgent + ip)
    .digest('hex')
    .substring(0, 16);
}

export async function createUser(data: {
  email: string;
  password: string;
  name: string;
  role?: string;
  phone?: string;
}, ipAddress?: string, userAgent?: string) {
  const hashedPassword = await hashPassword(data.password);
  
  const user = await prisma.user.create({
    data: {
      ...data,
      password: hashedPassword,
      role: data.role || 'CLIENT',
    },
  });

  // Create profile based on role
  if (user.role === 'TRAINER') {
    await prisma.trainerProfile.create({
      data: {
        userId: user.id,
        bio: '',
        specialties: '',
        experience: 0,
        hourlyRate: 0,
      },
    });
  } else if (user.role === 'CLIENT') {
    await prisma.clientProfile.create({
      data: {
        userId: user.id,
      },
    });
  }

  // Log user registration
  await logAuditEvent({
    userId: user.id,
    action: 'user_registered',
    ipAddress,
    userAgent,
    success: true,
    newValues: { email: user.email, role: user.role }
  });

  const { password: _, twoFactorSecret, backupCodes, ...userWithoutSensitive } = user;
  return userWithoutSensitive;
}

export async function authenticateUser(
  email: string, 
  password: string, 
  rememberMe: boolean = false,
  ipAddress?: string,
  userAgent?: string
) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  // Log failed login attempt if user not found
  if (!user) {
    await logAuditEvent({
      action: 'login_failed',
      ipAddress,
      userAgent,
      success: false,
      errorMessage: 'User not found'
    });
    throw new Error('Invalid credentials');
  }

  // Check if user is locked out
  if (user.lockoutUntil && user.lockoutUntil > new Date()) {
    await logAuditEvent({
      userId: user.id,
      action: 'login_locked',
      ipAddress,
      userAgent,
      success: false,
      errorMessage: 'Account locked due to too many failed attempts'
    });
    throw new Error('Account temporarily locked due to too many failed login attempts');
  }

  const isValid = await verifyPassword(password, user.password);
  
  if (!isValid) {
    // Increment login attempts
    const loginAttempts = (user.loginAttempts || 0) + 1;
    const lockoutUntil = loginAttempts >= MAX_LOGIN_ATTEMPTS 
      ? new Date(Date.now() + LOCKOUT_TIME_MINUTES * 60 * 1000)
      : null;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        loginAttempts,
        lockoutUntil,
      },
    });

    await logAuditEvent({
      userId: user.id,
      action: 'login_failed',
      ipAddress,
      userAgent,
      success: false,
      errorMessage: `Invalid password (attempt ${loginAttempts}/${MAX_LOGIN_ATTEMPTS})`
    });

    throw new Error('Invalid credentials');
  }

  // Reset login attempts on successful login
  await prisma.user.update({
    where: { id: user.id },
    data: {
      loginAttempts: 0,
      lockoutUntil: null,
      lastLoginAt: new Date(),
    },
  });

  // Generate device ID
  const deviceId = generateDeviceId(userAgent || '', ipAddress || '');
  
  // Generate tokens
  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    deviceId,
  });

  const refreshToken = generateRefreshToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    deviceId,
  });

  // Store refresh token in database
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (rememberMe ? 30 : 7)); // 30 days if remember me, otherwise 7 days
  
  await prisma.authToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      type: 'refresh',
      expiresAt,
      deviceInfo: JSON.stringify({ userAgent, ipAddress, deviceId }),
    },
  });

  // Log successful login
  await logAuditEvent({
    userId: user.id,
    action: 'login_success',
    ipAddress,
    userAgent,
    success: true,
  });

  const { password: _, twoFactorSecret, backupCodes, ...userWithoutSensitive } = user;
  return {
    user: userWithoutSensitive,
    accessToken,
    refreshToken,
    requiresTwoFactor: user.twoFactorEnabled,
  };
}

// Refresh token functionality
export async function refreshAccessToken(refreshToken: string, ipAddress?: string, userAgent?: string) {
  try {
    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);
    
    // Check if refresh token exists in database and is not revoked
    const storedToken = await prisma.authToken.findFirst({
      where: {
        token: refreshToken,
        type: 'refresh',
        isRevoked: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });

    if (!storedToken) {
      throw new Error('Invalid or expired refresh token');
    }

    // Generate new access token
    const newAccessToken = generateAccessToken({
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      deviceId: payload.deviceId,
    });

    // Log token refresh
    await logAuditEvent({
      userId: payload.userId,
      action: 'token_refreshed',
      ipAddress,
      userAgent,
      success: true,
    });

    const { password: _, twoFactorSecret, backupCodes, ...userWithoutSensitive } = storedToken.user;
    return {
      accessToken: newAccessToken,
      user: userWithoutSensitive,
    };
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
}

// Revoke refresh token (logout)
export async function revokeRefreshToken(refreshToken: string, userId?: string) {
  try {
    await prisma.authToken.updateMany({
      where: {
        token: refreshToken,
        userId: userId,
        type: 'refresh',
      },
      data: {
        isRevoked: true,
      },
    });

    if (userId) {
      await logAuditEvent({
        userId,
        action: 'logout',
        success: true,
      });
    }
  } catch (error) {
    // Silent fail for logout
  }
}

// Revoke all refresh tokens for a user (logout from all devices)
export async function revokeAllUserTokens(userId: string) {
  await prisma.authToken.updateMany({
    where: {
      userId,
      type: 'refresh',
    },
    data: {
      isRevoked: true,
    },
  });

  await logAuditEvent({
    userId,
    action: 'logout_all_devices',
    success: true,
  });
}

// Log audit events
export async function logAuditEvent(data: AuditLogData) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        oldValues: data.oldValues,
        newValues: data.newValues,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        success: data.success,
        errorMessage: data.errorMessage,
      },
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}

// Get user request info
export function getRequestInfo(request: NextRequest) {
  const ipAddress = request.ip || 
    request.headers.get('x-forwarded-for') || 
    request.headers.get('x-real-ip') || 
    'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  return { ipAddress, userAgent };
}

// Generate password reset token
export async function generatePasswordResetToken(email: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const resetToken = generateSecureToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: resetToken,
      passwordResetExpiry: expiresAt,
    },
  });

  return resetToken;
}

// Verify password reset token
export async function verifyPasswordResetToken(token: string) {
  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetExpiry: {
        gt: new Date(),
      },
    },
  });

  if (!user) {
    throw new Error('Invalid or expired reset token');
  }

  return user;
}

// Reset password
export async function resetPassword(token: string, newPassword: string, ipAddress?: string, userAgent?: string) {
  const user = await verifyPasswordResetToken(token);
  
  const hashedPassword = await hashPassword(newPassword);
  
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpiry: null,
      loginAttempts: 0,
      lockoutUntil: null,
    },
  });

  // Revoke all existing tokens
  await revokeAllUserTokens(user.id);

  await logAuditEvent({
    userId: user.id,
    action: 'password_reset',
    ipAddress,
    userAgent,
    success: true,
  });

  return user;
}

// Alias for backward compatibility
export const verifyAuth = verifyToken;
export const generateToken = generateAccessToken;
