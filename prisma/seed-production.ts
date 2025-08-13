import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting production seed with correct test credentials...');

  const hashedPassword = await bcrypt.hash('123456', 10);

  // Create trainer user with expected credentials
  const trainer = await prisma.user.upsert({
    where: { email: 'trainer@test.com' },
    update: {
      password: hashedPassword,
      name: 'Test Trainer',
      phone: '11999999999',
      role: 'TRAINER',
      isActive: true,
    },
    create: {
      email: 'trainer@test.com',
      password: hashedPassword,
      name: 'Test Trainer',
      phone: '11999999999',
      role: 'TRAINER',
      isActive: true,
    },
  });

  // Create trainer profile if it doesn't exist
  const existingTrainerProfile = await prisma.trainerProfile.findUnique({
    where: { userId: trainer.id }
  });

  let trainerProfile;
  if (!existingTrainerProfile) {
    trainerProfile = await prisma.trainerProfile.create({
      data: {
        userId: trainer.id,
        bio: 'Professional certified trainer with 5+ years of experience',
        specialties: 'Personal Training, Weight Loss, Strength Training',
        experience: 5,
        hourlyRate: 100.00,
        rating: 4.8,
        totalReviews: 25,
      },
    });
  } else {
    trainerProfile = existingTrainerProfile;
  }

  // Create client user with expected credentials
  const client = await prisma.user.upsert({
    where: { email: 'client@test.com' },
    update: {
      password: hashedPassword,
      name: 'Test Client',
      phone: '11888888888',
      role: 'CLIENT',
      isActive: true,
    },
    create: {
      email: 'client@test.com',
      password: hashedPassword,
      name: 'Test Client',
      phone: '11888888888',
      role: 'CLIENT',
      isActive: true,
    },
  });

  // Create client profile if it doesn't exist
  const existingClientProfile = await prisma.clientProfile.findUnique({
    where: { userId: client.id }
  });

  let clientProfile;
  if (!existingClientProfile) {
    clientProfile = await prisma.clientProfile.create({
      data: {
        userId: client.id,
        goals: 'Weight loss and general fitness improvement',
        medicalHistory: 'No significant medical history',
        emergencyContact: '11777777777',
        birthDate: new Date('1990-01-01'),
      },
    });
  } else {
    clientProfile = existingClientProfile;
  }

  // Create basic services for the trainer if they don't exist
  const existingServices = await prisma.service.findMany({
    where: { trainerId: trainerProfile.id }
  });

  if (existingServices.length === 0) {
    await prisma.service.createMany({
      data: [
        {
          trainerId: trainerProfile.id,
          name: 'Personal Training Session',
          description: 'One-on-one personal training session',
          duration: 60,
          price: 100.00,
          isActive: true,
        },
        {
          trainerId: trainerProfile.id,
          name: 'Fitness Assessment',
          description: 'Complete fitness evaluation and goal setting',
          duration: 30,
          price: 50.00,
          isActive: true,
        },
      ],
    });
  }

  // Create basic availability for the trainer if it doesn't exist
  const existingAvailability = await prisma.availability.findFirst({
    where: { trainerId: trainerProfile.id }
  });

  if (!existingAvailability) {
    const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
    
    for (const dayOfWeek of daysOfWeek) {
      await prisma.availability.create({
        data: {
          trainerId: trainerProfile.id,
          dayOfWeek,
          startTime: '08:00',
          endTime: '18:00',
          isActive: true,
        },
      });
    }
  }

  console.log('✅ Production seed completed successfully!');
  console.log('📧 Test accounts ready:');
  console.log('   Trainer: trainer@test.com / 123456');
  console.log('   Client: client@test.com / 123456');
  console.log('🎯 These credentials should work on Railway deployment!');
}

main()
  .catch((e) => {
    console.error('❌ Production seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });