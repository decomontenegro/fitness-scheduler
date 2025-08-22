const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const trainers = await prisma.trainerProfile.findMany({
    include: {
      availability: true,
      user: true
    }
  });
  
  console.log('TRAINERS AND THEIR AVAILABILITY:');
  trainers.forEach(trainer => {
    console.log(`\n${trainer.user.name} (ID: ${trainer.id}):`);
    if (trainer.availability.length === 0) {
      console.log('  ❌ No availability set');
    } else {
      trainer.availability.forEach(av => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        console.log(`  ${days[av.dayOfWeek]}: ${av.startTime} - ${av.endTime} (${av.isAvailable ? '✅' : '❌'})`);
      });
    }
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());