import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixProductionData() {
  console.log('🔧 Fixing production data...');
  
  try {
    // 1. Fix availability dayOfWeek format
    console.log('\n1️⃣ Fixing availability dayOfWeek format...');
    
    // Get all availabilities
    const availabilities = await prisma.availability.findMany();
    
    for (const availability of availabilities) {
      let numericDay: string;
      
      // Convert string day to number
      switch (availability.dayOfWeek) {
        case 'SUNDAY': numericDay = '0'; break;
        case 'MONDAY': numericDay = '1'; break;
        case 'TUESDAY': numericDay = '2'; break;
        case 'WEDNESDAY': numericDay = '3'; break;
        case 'THURSDAY': numericDay = '4'; break;
        case 'FRIDAY': numericDay = '5'; break;
        case 'SATURDAY': numericDay = '6'; break;
        default: 
          // If already numeric, skip
          if (/^[0-6]$/.test(availability.dayOfWeek)) {
            continue;
          }
          numericDay = '1'; // Default to Monday
      }
      
      await prisma.availability.update({
        where: { id: availability.id },
        data: { dayOfWeek: numericDay }
      });
      
      console.log(`   Updated availability ${availability.id}: ${availability.dayOfWeek} -> ${numericDay}`);
    }
    
    // 2. Ensure all trainers have availability for all days
    console.log('\n2️⃣ Ensuring all trainers have availability...');
    
    const trainers = await prisma.trainerProfile.findMany({
      include: { availability: true }
    });
    
    for (const trainer of trainers) {
      console.log(`   Checking trainer: ${trainer.id}`);
      
      // Check which days are missing
      const existingDays = trainer.availability.map(a => a.dayOfWeek);
      
      for (let day = 0; day <= 6; day++) {
        const dayStr = day.toString();
        
        if (!existingDays.includes(dayStr)) {
          // Skip weekends for some trainers
          if (day === 0 || day === 6) continue;
          
          await prisma.availability.create({
            data: {
              trainerId: trainer.id,
              dayOfWeek: dayStr,
              startTime: '08:00',
              endTime: '18:00',
              isActive: true
            }
          });
          
          console.log(`     Added availability for day ${dayStr}`);
        }
      }
    }
    
    // 3. Verify the fix
    console.log('\n3️⃣ Verifying the fix...');
    
    const fixedAvailabilities = await prisma.availability.findMany({
      take: 10,
      include: { trainer: true }
    });
    
    console.log('   Sample availabilities after fix:');
    for (const avail of fixedAvailabilities.slice(0, 5)) {
      console.log(`     Trainer ${avail.trainerId}: Day ${avail.dayOfWeek} (${avail.startTime}-${avail.endTime})`);
    }
    
    // 4. Count total availabilities
    const totalCount = await prisma.availability.count();
    console.log(`\n   Total availabilities in database: ${totalCount}`);
    
    console.log('\n✅ Production data fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing production data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  fixProductionData();
}

export { fixProductionData };