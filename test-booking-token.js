const { chromium } = require('playwright');

async function testBookingWithToken() {
  const browser = await chromium.launch({ 
    headless: false, 
    slowMo: 500 
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Monitor network requests
  page.on('request', request => {
    if (request.url().includes('/api/appointments') && request.method() === 'POST') {
      console.log('\n📤 POST to /api/appointments');
      console.log('   Headers:', request.headers());
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('/api/appointments') && response.request().method() === 'POST') {
      console.log(`   Response: ${response.status()}`);
    }
  });
  
  try {
    console.log('🔍 TESTE DE TOKEN NO AGENDAMENTO\n');
    console.log('='.repeat(60));
    
    // 1. LOGIN
    console.log('\n1️⃣ LOGIN');
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="email"]', 'test-client@fitness.com');
    await page.fill('input[name="password"]', '123456');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Check token
    const authData = await page.evaluate(() => {
      return {
        token: localStorage.getItem('token'),
        accessToken: localStorage.getItem('accessToken'),
        user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).name : null
      };
    });
    
    console.log('   ✅ Logged in as:', authData.user);
    console.log('   Token present:', !!authData.token);
    
    // 2. GO TO SCHEDULE
    console.log('\n2️⃣ INDO PARA AGENDAMENTO');
    await page.goto('http://localhost:3000/schedule');
    await page.waitForTimeout(2000);
    
    // 3. SELECT TRAINER
    console.log('\n3️⃣ SELECIONANDO TRAINER');
    const trainers = await page.locator('.card').count();
    console.log(`   ${trainers} trainers disponíveis`);
    
    if (trainers > 0) {
      await page.locator('.card').first().click();
      await page.waitForTimeout(2000);
      
      // 4. SELECT SERVICE
      console.log('\n4️⃣ SELECIONANDO SERVIÇO');
      const services = await page.locator('.card').count();
      if (services > 1) {
        await page.locator('.card').nth(1).click();
        await page.waitForTimeout(1000);
        
        // Click continue if needed
        const continueBtn = await page.locator('button:has-text("Continuar")').isVisible().catch(() => false);
        if (continueBtn) {
          await page.locator('button:has-text("Continuar")').click();
          await page.waitForTimeout(2000);
        }
        
        // 5. SELECT DATE (Monday)
        console.log('\n5️⃣ SELECIONANDO DATA');
        // Try to find Monday (25th)
        const dateBtn = await page.locator('button').filter({ hasText: /^25$/ }).first();
        if (await dateBtn.isVisible()) {
          await dateBtn.click();
          await page.waitForTimeout(3000);
          
          // 6. SELECT TIME SLOT
          console.log('\n6️⃣ SELECIONANDO HORÁRIO');
          const timeSlots = await page.locator('button').filter({ hasText: /:/ }).count();
          console.log(`   ${timeSlots} horários disponíveis`);
          
          if (timeSlots > 0) {
            await page.locator('button').filter({ hasText: /:/ }).first().click();
            await page.waitForTimeout(1000);
            
            // 7. ADD NOTES (optional)
            const notesField = await page.locator('textarea').first();
            if (await notesField.isVisible()) {
              await notesField.fill('Teste de agendamento com token');
            }
            
            // 8. CLICK REVIEW/CONFIRM BUTTON
            console.log('\n7️⃣ REVISANDO AGENDAMENTO');
            const reviewBtn = await page.locator('button:has-text(/Revisar|Review|Confirmar/)').first();
            if (await reviewBtn.isVisible()) {
              await reviewBtn.click();
              await page.waitForTimeout(2000);
              
              // 9. FINAL CONFIRMATION
              console.log('\n8️⃣ CONFIRMANDO AGENDAMENTO');
              const confirmBtn = await page.locator('button:has-text(/Confirmar|Confirm/)').last();
              if (await confirmBtn.isVisible()) {
                console.log('   Clicando em confirmar...');
                
                // Monitor the response
                const responsePromise = page.waitForResponse(
                  response => response.url().includes('/api/appointments') && response.request().method() === 'POST',
                  { timeout: 10000 }
                );
                
                await confirmBtn.click();
                
                try {
                  const response = await responsePromise;
                  const status = response.status();
                  const body = await response.json().catch(() => null);
                  
                  console.log(`\n   Response Status: ${status}`);
                  
                  if (status === 200 || status === 201) {
                    console.log('   ✅ AGENDAMENTO CRIADO COM SUCESSO!');
                  } else {
                    console.log('   ❌ Erro no agendamento');
                    if (body && body.error) {
                      console.log(`   Erro: ${body.error}`);
                    }
                  }
                } catch (error) {
                  console.log('   ⚠️  Timeout esperando resposta');
                }
                
                // Check for any alert/error message
                await page.waitForTimeout(2000);
                const alerts = await page.locator('[role="alert"], .alert, .error').all();
                for (const alert of alerts) {
                  const text = await alert.textContent();
                  console.log(`   Alert: ${text}`);
                }
              }
            }
          }
        }
      }
    }
    
  } catch (error) {
    console.error('\n❌ Erro no teste:', error.message);
  } finally {
    console.log('\n' + '='.repeat(60));
    console.log('📊 TESTE CONCLUÍDO\n');
    
    // Final token check
    const finalAuth = await page.evaluate(() => {
      return {
        hasToken: !!localStorage.getItem('token'),
        hasUser: !!localStorage.getItem('user')
      };
    });
    
    console.log('Estado final:');
    console.log(`   Token presente: ${finalAuth.hasToken ? '✅' : '❌'}`);
    console.log(`   Usuário logado: ${finalAuth.hasUser ? '✅' : '❌'}`);
    
    console.log('='.repeat(60));
    
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

testBookingWithToken();