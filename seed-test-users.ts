import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedTestUsers() {
  console.log('🌱 Seeding test users...');

  try {
    // Clean existing test users
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['test-client@fitness.com', 'test-trainer@fitness.com']
        }
      }
    });

    // Create test client
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const testClient = await prisma.user.create({
      data: {
        email: 'test-client@fitness.com',
        password: hashedPassword,
        name: 'Test Client',
        role: 'CLIENT',
        emailVerified: new Date(),
        clientProfile: {
          create: {
            goals: 'Fitness testing and health improvement',
            medicalHistory: 'No significant medical history',
            emergencyContact: 'Emergency: (11) 99999-9999',
            birthDate: new Date('1990-01-01')
          }
        }
      },
      include: {
        clientProfile: true
      }
    });
    
    console.log('✅ Test client created:', testClient.email);

    // Create test trainer
    const testTrainer = await prisma.user.create({
      data: {
        email: 'test-trainer@fitness.com',
        password: hashedPassword,
        name: 'Test Trainer',
        role: 'TRAINER',
        emailVerified: new Date(),
        trainerProfile: {
          create: {
            specialties: 'Personal Training, Fitness',
            experience: 5,
            bio: 'Test trainer for development',
            hourlyRate: 50.00,
            rating: 4.5,
            totalReviews: 10
          }
        }
      },
      include: {
        trainerProfile: true
      }
    });
    
    console.log('✅ Test trainer created:', testTrainer.email);

    // Create some test services for the trainer
    const service1 = await prisma.service.create({
      data: {
        trainerId: testTrainer.trainerProfile!.id,
        name: 'Personal Training',
        description: 'One-on-one personal training session',
        duration: 60,
        price: 50.00,
        isActive: true
      }
    });

    const service2 = await prisma.service.create({
      data: {
        trainerId: testTrainer.trainerProfile!.id,
        name: 'Group Training',
        description: 'Small group training session',
        duration: 60,
        price: 30.00,
        isActive: true
      }
    });

    console.log('✅ Test services created');

    // Create availability for trainer
    const daysOfWeek = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
    
    for (const day of daysOfWeek) {
      await prisma.availability.create({
        data: {
          trainerId: testTrainer.trainerProfile!.id,
          dayOfWeek: day,
          startTime: '09:00',
          endTime: '18:00',
          isActive: true
        }
      });
    }

    console.log('✅ Trainer availability created');

    // Create a test appointment
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    
    const endTime = new Date(tomorrow);
    endTime.setHours(11, 0, 0, 0); // 1 hour later

    const appointment = await prisma.appointment.create({
      data: {
        trainerId: testTrainer.trainerProfile!.id,
        clientId: testClient.clientProfile!.id,
        serviceId: service1.id,
        date: tomorrow,
        startTime: tomorrow,
        endTime: endTime,
        status: 'CONFIRMED',
        price: 50.00,
        notes: 'Test appointment'
      }
    });

    console.log('✅ Test appointment created');

    console.log('\n✨ Test data seeded successfully!');
    console.log('\n📝 Test Credentials:');
    console.log('Client: test-client@fitness.com / password123');
    console.log('Trainer: test-trainer@fitness.com / password123');

  } catch (error) {
    console.error('❌ Error seeding test users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedTestUsers();