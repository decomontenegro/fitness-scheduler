const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createUsers() {
  console.log('🚀 Creating test users...');
  
  try {
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    // Create or update trainer
    const trainer = await prisma.user.upsert({
      where: { email: 'trainer@test.com' },
      update: {
        password: hashedPassword,
        isActive: true,
      },
      create: {
        email: 'trainer@test.com',
        password: hashedPassword,
        name: 'Test Trainer',
        role: 'TRAINER',
        phone: '11999999999',
        isActive: true,
      },
    });
    console.log('✅ Trainer created/updated:', trainer.email);
    
    // Create trainer profile if needed
    const trainerProfile = await prisma.trainerProfile.upsert({
      where: { userId: trainer.id },
      update: {},
      create: {
        userId: trainer.id,
        bio: 'Test trainer',
        specialties: 'Testing',
        experience: 1,
        hourlyRate: 100,
      },
    });
    console.log('✅ Trainer profile ready');
    
    // Create or update client
    const client = await prisma.user.upsert({
      where: { email: 'client@test.com' },
      update: {
        password: hashedPassword,
        isActive: true,
      },
      create: {
        email: 'client@test.com',
        password: hashedPassword,
        name: 'Test Client',
        role: 'CLIENT',
        phone: '11888888888',
        isActive: true,
      },
    });
    console.log('✅ Client created/updated:', client.email);
    
    // Create client profile if needed
    const clientProfile = await prisma.clientProfile.upsert({
      where: { userId: client.id },
      update: {},
      create: {
        userId: client.id,
        goals: 'Test goals',
        birthDate: new Date('1990-01-01'),
      },
    });
    console.log('✅ Client profile ready');
    
    console.log('\n✅ SUCCESS! Users are ready:');
    console.log('   Trainer: trainer@test.com / 123456');
    console.log('   Client: client@test.com / 123456');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createUsers();