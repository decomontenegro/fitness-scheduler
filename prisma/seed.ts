import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clean existing data
  await prisma.appointment.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.service.deleteMany();
  await prisma.clientProfile.deleteMany();
  await prisma.trainerProfile.deleteMany();
  await prisma.user.deleteMany();

  // Create test users
  const hashedPassword = await bcrypt.hash('123456', 10);

  // Create trainer users
  const trainer1 = await prisma.user.create({
    data: {
      email: 'test-trainer@fitness.com',
      password: hashedPassword,
      name: 'João Personal',
      phone: '11999999999',
      role: 'TRAINER',
      isActive: true,
    },
  });

  const trainer2 = await prisma.user.create({
    data: {
      email: 'trainer2@test.com',
      password: hashedPassword,
      name: 'Ana Fitness',
      phone: '11888777666',
      role: 'TRAINER',
      isActive: true,
    },
  });

  const trainer3 = await prisma.user.create({
    data: {
      email: 'trainer3@test.com',
      password: hashedPassword,
      name: 'Carlos Strong',
      phone: '11777666555',
      role: 'TRAINER',
      isActive: true,
    },
  });

  // Create trainer profiles
  const trainerProfile1 = await prisma.trainerProfile.create({
    data: {
      userId: trainer1.id,
      bio: 'Personal trainer com 10 anos de experiência. CREF certificado, especialista em Nutrição Esportiva.',
      specialties: 'Musculação, Emagrecimento, Condicionamento',
      experience: 10,
      hourlyRate: 150.00,
      rating: 4.8,
      totalReviews: 42,
    },
  });

  const trainerProfile2 = await prisma.trainerProfile.create({
    data: {
      userId: trainer2.id,
      bio: 'Especialista em treinos funcionais e CrossFit. Focada em performance e condicionamento físico.',
      specialties: 'Funcional, CrossFit, HIIT, Alongamento',
      experience: 8,
      hourlyRate: 120.00,
      rating: 4.9,
      totalReviews: 38,
    },
  });

  const trainerProfile3 = await prisma.trainerProfile.create({
    data: {
      userId: trainer3.id,
      bio: 'Ex-atleta de powerlifting. Especialista em força e hipertrofia muscular.',
      specialties: 'Powerlifting, Hipertrofia, Força, Competição',
      experience: 12,
      hourlyRate: 180.00,
      rating: 4.7,
      totalReviews: 29,
    },
  });

  // Create client user
  const client = await prisma.user.create({
    data: {
      email: 'test-client@fitness.com',
      password: hashedPassword,
      name: 'Maria Silva',
      phone: '11888888888',
      role: 'CLIENT',
      isActive: true,
    },
  });

  // Create client profile
  const clientProfile = await prisma.clientProfile.create({
    data: {
      userId: client.id,
      goals: 'Perder peso e ganhar massa muscular',
      medicalHistory: 'Nenhuma condição médica relevante',
      emergencyContact: '11777777777',
      birthDate: new Date('1990-01-01'),
    },
  });

  // Create services for each trainer
  // Trainer 1 services
  const service1_1 = await prisma.service.create({
    data: {
      trainerId: trainerProfile1.id,
      name: 'Treino Personalizado',
      description: 'Treino individual personalizado com foco em seus objetivos',
      duration: 60,
      price: 150.00,
      isActive: true,
    },
  });

  const service1_2 = await prisma.service.create({
    data: {
      trainerId: trainerProfile1.id,
      name: 'Avaliação Física',
      description: 'Avaliação física completa com bioimpedância',
      duration: 30,
      price: 100.00,
      isActive: true,
    },
  });

  const service1_3 = await prisma.service.create({
    data: {
      trainerId: trainerProfile1.id,
      name: 'Consultoria Nutricional',
      description: 'Orientação nutricional personalizada',
      duration: 45,
      price: 120.00,
      isActive: true,
    },
  });

  // Trainer 2 services
  const service2_1 = await prisma.service.create({
    data: {
      trainerId: trainerProfile2.id,
      name: 'Treino Funcional',
      description: 'Treino funcional para melhorar movimentos do dia a dia',
      duration: 45,
      price: 120.00,
      isActive: true,
    },
  });

  const service2_2 = await prisma.service.create({
    data: {
      trainerId: trainerProfile2.id,
      name: 'HIIT Session',
      description: 'Treino intervalado de alta intensidade',
      duration: 30,
      price: 90.00,
      isActive: true,
    },
  });

  const service2_3 = await prisma.service.create({
    data: {
      trainerId: trainerProfile2.id,
      name: 'CrossFit Training',
      description: 'Treino de CrossFit adaptado para seu nível',
      duration: 60,
      price: 140.00,
      isActive: true,
    },
  });

  // Trainer 3 services
  const service3_1 = await prisma.service.create({
    data: {
      trainerId: trainerProfile3.id,
      name: 'Powerlifting Session',
      description: 'Treino específico de powerlifting',
      duration: 90,
      price: 200.00,
      isActive: true,
    },
  });

  const service3_2 = await prisma.service.create({
    data: {
      trainerId: trainerProfile3.id,
      name: 'Treino de Força',
      description: 'Desenvolvimento de força máxima',
      duration: 75,
      price: 180.00,
      isActive: true,
    },
  });

  const service3_3 = await prisma.service.create({
    data: {
      trainerId: trainerProfile3.id,
      name: 'Hipertrofia Avançada',
      description: 'Treino avançado para ganho de massa muscular',
      duration: 60,
      price: 170.00,
      isActive: true,
    },
  });

  // Create availability for all trainers
  const trainers = [trainerProfile1, trainerProfile2, trainerProfile3];
  const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
  
  for (const trainer of trainers) {
    for (const dayOfWeek of daysOfWeek) {
      await prisma.availability.create({
        data: {
          trainerId: trainer.id,
          dayOfWeek,
          startTime: '08:00',
          endTime: '18:00',
          isActive: true,
        },
      });
    }
    
    // Add weekend availability for some trainers
    if (trainer.id === trainerProfile2.id || trainer.id === trainerProfile3.id) {
      await prisma.availability.create({
        data: {
          trainerId: trainer.id,
          dayOfWeek: 'SATURDAY',
          startTime: '09:00',
          endTime: '15:00',
          isActive: true,
        },
      });
    }
  }

  // Create some appointments
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const startTime = new Date(tomorrow);
  const endTime = new Date(tomorrow);
  endTime.setHours(11, 0, 0, 0);

  await prisma.appointment.create({
    data: {
      trainerId: trainerProfile1.id,
      clientId: clientProfile.id,
      serviceId: service1_1.id,
      date: tomorrow,
      startTime: startTime,
      endTime: endTime,
      status: 'CONFIRMED',
      price: 150.00,
    },
  });

  console.log('✅ Seed completed successfully!');
  console.log('📧 Test accounts created:');
  console.log('   Trainer: test-trainer@fitness.com / 123456 (João Personal)');
  console.log('   Trainer 2: trainer2@test.com / 123456 (Ana Fitness)');
  console.log('   Trainer 3: trainer3@test.com / 123456 (Carlos Strong)');
  console.log('   Client: test-client@fitness.com / 123456 (Maria Silva)');
  console.log('🎯 Now you can access /schedule to test the booking system!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });