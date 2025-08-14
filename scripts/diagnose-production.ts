import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function diagnose() {
  console.log('🔍 Diagnosing Production Database...');
  console.log('=====================================\n');

  try {
    // Test database connection
    console.log('1. Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully!\n');

    // Check for users
    console.log('2. Checking existing users...');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (users.length === 0) {
      console.log('❌ No users found in database!');
      console.log('   The seed script may not have run.\n');
    } else {
      console.log(`✅ Found ${users.length} users:`);
      users.forEach(user => {
        console.log(`   - ${user.email} (${user.role}) - Active: ${user.isActive}`);
      });
      console.log('');
    }

    // Check specific test users
    console.log('3. Checking test users...');
    const testEmails = ['trainer@test.com', 'client@test.com'];
    
    for (const email of testEmails) {
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          password: true,
          role: true,
          isActive: true,
        },
      });

      if (user) {
        console.log(`\n   Found: ${email}`);
        console.log(`   - ID: ${user.id}`);
        console.log(`   - Role: ${user.role}`);
        console.log(`   - Active: ${user.isActive}`);
        
        // Test password
        const testPassword = '123456';
        const isValidPassword = await bcrypt.compare(testPassword, user.password);
        console.log(`   - Password '${testPassword}' is valid: ${isValidPassword}`);
        
        if (!isValidPassword) {
          console.log('   ⚠️  Password mismatch! Updating password...');
          const newHashedPassword = await bcrypt.hash(testPassword, 10);
          await prisma.user.update({
            where: { id: user.id },
            data: { password: newHashedPassword },
          });
          console.log('   ✅ Password updated!');
        }
      } else {
        console.log(`\n   ❌ Not found: ${email}`);
        console.log('   Creating user...');
        
        const hashedPassword = await bcrypt.hash('123456', 10);
        const newUser = await prisma.user.create({
          data: {
            email,
            password: hashedPassword,
            name: email.includes('trainer') ? 'Test Trainer' : 'Test Client',
            role: email.includes('trainer') ? 'TRAINER' : 'CLIENT',
            phone: email.includes('trainer') ? '11999999999' : '11888888888',
            isActive: true,
          },
        });
        
        console.log(`   ✅ Created user: ${newUser.email}`);
        
        // Create profile
        if (newUser.role === 'TRAINER') {
          await prisma.trainerProfile.create({
            data: {
              userId: newUser.id,
              bio: 'Test trainer profile',
              specialties: 'Testing',
              experience: 1,
              hourlyRate: 100,
            },
          });
          console.log('   ✅ Created trainer profile');
        } else {
          await prisma.clientProfile.create({
            data: {
              userId: newUser.id,
              goals: 'Test goals',
              birthDate: new Date('1990-01-01'),
            },
          });
          console.log('   ✅ Created client profile');
        }
      }
    }

    // Check profiles
    console.log('\n4. Checking profiles...');
    const trainerProfiles = await prisma.trainerProfile.count();
    const clientProfiles = await prisma.clientProfile.count();
    console.log(`   - Trainer profiles: ${trainerProfiles}`);
    console.log(`   - Client profiles: ${clientProfiles}`);

    // Check services
    console.log('\n5. Checking services...');
    const services = await prisma.service.count();
    console.log(`   - Total services: ${services}`);

    // Check appointments
    console.log('\n6. Checking appointments...');
    const appointments = await prisma.appointment.count();
    console.log(`   - Total appointments: ${appointments}`);

    console.log('\n=====================================');
    console.log('✅ Diagnosis complete!');
    console.log('\n📝 Summary:');
    console.log('   Test credentials should now work:');
    console.log('   - trainer@test.com / 123456');
    console.log('   - client@test.com / 123456');
    
  } catch (error) {
    console.error('❌ Diagnosis failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnose().catch(console.error);