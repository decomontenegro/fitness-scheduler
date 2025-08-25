const { chromium } = require('playwright');

async function testProductionFinal() {
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
  
  try {
    console.log('🚀 TESTE FINAL DE PRODUÇÃO\n');
    console.log('URL: ' + PRODUCTION_URL);
    console.log('='.repeat(60));
    
    // 1. LOGIN TEST
    console.log('\n1️⃣ TESTE DE LOGIN');
    totalTests++;
    
    await page.goto(`${PRODUCTION_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    await page.fill('input[name="email"]', 'test-client@fitness.com');
    await page.fill('input[name="password"]', '123456');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(5000);
    
    const afterLoginUrl = page.url();
    if (afterLoginUrl.includes('dashboard')) {
      passedTests++;
      console.log('   ✅ Login funcionando');
      console.log(`   URL: ${afterLoginUrl}`);
    } else {
      console.log('   ❌ Login falhou');
      issues.push('Login não redirecionou para dashboard');
    }
    
    // Check auth persistence
    const authData = await page.evaluate(() => {
      return {
        hasToken: !!localStorage.getItem('token'),
        hasCookie: document.cookie.includes('auth-token')
      };
    });
    console.log(`   Token: ${authData.hasToken ? '✅' : '❌'}`);
    console.log(`   Cookie: ${authData.hasCookie ? '✅' : '❌'}`);
    
    // 2. SCHEDULE PAGE TEST
    console.log('\n2️⃣ TESTE DE AGENDAMENTO');
    totalTests++;
    
    await page.goto(`${PRODUCTION_URL}/schedule`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    
    const scheduleUrl = page.url();
    if (!scheduleUrl.includes('login')) {
      passedTests++;
      console.log('   ✅ Acesso à página de agendamento mantido');
      
      // Check for trainers
      const trainers = await page.locator('.card').count();
      console.log(`   📊 ${trainers} trainers disponíveis`);
      
      if (trainers > 0) {
        // 3. BOOKING FLOW TEST
        console.log('\n3️⃣ TESTE DO FLUXO DE RESERVA');
        totalTests++;
        
        // Click first trainer
        await page.locator('.card').first().click();
        await page.waitForTimeout(2000);
        
        // Check for services
        const services = await page.locator('.card').count();
        if (services > 1) {
          // Select service
          await page.locator('.card').nth(1).click();
          await page.waitForTimeout(1000);
          
          // Click continue if present
          const continueBtn = await page.locator('button:has-text("Continuar")').isVisible().catch(() => false);
          if (continueBtn) {
            await page.locator('button:has-text("Continuar")').click();
            await page.waitForTimeout(2000);
          }
          
          // Select a weekday (Monday = 25)
          const dateBtn = await page.locator('button').filter({ hasText: /^25$/ }).first();
          if (await dateBtn.isVisible()) {
            await dateBtn.click();
            await page.waitForTimeout(3000);
            
            // CHECK FOR TIME SLOTS
            console.log('\n4️⃣ VERIFICANDO HORÁRIOS');
            totalTests++;
            
            const timeSlots = await page.locator('button').filter({ hasText: /:/ }).count();
            console.log(`   📅 ${timeSlots} horários disponíveis`);
            
            if (timeSlots > 0) {
              passedTests += 2; // Booking flow + time slots
              console.log('   ✅ Horários aparecendo corretamente!');
              
              // Get sample time slots
              const firstSlot = await page.locator('button').filter({ hasText: /:/ }).first().textContent();
              console.log(`   Primeiro horário: ${firstSlot}`);
              
              // Check for Invalid Date
              const pageText = await page.textContent('body');
              if (pageText.includes('Invalid Date')) {
                console.log('   ⚠️  Ainda tem "Invalid Date" em algum lugar');
                issues.push('Invalid Date ainda presente');
              } else {
                console.log('   ✅ Sem problemas de "Invalid Date"');
              }
            } else {
              console.log('   ❌ Nenhum horário aparecendo');
              issues.push('Horários não aparecem');
            }
          }
        }
      }
    } else {
      console.log('   ❌ Redirecionado para login');
      issues.push('Página de agendamento redirecionou para login');
    }
    
    // 5. APPOINTMENTS PAGE TEST
    console.log('\n5️⃣ TESTE DE APPOINTMENTS');
    totalTests++;
    
    await page.goto(`${PRODUCTION_URL}/appointments`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    
    const appointmentsUrl = page.url();
    if (!appointmentsUrl.includes('login')) {
      passedTests++;
      console.log('   ✅ Página de appointments acessível');
    } else {
      console.log('   ❌ Redirecionado para login');
      issues.push('Appointments redirecionou para login');
    }
    
    // 6. PROFILE TEST
    console.log('\n6️⃣ TESTE DO PERFIL');
    totalTests++;
    
    await page.goto(`${PRODUCTION_URL}/profile`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    const profileUrl = page.url();
    if (!profileUrl.includes('login')) {
      passedTests++;
      console.log('   ✅ Página de perfil acessível');
    } else {
      console.log('   ❌ Redirecionado para login');
      issues.push('Profile redirecionou para login');
    }
    
  } catch (error) {
    console.error('\n❌ Erro no teste:', error.message);
    issues.push(`Erro: ${error.message}`);
  } finally {
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESULTADO FINAL\n');
    
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
    
    if (percentage === 100 && issues.length === 0) {
      console.log('\n🎉 PRODUÇÃO 100% FUNCIONAL!');
      console.log('   ✅ Login funcionando');
      console.log('   ✅ Sessão mantida');
      console.log('   ✅ Horários aparecendo');
      console.log('   ✅ Sem redirecionamentos indevidos');
    } else if (percentage >= 80) {
      console.log(`\n✅ PRODUÇÃO ${percentage}% FUNCIONAL`);
      console.log('   Sistema operacional!');
    } else {
      console.log(`\n⚠️  PRODUÇÃO ${percentage}% FUNCIONAL`);
      console.log('   Ainda precisa de ajustes');
    }
    
    console.log('\n🔗 ' + PRODUCTION_URL);
    console.log('='.repeat(60));
    
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

testProductionFinal();