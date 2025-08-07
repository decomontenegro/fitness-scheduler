import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Creating simple test users...');

  const hashedPassword = await bcrypt.hash('123456', 10);

  // Create trainer user as expected by test guide
  try {
    await prisma.user.upsert({
      where: { email: 'personal@teste.com' },
      update: {},
      create: {
        email: 'personal@teste.com',
        password: hashedPassword,
        name: 'Personal Trainer',
        role: 'TRAINER',
        isActive: true,
      },
    });

    // Create client user as expected by test guide  
    await prisma.user.upsert({
      where: { email: 'cliente@teste.com' },
      update: {},
      create: {
        email: 'cliente@teste.com',
        password: hashedPassword,
        name: 'Cliente Teste',
        role: 'CLIENT',
        isActive: true,
      },
    });

    console.log('✅ Test users created successfully!');
    console.log('   Trainer: personal@teste.com / 123456');
    console.log('   Client: cliente@teste.com / 123456');

  } catch (error) {
    console.error('❌ Failed to create users:', error);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });