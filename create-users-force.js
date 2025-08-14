// Script forçado para criar usuários com qualquer banco
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Força a criação mesmo com erros
const prisma = new PrismaClient({
  log: ['error'],
  errorFormat: 'minimal',
});

async function forceCreateUsers() {
  console.log('🚀 FORÇANDO CRIAÇÃO DE USUÁRIOS...\n');
  
  const password = '123456';
  const hashedPassword = await bcrypt.hash(password, 10);
  
  try {
    // Tenta conectar
    await prisma.$connect();
    console.log('✅ Conectado ao banco!\n');
    
    // Força criação do trainer
    console.log('Criando trainer@test.com...');
    try {
      await prisma.$executeRaw`
        INSERT INTO "User" (id, email, password, name, role, phone, "isActive", "createdAt", "updatedAt")
        VALUES (
          'trainer_' || substr(md5(random()::text), 1, 8),
          'trainer@test.com',
          ${hashedPassword},
          'Test Trainer',
          'TRAINER',
          '11999999999',
          true,
          NOW(),
          NOW()
        )
        ON CONFLICT (email) 
        DO UPDATE SET 
          password = ${hashedPassword},
          "isActive" = true,
          "updatedAt" = NOW()
      `;
      console.log('✅ Trainer criado/atualizado!');
    } catch (e) {
      console.log('⚠️ Erro no trainer:', e.message);
    }
    
    // Força criação do client
    console.log('\nCriando client@test.com...');
    try {
      await prisma.$executeRaw`
        INSERT INTO "User" (id, email, password, name, role, phone, "isActive", "createdAt", "updatedAt")
        VALUES (
          'client_' || substr(md5(random()::text), 1, 8),
          'client@test.com',
          ${hashedPassword},
          'Test Client',
          'CLIENT',
          '11888888888',
          true,
          NOW(),
          NOW()
        )
        ON CONFLICT (email) 
        DO UPDATE SET 
          password = ${hashedPassword},
          "isActive" = true,
          "updatedAt" = NOW()
      `;
      console.log('✅ Client criado/atualizado!');
    } catch (e) {
      console.log('⚠️ Erro no client:', e.message);
    }
    
    // Lista usuários
    console.log('\n📊 Verificando usuários criados:');
    try {
      const users = await prisma.$queryRaw`
        SELECT email, role, "isActive" 
        FROM "User" 
        WHERE email IN ('trainer@test.com', 'client@test.com')
      `;
      
      if (users && users.length > 0) {
        users.forEach(u => {
          console.log(`   ✅ ${u.email} (${u.role}) - Ativo: ${u.isActive}`);
        });
      }
    } catch (e) {
      console.log('⚠️ Não foi possível verificar usuários');
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ PROCESSO COMPLETO!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🔑 Credenciais:');
    console.log('   trainer@test.com / 123456');
    console.log('   client@test.com / 123456');
    
  } catch (error) {
    console.error('\n❌ Erro geral:', error.message);
    console.log('\n⚠️ IMPORTANTE:');
    console.log('1. Verifique se a DATABASE_URL está correta');
    console.log('2. Crie um novo banco PostgreSQL no Railway');
    console.log('3. Use a nova URL de conexão');
  } finally {
    await prisma.$disconnect();
  }
}

forceCreateUsers();