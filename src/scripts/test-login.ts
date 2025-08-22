import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testLogin() {
  try {
    console.log('🔍 Testing login process...\n');
    
    const email = 'trainer@test.com';
    const password = '123456';
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        trainerProfile: true,
        clientProfile: true,
      },
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ User found:');
    console.log('   Email:', user.email);
    console.log('   Name:', user.name);
    console.log('   Role:', user.role);
    console.log('   Active:', user.isActive);
    console.log('   Password hash exists:', !!user.password);
    console.log('   Password hash:', user.password.substring(0, 20) + '...');
    
    // Test password
    console.log('\n🔐 Testing password...');
    const isValid = await bcrypt.compare(password, user.password);
    console.log('   Password valid:', isValid ? '✅ Yes' : '❌ No');
    
    if (!isValid) {
      // Try to hash the password and compare
      const testHash = await bcrypt.hash(password, 10);
      console.log('   Test hash:', testHash.substring(0, 20) + '...');
      
      // Update password for testing
      console.log('\n🔄 Updating password to ensure it works...');
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          password: await bcrypt.hash(password, 10),
          loginAttempts: 0,
          lockoutUntil: null,
        },
      });
      console.log('   ✅ Password updated successfully!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();