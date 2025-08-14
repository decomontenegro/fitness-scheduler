const { PrismaClient } = require('@prisma/client');

console.log('🔍 Testing database connection...');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set (hidden)' : 'NOT SET');

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

async function testConnection() {
  try {
    console.log('\n1. Attempting to connect...');
    await prisma.$connect();
    console.log('✅ Connected successfully!');
    
    console.log('\n2. Testing query...');
    const userCount = await prisma.user.count();
    console.log(`✅ Found ${userCount} users in database`);
    
    console.log('\n3. Listing users...');
    const users = await prisma.user.findMany({
      select: {
        email: true,
        role: true,
        createdAt: true,
      },
    });
    
    if (users.length > 0) {
      users.forEach(u => {
        console.log(`   - ${u.email} (${u.role})`);
      });
    } else {
      console.log('   No users found');
    }
    
    console.log('\n✅ Database is working!');
    
  } catch (error) {
    console.error('\n❌ Connection failed:');
    console.error('Error:', error.message);
    console.error('\nFull error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();