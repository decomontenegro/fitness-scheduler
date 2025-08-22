const { chromium } = require('playwright');

async function testProduction() {
  const browser = await chromium.launch({ 
    headless: false, 
    slowMo: 500 
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const PRODUCTION_URL = 'https://fitness-scheduler-production.up.railway.app';
  let totalTests = 0;
  let passedTests = 0;
  const issues = [];
  
  // Monitor console errors
  page.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('404') && !msg.text().includes('favicon')) {
      issues.push(`Console error: ${msg.text().substring(0, 100)}`);
    }
  });
  
  try {
    console.log('🚀 TESTE DE PRODUÇÃO - FITNESS SCHEDULER\n');
    console.log('URL: ' + PRODUCTION_URL);
    console.log('='.repeat(60));
    
    // 1. Homepage Test
    console.log('\n1️⃣ TESTE DA HOMEPAGE');
    totalTests++;
    await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });
    const title = await page.title();
    if (title) {
      passedTests++;
      console.log(`   ✅ Homepage carregada: "${title}"`);
    } else {
      console.log('   ❌ Homepage não carregou');
      issues.push('Homepage não carregou corretamente');
    }
    
    // 2. Login Page Test
    console.log('\n2️⃣ TESTE DA PÁGINA DE LOGIN');
    totalTests++;
    await page.goto(`${PRODUCTION_URL}/login`, { waitUntil: 'networkidle' });
    const hasLoginForm = await page.locator('input[name="email"]').isVisible().catch(() => false);
    if (hasLoginForm) {
      passedTests++;
      console.log('   ✅ Página de login funcionando');
    } else {
      console.log('   ❌ Formulário de login não encontrado');
      issues.push('Página de login com problemas');
    }
    
    // 3. Test Login
    console.log('\n3️⃣ TESTE DE LOGIN');
    totalTests++;
    if (hasLoginForm) {
      await page.fill('input[name="email"]', 'test-client@fitness.com');
      await page.fill('input[name="password"]', '123456');
      await page.click('button[type="submit"]');
      
      // Wait for navigation
      await page.waitForTimeout(5000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('dashboard')) {
        passedTests++;
        console.log('   ✅ Login bem-sucedido');
        console.log(`   URL atual: ${currentUrl}`);
      } else {
        console.log('   ❌ Login falhou');
        console.log(`   URL atual: ${currentUrl}`);
        issues.push('Login não está funcionando');
      }
    }
    
    // 4. Dashboard Test
    console.log('\n4️⃣ TESTE DO DASHBOARD');
    totalTests++;
    const dashboardVisible = await page.locator('text=/Dashboard|Painel|Olá/').isVisible().catch(() => false);
    if (dashboardVisible) {
      passedTests++;
      console.log('   ✅ Dashboard carregado');
    } else {
      console.log('   ❌ Dashboard não carregou');
      issues.push('Dashboard com problemas');
    }
    
    // 5. Schedule/Booking Test
    console.log('\n5️⃣ TESTE DE AGENDAMENTO');
    totalTests++;
    await page.goto(`${PRODUCTION_URL}/schedule`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    const hasSchedulePage = await page.locator('text=/Agendamento|Schedule|Trainer/').isVisible().catch(() => false);
    if (hasSchedulePage) {
      passedTests++;
      console.log('   ✅ Página de agendamento funcionando');
      
      // Check for trainers
      const trainers = await page.locator('.card').count();
      console.log(`   📊 ${trainers} trainers disponíveis`);
    } else {
      console.log('   ❌ Página de agendamento não carregou');
      issues.push('Página de agendamento com problemas');
    }
    
    // 6. Appointments Test
    console.log('\n6️⃣ TESTE DE APPOINTMENTS');
    totalTests++;
    await page.goto(`${PRODUCTION_URL}/appointments`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    const hasAppointments = await page.locator('text=/Agendamentos|Appointments/').isVisible().catch(() => false);
    if (hasAppointments) {
      passedTests++;
      console.log('   ✅ Página de appointments funcionando');
    } else {
      console.log('   ❌ Página de appointments não carregou');
      issues.push('Página de appointments com problemas');
    }
    
    // 7. API Health Check
    console.log('\n7️⃣ TESTE DA API');
    totalTests++;
    const apiResponse = await page.evaluate(async (url) => {
      try {
        const response = await fetch(`${url}/api/health`);
        return { status: response.status, ok: response.ok };
      } catch (error) {
        return { error: error.message };
      }
    }, PRODUCTION_URL);
    
    if (apiResponse.ok) {
      passedTests++;
      console.log('   ✅ API respondendo corretamente');
    } else {
      console.log('   ❌ API com problemas');
      console.log('   Response:', apiResponse);
      issues.push('API não está respondendo corretamente');
    }
    
    // 8. Database Connection Test
    console.log('\n8️⃣ TESTE DE CONEXÃO COM BANCO');
    totalTests++;
    const trainersResponse = await page.evaluate(async (url) => {
      try {
        const response = await fetch(`${url}/api/trainers`);
        const data = await response.json();
        return { 
          status: response.status, 
          hasData: data.trainers && data.trainers.length > 0,
          count: data.trainers ? data.trainers.length : 0
        };
      } catch (error) {
        return { error: error.message };
      }
    }, PRODUCTION_URL);
    
    if (trainersResponse.hasData) {
      passedTests++;
      console.log(`   ✅ Banco de dados conectado (${trainersResponse.count} trainers)`);
    } else {
      console.log('   ❌ Problema com banco de dados');
      console.log('   Response:', trainersResponse);
      issues.push('Banco de dados não está retornando dados');
    }
    
  } catch (error) {
    console.error('\n❌ Erro no teste:', error.message);
    issues.push(`Erro geral: ${error.message}`);
  } finally {
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESULTADO DO TESTE DE PRODUÇÃO\n');
    
    const percentage = Math.round((passedTests / totalTests) * 100);
    console.log(`   Testes passados: ${passedTests}/${totalTests}`);
    console.log(`   Taxa de sucesso: ${percentage}%`);
    
    if (issues.length > 0) {
      console.log('\n⚠️  PROBLEMAS ENCONTRADOS:');
      issues.forEach((issue, i) => {
        console.log(`   ${i + 1}. ${issue}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    
    if (percentage === 100) {
      console.log('\n🎉 PRODUÇÃO 100% FUNCIONAL!');
      console.log('   Todos os testes passaram com sucesso');
      console.log('   Sistema pronto para uso');
    } else if (percentage >= 75) {
      console.log(`\n✅ PRODUÇÃO ${percentage}% FUNCIONAL`);
      console.log('   Sistema operacional com pequenos ajustes necessários');
    } else {
      console.log(`\n⚠️  PRODUÇÃO APENAS ${percentage}% FUNCIONAL`);
      console.log('   Sistema precisa de correções antes de ser usado');
    }
    
    console.log('\n🔗 URL de Produção: ' + PRODUCTION_URL);
    console.log('📧 Credenciais de teste:');
    console.log('   Cliente: test-client@fitness.com / 123456');
    console.log('   Trainer: test-trainer@fitness.com / 123456');
    console.log('='.repeat(60));
    
    await page.waitForTimeout(10000); // Keep open for inspection
    await browser.close();
  }
}

testProduction();