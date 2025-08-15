// Script de debug específico para Railway
console.log('🔍 Railway Database Debug Script');
console.log('=================================\n');

// 1. Verificar variáveis de ambiente
console.log('1️⃣ VARIÁVEIS DE AMBIENTE:');
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('RAILWAY_ENVIRONMENT:', process.env.RAILWAY_ENVIRONMENT);
console.log('');

// 2. Analisar DATABASE_URL (sem expor senha)
if (process.env.DATABASE_URL) {
  const url = process.env.DATABASE_URL;
  console.log('2️⃣ ANÁLISE DA DATABASE_URL:');
  
  // Parse da URL
  try {
    const urlParts = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:\/]+):?(\d+)?\/(.+)/);
    if (urlParts) {
      console.log('User:', urlParts[1]);
      console.log('Password:', urlParts[2] ? '***' + urlParts[2].slice(-3) : 'NOT SET');
      console.log('Host:', urlParts[3]);
      console.log('Port:', urlParts[4] || '5432');
      console.log('Database:', urlParts[5]);
      
      // Verificar se é URL interna ou pública
      if (urlParts[3].includes('railway.internal')) {
        console.log('Type: INTERNAL URL (railway.internal)');
      } else if (urlParts[3].includes('viaduct')) {
        console.log('Type: PUBLIC URL (viaduct.proxy)');
      } else {
        console.log('Type: UNKNOWN');
      }
    }
  } catch (e) {
    console.log('Error parsing URL:', e.message);
  }
  console.log('');
}

// 3. Testar conexão com pg nativo
console.log('3️⃣ TESTANDO CONEXÃO DIRETA (pg):');
const { Client } = require('pg');

async function testDirectConnection() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('Connecting...');
    await client.connect();
    console.log('✅ Connected successfully!');
    
    // Testar query simples
    const res = await client.query('SELECT NOW()');
    console.log('Current time from DB:', res.rows[0].now);
    
    // Verificar se tabelas existem
    const tables = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
    `);
    console.log('Tables found:', tables.rows.map(r => r.tablename).join(', ') || 'NO TABLES');
    
    await client.end();
    console.log('✅ Connection test successful!\n');
    return true;
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    console.error('Error code:', err.code);
    if (err.code === 'ENOTFOUND') {
      console.log('→ Host not found. Check if database service is running.');
    } else if (err.code === '28P01') {
      console.log('→ Invalid password. Check DATABASE_URL credentials.');
    } else if (err.code === 'ECONNREFUSED') {
      console.log('→ Connection refused. Database might be down.');
    }
    console.log('');
    return false;
  }
}

// 4. Testar com Prisma
console.log('4️⃣ TESTANDO COM PRISMA:');
const { PrismaClient } = require('@prisma/client');

async function testPrismaConnection() {
  const prisma = new PrismaClient({
    log: ['error'],
  });

  try {
    await prisma.$connect();
    console.log('✅ Prisma connected!');
    
    // Contar usuários
    const userCount = await prisma.user.count();
    console.log(`Users in database: ${userCount}`);
    
    await prisma.$disconnect();
    return true;
  } catch (error) {
    console.error('❌ Prisma failed:', error.message);
    return false;
  }
}

// Executar testes
async function runAllTests() {
  const pgSuccess = await testDirectConnection();
  
  if (pgSuccess) {
    await testPrismaConnection();
  }
  
  console.log('\n📊 RESUMO:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  if (!process.env.DATABASE_URL) {
    console.log('❌ DATABASE_URL não está configurada!');
    console.log('SOLUÇÃO: Configure DATABASE_URL nas variáveis do Railway');
  } else if (!pgSuccess) {
    console.log('❌ Não consegue conectar ao banco!');
    console.log('SOLUÇÕES POSSÍVEIS:');
    console.log('1. Verifique se o serviço Postgres está rodando');
    console.log('2. Use Add Reference para DATABASE_URL');
    console.log('3. Tente usar a URL pública ao invés da interna');
  } else {
    console.log('✅ Conexão funcionando!');
    console.log('Execute: node create-users-force.js');
  }
}

runAllTests();