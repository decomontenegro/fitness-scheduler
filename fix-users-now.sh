#!/bin/bash

echo "🔧 Fixing Users in Railway Production"
echo "===================================="
echo ""

cd "/Users/andremontenegro/agendamento claude code/fitness-scheduler"

echo "📊 Checking Railway connection..."
railway status

echo ""
echo "🚀 Option 1: Quick Fix via Railway Shell"
echo "========================================"
echo "Run these commands:"
echo ""
echo -e "\033[0;32m"
echo "railway shell"
echo "npm run diagnose"
echo "exit"
echo -e "\033[0m"
echo ""

echo "🔄 Option 2: Force Reset and Reseed"
echo "===================================="
echo "⚠️  WARNING: This will delete all data!"
echo ""
echo -e "\033[0;32m"
echo "railway shell"
echo "npx prisma migrate reset --force"
echo "npm run seed-production"
echo "exit"
echo -e "\033[0m"
echo ""

echo "🌐 Option 3: Use Railway Run Command"
echo "====================================="
echo "This connects to production database:"
echo ""
echo -e "\033[0;32m"
echo "railway shell"
echo "node -e \"
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function fix() {
  const hash = await bcrypt.hash('123456', 10);
  
  // Create trainer
  await prisma.user.upsert({
    where: { email: 'trainer@test.com' },
    update: { password: hash },
    create: {
      email: 'trainer@test.com',
      password: hash,
      name: 'Test Trainer',
      role: 'TRAINER',
      phone: '11999999999',
      isActive: true
    }
  });
  
  // Create client
  await prisma.user.upsert({
    where: { email: 'client@test.com' },
    update: { password: hash },
    create: {
      email: 'client@test.com',
      password: hash,
      name: 'Test Client',
      role: 'CLIENT',
      phone: '11888888888',
      isActive: true
    }
  });
  
  console.log('✅ Users created/updated!');
  await prisma.\$disconnect();
}

fix().catch(console.error);
\""
echo "exit"
echo -e "\033[0m"
echo ""

echo "📝 After running any option above:"
echo "=================================="
echo "Test the login at:"
echo "https://fitness-scheduler-production.up.railway.app/login"
echo ""
echo "With credentials:"
echo "- trainer@test.com / 123456"
echo "- client@test.com / 123456"
echo ""