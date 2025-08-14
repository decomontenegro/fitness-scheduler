const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

async function testComplete() {
  console.log('🔍 TESTE COMPLETO DO SISTEMA DE LOGIN');
  console.log('=====================================\n');
  
  try {
    // 1. Testar conexão
    console.log('1️⃣ Testando conexão com banco...');
    await prisma.$connect();
    console.log('✅ Conectado ao banco!\n');
    
    // 2. Listar todos os usuários
    console.log('2️⃣ Listando TODOS os usuários no banco:');
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        password: true,
      },
    });
    
    if (allUsers.length === 0) {
      console.log('❌ NENHUM USUÁRIO ENCONTRADO NO BANCO!\n');
      
      // Criar usuários de teste
      console.log('3️⃣ Criando usuários de teste...');
      const hashedPassword = await bcrypt.hash('123456', 10);
      
      const trainer = await prisma.user.create({
        data: {
          email: 'trainer@test.com',
          password: hashedPassword,
          name: 'Test Trainer',
          role: 'TRAINER',
          phone: '11999999999',
          isActive: true,
        },
      });
      console.log('✅ Trainer criado:', trainer.email);
      
      const client = await prisma.user.create({
        data: {
          email: 'client@test.com',
          password: hashedPassword,
          name: 'Test Client',
          role: 'CLIENT',
          phone: '11888888888',
          isActive: true,
        },
      });
      console.log('✅ Client criado:', client.email);
      
    } else {
      console.log(`📊 Total de usuários: ${allUsers.length}\n`);
      
      for (const user of allUsers) {
        console.log(`\n👤 Usuário: ${user.email}`);
        console.log(`   - ID: ${user.id}`);
        console.log(`   - Nome: ${user.name}`);
        console.log(`   - Role: ${user.role}`);
        console.log(`   - Ativo: ${user.isActive}`);
        console.log(`   - Criado: ${user.createdAt}`);
        
        // Testar senha 123456
        const isValid123456 = await bcrypt.compare('123456', user.password);
        console.log(`   - Senha '123456' funciona: ${isValid123456 ? '✅ SIM' : '❌ NÃO'}`);
        
        if (!isValid123456 && (user.email === 'trainer@test.com' || user.email === 'client@test.com')) {
          console.log('   🔧 Atualizando senha para 123456...');
          const newHash = await bcrypt.hash('123456', 10);
          await prisma.user.update({
            where: { id: user.id },
            data: { password: newHash },
          });
          console.log('   ✅ Senha atualizada!');
        }
      }
    }
    
    // 4. Verificar perfis
    console.log('\n4️⃣ Verificando perfis:');
    const trainerProfiles = await prisma.trainerProfile.count();
    const clientProfiles = await prisma.clientProfile.count();
    console.log(`   - Perfis de Trainer: ${trainerProfiles}`);
    console.log(`   - Perfis de Client: ${clientProfiles}`);
    
    // 5. Criar perfis se necessário
    const usersNeedingProfiles = await prisma.user.findMany({
      where: {
        OR: [
          {
            role: 'TRAINER',
            trainerProfile: null,
          },
          {
            role: 'CLIENT',
            clientProfile: null,
          },
        ],
      },
    });
    
    for (const user of usersNeedingProfiles) {
      if (user.role === 'TRAINER') {
        console.log(`   🔧 Criando perfil de trainer para ${user.email}`);
        await prisma.trainerProfile.create({
          data: {
            userId: user.id,
            bio: 'Test trainer profile',
            specialties: 'Testing',
            experience: 1,
            hourlyRate: 100,
          },
        });
      } else if (user.role === 'CLIENT') {
        console.log(`   🔧 Criando perfil de client para ${user.email}`);
        await prisma.clientProfile.create({
          data: {
            userId: user.id,
            goals: 'Test goals',
            birthDate: new Date('1990-01-01'),
          },
        });
      }
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ TESTE COMPLETO FINALIZADO!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('📝 CREDENCIAIS QUE DEVEM FUNCIONAR:');
    console.log('   • trainer@test.com / 123456');
    console.log('   • client@test.com / 123456');
    console.log('\n🌐 Site: https://fitness-scheduler-production.up.railway.app/login');
    
  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testComplete();