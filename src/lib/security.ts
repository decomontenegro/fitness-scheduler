import crypto from 'crypto'

/**
 * Security utilities for PCI DSS compliance and data protection
 */

// Encryption configuration
const ENCRYPTION_ALGORITHM = 'aes-256-gcm'
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex')

if (!process.env.ENCRYPTION_KEY) {
  console.warn('ENCRYPTION_KEY not set in environment variables')
}

/**
 * Encrypt sensitive data using AES-256-GCM
 */
export function encrypt(text: string): { encrypted: string; iv: string; tag: string } {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipher('aes-256-gcm', Buffer.from(ENCRYPTION_KEY, 'hex'))
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const tag = cipher.getAuthTag()
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex')
  }
}

/**
 * Decrypt encrypted data
 */
export function decrypt(encryptedData: { encrypted: string; iv: string; tag: string }): string {
  const decipher = crypto.createDecipher('aes-256-gcm', Buffer.from(ENCRYPTION_KEY, 'hex'))
  decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'))
  
  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

/**
 * Hash sensitive data using SHA-256
 */
export function hashData(data: string, salt?: string): string {
  const useSalt = salt || crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(data, useSalt, 100000, 64, 'sha256')
  return `${useSalt}:${hash.toString('hex')}`
}

/**
 * Verify hashed data
 */
export function verifyHash(data: string, hashedData: string): boolean {
  const [salt, hash] = hashedData.split(':')
  const verifyHash = crypto.pbkdf2Sync(data, salt, 100000, 64, 'sha256')
  return hash === verifyHash.toString('hex')
}

/**
 * Generate cryptographically secure random tokens
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

/**
 * Mask sensitive data for logging (PCI DSS requirement)
 */
export function maskSensitiveData(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data
  }

  const masked = { ...data }
  const sensitiveFields = [
    'password', 'token', 'secret', 'key', 'cardNumber', 'cvv', 'ssn',
    'creditCard', 'bankAccount', 'socialSecurity', 'apiKey', 'privateKey'
  ]

  function maskRecursive(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(maskRecursive)
    }
    
    if (typeof obj === 'object' && obj !== null) {
      const result: any = {}
      for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase()
        if (sensitiveFields.some(field => lowerKey.includes(field))) {
          if (typeof value === 'string') {
            // Mask all but last 4 characters
            result[key] = value.length > 4 
              ? '*'.repeat(value.length - 4) + value.slice(-4)
              : '*'.repeat(value.length)
          } else {
            result[key] = '[MASKED]'
          }
        } else {
          result[key] = maskRecursive(value)
        }
      }
      return result
    }
    
    return obj
  }

  return maskRecursive(masked)
}

/**
 * Sanitize input to prevent XSS and injection attacks
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return input
  }

  return input
    .replace(/[<>]/g, '') // Remove basic HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate phone number format
 */
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s-()]{10,}$/
  return phoneRegex.test(phone)
}

/**
 * Validate credit card number using Luhn algorithm
 */
export function isValidCreditCard(cardNumber: string): boolean {
  const number = cardNumber.replace(/\D/g, '')
  
  if (number.length < 13 || number.length > 19) {
    return false
  }
  
  let sum = 0
  let isEven = false
  
  for (let i = number.length - 1; i >= 0; i--) {
    let digit = parseInt(number.charAt(i))
    
    if (isEven) {
      digit *= 2
      if (digit > 9) {
        digit -= 9
      }
    }
    
    sum += digit
    isEven = !isEven
  }
  
  return sum % 10 === 0
}

/**
 * Generate a secure session ID
 */
export function generateSessionId(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Create a secure hash for session storage
 */
export function createSessionHash(sessionId: string, userAgent: string, ipAddress: string): string {
  const data = `${sessionId}:${userAgent}:${ipAddress}`
  return crypto.createHash('sha256').update(data).digest('hex')
}

/**
 * Security headers for PCI compliance
 */
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://api.stripe.com wss:",
    "frame-src https://js.stripe.com https://hooks.stripe.com",
    "object-src 'none'",
    "base-uri 'self'"
  ].join('; '),
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
}

/**
 * Rate limiting configuration
 */
export const RATE_LIMITS = {
  login: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5 // 5 attempts per window
  },
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // 100 requests per window
  },
  payment: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10 // 10 payment attempts per window
  },
  webhook: {
    windowMs: 60 * 1000, // 1 minute
    max: 100 // 100 webhook calls per minute
  }
}

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  userId?: string
  action: string
  entityType?: string
  entityId?: string
  oldValues?: any
  newValues?: any
  ipAddress?: string
  userAgent?: string
  success: boolean
  errorMessage?: string
  metadata?: any
}

/**
 * Create an audit log entry with masked sensitive data
 */
export function createAuditLog(entry: AuditLogEntry): AuditLogEntry {
  return {
    ...entry,
    oldValues: entry.oldValues ? maskSensitiveData(entry.oldValues) : undefined,
    newValues: entry.newValues ? maskSensitiveData(entry.newValues) : undefined,
    metadata: entry.metadata ? maskSensitiveData(entry.metadata) : undefined
  }
}

/**
 * Validate webhook signature from Stripe
 */
export function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const elements = signature.split(',')
    const signatureElements: { [key: string]: string } = {}
    
    elements.forEach(element => {
      const [key, value] = element.split('=')
      signatureElements[key] = value
    })
    
    if (!signatureElements.t || !signatureElements.v1) {
      return false
    }
    
    const timestamp = signatureElements.t
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(timestamp + '.' + payload)
      .digest('hex')
    
    return signatureElements.v1 === expectedSignature
  } catch (error) {
    return false
  }
}

/**
 * PCI DSS compliant logging function
 */
export function secureLog(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
  const timestamp = new Date().toISOString()
  const logData = data ? maskSensitiveData(data) : undefined
  
  const logEntry = {
    timestamp,
    level,
    message,
    ...(logData && { data: logData })
  }
  
  console.log(JSON.stringify(logEntry))
}

/**
 * Generate PCI compliant password
 */
export function generateSecurePassword(length: number = 12): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'
  const allChars = lowercase + uppercase + numbers + symbols
  
  let password = ''
  
  // Ensure at least one character from each category
  password += lowercase.charAt(Math.floor(Math.random() * lowercase.length))
  password += uppercase.charAt(Math.floor(Math.random() * uppercase.length))
  password += numbers.charAt(Math.floor(Math.random() * numbers.length))
  password += symbols.charAt(Math.floor(Math.random() * symbols.length))
  
  // Fill remaining length with random characters
  for (let i = 4; i < length; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length))
  }
  
  // Shuffle password
  return password.split('').sort(() => 0.5 - Math.random()).join('')
}