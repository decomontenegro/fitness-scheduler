const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Fixing trainer availability...\n');
  
  // Delete all existing availability
  await prisma.availability.deleteMany({});
  console.log('✅ Cleared old availability data');
  
  // Get all trainers
  const trainers = await prisma.trainerProfile.findMany();
  
  // Create availability for each trainer (Mon-Fri, 8AM-6PM)
  for (const trainer of trainers) {
    const availabilities = [];
    
    // Monday to Friday (1-5)
    for (let day = 1; day <= 5; day++) {
      availabilities.push({
        trainerId: trainer.id,
        dayOfWeek: String(day),
        startTime: '08:00',
        endTime: '18:00',
        isActive: true
      });
    }
    
    // Saturday (6) - shorter hours
    availabilities.push({
      trainerId: trainer.id,
      dayOfWeek: '6',
      startTime: '09:00',
      endTime: '14:00',
      isActive: true
    });
    
    await prisma.availability.createMany({
      data: availabilities
    });
    
    const user = await prisma.user.findUnique({ where: { id: trainer.userId } });
    console.log(`✅ Created availability for ${user.name}`);
  }
  
  console.log('\n✅ All trainers now have proper availability!');
  
  // Verify
  const result = await prisma.trainerProfile.findMany({
    include: {
      availability: true,
      user: true
    }
  });
  
  console.log('\nVERIFICATION:');
  result.forEach(trainer => {
    console.log(`\n${trainer.user.name}:`);
    trainer.availability.forEach(av => {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayIndex = parseInt(av.dayOfWeek);
      console.log(`  ${days[dayIndex]}: ${av.startTime} - ${av.endTime} ✅`);
    });
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());