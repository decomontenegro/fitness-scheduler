import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetRateLimiter() {
  try {
    console.log('🔄 Resetting rate limiter...');
    
    // Reset login attempts for all users
    await prisma.user.updateMany({
      data: {
        loginAttempts: 0,
        lockoutUntil: null,
      },
    });
    
    console.log('✅ Rate limiter reset successfully!');
    console.log('📝 All users can now login without restrictions');
    
    // Show current users
    const users = await prisma.user.findMany({
      select: {
        email: true,
        role: true,
        loginAttempts: true,
        lockoutUntil: true,
      },
    });
    
    console.log('\n📊 Current users:');
    users.forEach(user => {
      console.log(`   - ${user.email} (${user.role}) - Attempts: ${user.loginAttempts}`);
    });
    
  } catch (error) {
    console.error('❌ Error resetting rate limiter:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetRateLimiter();