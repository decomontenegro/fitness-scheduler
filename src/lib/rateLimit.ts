import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';
import { NextRequest } from 'next/server';

// Rate limiters for different endpoints
const rateLimiters = {
  // Login attempts: 5 attempts per 15 minutes per IP
  login: new RateLimiterMemory({
    keyPrefix: 'login_fail',
    points: 5, // 5 attempts
    duration: 900, // Per 15 minutes (900 seconds)
    blockDuration: 900, // Block for 15 minutes
  }),

  // Registration: 3 registrations per hour per IP
  register: new RateLimiterMemory({
    keyPrefix: 'register',
    points: 3,
    duration: 3600, // Per hour
    blockDuration: 3600, // Block for 1 hour
  }),

  // Password reset: 3 requests per hour per IP
  passwordReset: new RateLimiterMemory({
    keyPrefix: 'password_reset',
    points: 3,
    duration: 3600, // Per hour
    blockDuration: 3600, // Block for 1 hour
  }),

  // 2FA attempts: 10 attempts per 5 minutes per IP
  twoFactor: new RateLimiterMemory({
    keyPrefix: '2fa_attempt',
    points: 10,
    duration: 300, // Per 5 minutes
    blockDuration: 900, // Block for 15 minutes
  }),

  // General API: 100 requests per minute per IP
  api: new RateLimiterMemory({
    keyPrefix: 'api',
    points: 100,
    duration: 60, // Per minute
    blockDuration: 60, // Block for 1 minute
  }),

  // Sensitive operations: 20 requests per minute per IP
  sensitive: new RateLimiterMemory({
    keyPrefix: 'sensitive',
    points: 20,
    duration: 60, // Per minute
    blockDuration: 300, // Block for 5 minutes
  }),
};

export type RateLimitType = keyof typeof rateLimiters;

export interface RateLimitInfo {
  allowed: boolean;
  remainingPoints?: number;
  msBeforeNext?: number;
  totalHits?: number;
}

// Get client IP address from request
export function getClientIP(request: NextRequest): string {
  // Try multiple headers for IP address
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfIP = request.headers.get('cf-connecting-ip'); // Cloudflare
  
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, get the first one
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  if (cfIP) {
    return cfIP;
  }
  
  // Fallback to request IP (might be undefined in some environments)
  return request.ip || 'unknown';
}

// Check rate limit for a specific type and key
export async function checkRateLimit(
  type: RateLimitType,
  key: string,
  points: number = 1
): Promise<RateLimitInfo> {
  const rateLimiter = rateLimiters[type];
  
  if (!rateLimiter) {
    console.warn(`Rate limiter type "${type}" not found`);
    return { allowed: true };
  }

  try {
    const result = await rateLimiter.consume(key, points);
    
    return {
      allowed: true,
      remainingPoints: result.remainingPoints,
      msBeforeNext: result.msBeforeNext,
      totalHits: result.totalHits,
    };
  } catch (rateLimiterRes) {
    if (rateLimiterRes instanceof RateLimiterRes) {
      return {
        allowed: false,
        remainingPoints: rateLimiterRes.remainingPoints,
        msBeforeNext: rateLimiterRes.msBeforeNext,
        totalHits: rateLimiterRes.totalHits,
      };
    }
    
    // Unexpected error, allow the request but log it
    console.error('Rate limiter error:', rateLimiterRes);
    return { allowed: true };
  }
}

// Rate limit middleware function
export async function rateLimit(
  request: NextRequest,
  type: RateLimitType,
  customKey?: string
): Promise<RateLimitInfo> {
  const ip = getClientIP(request);
  const key = customKey || ip;
  
  return checkRateLimit(type, key);
}

// Helper to get rate limit headers for response
export function getRateLimitHeaders(info: RateLimitInfo): Record<string, string> {
  const headers: Record<string, string> = {};
  
  if (info.remainingPoints !== undefined) {
    headers['X-RateLimit-Remaining'] = info.remainingPoints.toString();
  }
  
  if (info.msBeforeNext !== undefined) {
    headers['X-RateLimit-Reset'] = new Date(Date.now() + info.msBeforeNext).toISOString();
  }
  
  if (info.totalHits !== undefined) {
    headers['X-RateLimit-Total'] = info.totalHits.toString();
  }
  
  return headers;
}

// Reset rate limit for a key (useful for successful logins)
export async function resetRateLimit(type: RateLimitType, key: string): Promise<void> {
  const rateLimiter = rateLimiters[type];
  
  if (rateLimiter) {
    try {
      await rateLimiter.delete(key);
    } catch (error) {
      console.error(`Failed to reset rate limit for ${type}:${key}`, error);
    }
  }
}

// Get rate limit status without consuming points
export async function getRateLimitStatus(
  type: RateLimitType,
  key: string
): Promise<RateLimitInfo> {
  const rateLimiter = rateLimiters[type];
  
  if (!rateLimiter) {
    return { allowed: true };
  }

  try {
    const result = await rateLimiter.get(key);
    
    if (!result) {
      return { allowed: true, remainingPoints: rateLimiter.points };
    }
    
    return {
      allowed: result.remainingPoints > 0,
      remainingPoints: result.remainingPoints,
      msBeforeNext: result.msBeforeNext,
      totalHits: result.totalHits,
    };
  } catch (error) {
    console.error('Rate limit status error:', error);
    return { allowed: true };
  }
}

// Enhanced rate limiting for user-specific operations
export async function checkUserRateLimit(
  userId: string,
  type: RateLimitType,
  points: number = 1
): Promise<RateLimitInfo> {
  const key = `user:${userId}`;
  return checkRateLimit(type, key, points);
}

// Check both IP and user rate limits
export async function checkCombinedRateLimit(
  request: NextRequest,
  type: RateLimitType,
  userId?: string
): Promise<{ ip: RateLimitInfo; user?: RateLimitInfo }> {
  const ip = getClientIP(request);
  
  const ipCheck = await checkRateLimit(type, ip);
  let userCheck: RateLimitInfo | undefined;
  
  if (userId) {
    userCheck = await checkUserRateLimit(userId, type);
  }
  
  return { ip: ipCheck, user: userCheck };
}