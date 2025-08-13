import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function checkTestUsers() {
  console.log('🔍 Checking test user credentials...');
  
  try {
    // Check if test users exist
    const trainerUser = await prisma.user.findUnique({
      where: { email: 'trainer@test.com' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        password: true,
        trainerProfile: {
          select: {
            id: true,
            bio: true,
          }
        }
      }
    });

    const clientUser = await prisma.user.findUnique({
      where: { email: 'client@test.com' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        password: true,
        clientProfile: {
          select: {
            id: true,
            goals: true,
          }
        }
      }
    });

    console.log('📊 User Check Results:');
    console.log('================================');

    // Check trainer
    if (trainerUser) {
      console.log('✅ Trainer user exists:');
      console.log(`   Email: ${trainerUser.email}`);
      console.log(`   Name: ${trainerUser.name}`);
      console.log(`   Role: ${trainerUser.role}`);
      console.log(`   Active: ${trainerUser.isActive}`);
      console.log(`   Has trainer profile: ${trainerUser.trainerProfile ? 'Yes' : 'No'}`);
      
      // Test password
      const passwordValid = await bcrypt.compare('123456', trainerUser.password);
      console.log(`   Password '123456' valid: ${passwordValid ? '✅ Yes' : '❌ No'}`);
    } else {
      console.log('❌ Trainer user (trainer@test.com) NOT found');
    }

    console.log('');

    // Check client
    if (clientUser) {
      console.log('✅ Client user exists:');
      console.log(`   Email: ${clientUser.email}`);
      console.log(`   Name: ${clientUser.name}`);
      console.log(`   Role: ${clientUser.role}`);
      console.log(`   Active: ${clientUser.isActive}`);
      console.log(`   Has client profile: ${clientUser.clientProfile ? 'Yes' : 'No'}`);
      
      // Test password
      const passwordValid = await bcrypt.compare('123456', clientUser.password);
      console.log(`   Password '123456' valid: ${passwordValid ? '✅ Yes' : '❌ No'}`);
    } else {
      console.log('❌ Client user (client@test.com) NOT found');
    }

    console.log('');
    console.log('🗃️ Database Connection Status:');
    
    // Test database connection
    const userCount = await prisma.user.count();
    console.log(`   Total users in database: ${userCount}`);
    
    const trainerCount = await prisma.user.count({ where: { role: 'TRAINER' } });
    const clientCount = await prisma.user.count({ where: { role: 'CLIENT' } });
    console.log(`   Trainers: ${trainerCount}, Clients: ${clientCount}`);

    console.log('');
    console.log('🎯 Summary:');
    
    if (trainerUser && clientUser) {
      const trainerPasswordOk = await bcrypt.compare('123456', trainerUser.password);
      const clientPasswordOk = await bcrypt.compare('123456', clientUser.password);
      
      if (trainerPasswordOk && clientPasswordOk) {
        console.log('✅ Both test accounts exist and passwords are correct!');
        console.log('   You should be able to login with:');
        console.log('   - trainer@test.com / 123456');
        console.log('   - client@test.com / 123456');
      } else {
        console.log('⚠️ Test accounts exist but passwords are incorrect');
        console.log('   Run seed-production script to fix passwords');
      }
    } else {
      console.log('❌ Test accounts missing - run seed-production script');
      console.log('   Command: npm run seed-production');
    }

  } catch (error) {
    console.error('❌ Error checking test users:', error);
    
    if (error.message.includes('ECONNREFUSED') || error.message.includes('connect')) {
      console.log('');
      console.log('💡 This appears to be a database connection error.');
      console.log('   Make sure your DATABASE_URL environment variable is set correctly.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkTestUsers();