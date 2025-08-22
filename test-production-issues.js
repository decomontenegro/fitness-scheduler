const { chromium } = require('playwright');

async function testProductionIssues() {
  const browser = await chromium.launch({ 
    headless: false, 
    slowMo: 1000 
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const PRODUCTION_URL = 'https://fitness-scheduler-production.up.railway.app';
  
  // Monitor console for errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ Console Error:', msg.text());
    }
  });
  
  // Monitor network failures
  page.on('requestfailed', request => {
    console.log('❌ Request failed:', request.url());
  });
  
  try {
    console.log('🔍 INVESTIGANDO PROBLEMAS EM PRODUÇÃO\n');
    console.log('='.repeat(60));
    
    // 1. LOGIN TEST
    console.log('\n1️⃣ TESTE DE LOGIN');
    await page.goto(`${PRODUCTION_URL}/login`);
    await page.waitForTimeout(2000);
    
    await page.fill('input[name="email"]', 'test-client@fitness.com');
    await page.fill('input[name="password"]', '123456');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(5000);
    
    const afterLoginUrl = page.url();
    console.log(`   URL após login: ${afterLoginUrl}`);
    
    // Check localStorage and cookies
    const authData = await page.evaluate(() => {
      return {
        token: localStorage.getItem('token'),
        accessToken: localStorage.getItem('accessToken'),
        user: localStorage.getItem('user'),
        cookies: document.cookie
      };
    });
    
    console.log('   Token salvo:', authData.token ? '✅ SIM' : '❌ NÃO');
    console.log('   User salvo:', authData.user ? '✅ SIM' : '❌ NÃO');
    console.log('   Cookies:', authData.cookies ? '✅ SIM' : '❌ NÃO');
    
    // 2. NAVIGATE TO SCHEDULE
    console.log('\n2️⃣ TESTE DA PÁGINA DE AGENDAMENTO');
    await page.goto(`${PRODUCTION_URL}/schedule`);
    await page.waitForTimeout(3000);
    
    const scheduleUrl = page.url();
    console.log(`   URL atual: ${scheduleUrl}`);
    
    if (scheduleUrl.includes('login')) {
      console.log('   ❌ PROBLEMA: Redirecionado para login!');
      
      // Try to check middleware
      const authCheck = await page.evaluate(() => {
        return {
          hasToken: !!localStorage.getItem('token'),
          hasCookie: document.cookie.includes('auth-token')
        };
      });
      console.log('   Token presente:', authCheck.hasToken ? 'SIM' : 'NÃO');
      console.log('   Cookie presente:', authCheck.hasCookie ? 'SIM' : 'NÃO');
    } else {
      console.log('   ✅ Permaneceu na página de agendamento');
      
      // Check for trainers
      const trainers = await page.locator('.card').count();
      console.log(`   Trainers encontrados: ${trainers}`);
      
      if (trainers > 0) {
        // Click first trainer
        console.log('\n3️⃣ SELECIONANDO TRAINER');
        await page.locator('.card').first().click();
        await page.waitForTimeout(3000);
        
        // Check for services
        const services = await page.locator('.card').count();
        console.log(`   Serviços encontrados: ${services}`);
        
        if (services > 1) {
          // Select service
          await page.locator('.card').nth(1).click();
          await page.waitForTimeout(2000);
          
          // Check for continue button
          const continueBtn = await page.locator('button:has-text("Continuar")').isVisible().catch(() => false);
          if (continueBtn) {
            await page.locator('button:has-text("Continuar")').click();
            await page.waitForTimeout(3000);
          }
          
          // Check for calendar
          console.log('\n4️⃣ VERIFICANDO CALENDÁRIO E HORÁRIOS');
          const hasCalendar = await page.locator('button').filter({ hasText: /^[0-9]+$/ }).count() > 0;
          console.log(`   Calendário visível: ${hasCalendar ? '✅ SIM' : '❌ NÃO'}`);
          
          if (hasCalendar) {
            // Select a date
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dayNum = tomorrow.getDate();
            
            const dateBtn = await page.locator(`button`).filter({ hasText: new RegExp(`^${dayNum}$`) }).first();
            if (dateBtn) {
              await dateBtn.click();
              await page.waitForTimeout(3000);
              
              // CHECK FOR TIME SLOTS
              console.log('\n5️⃣ VERIFICANDO HORÁRIOS DISPONÍVEIS');
              
              // Check for time slots
              const timeSlots = await page.locator('button').filter({ hasText: /:/ }).count();
              console.log(`   Horários encontrados: ${timeSlots}`);
              
              if (timeSlots === 0) {
                console.log('   ❌ PROBLEMA: Nenhum horário aparecendo!');
                
                // Check for error messages
                const pageText = await page.textContent('body');
                if (pageText.includes('Nenhum horário')) {
                  console.log('   Mensagem: "Nenhum horário disponível"');
                }
                if (pageText.includes('Invalid Date')) {
                  console.log('   ❌ PROBLEMA: "Invalid Date" encontrado!');
                }
                
                // Check API call
                const apiResponse = await page.evaluate(async (trainerId) => {
                  const date = new Date();
                  date.setDate(date.getDate() + 1);
                  const dateStr = date.toISOString().split('T')[0];
                  
                  try {
                    const response = await fetch(`/api/trainers/${trainerId}/availability?date=${dateStr}`);
                    const data = await response.json();
                    return { 
                      status: response.status, 
                      slots: data.slots ? data.slots.length : 0,
                      error: data.error 
                    };
                  } catch (error) {
                    return { error: error.message };
                  }
                }, 'cmej0sgtt0004rtsaj7cnd495'); // João's ID
                
                console.log('   API Response:', apiResponse);
              } else {
                console.log('   ✅ Horários aparecendo corretamente');
                
                // Try to select a time slot
                await page.locator('button').filter({ hasText: /:/ }).first().click();
                await page.waitForTimeout(2000);
                
                // Check for confirmation button
                const confirmBtn = await page.locator('button:has-text(/Confirmar|Agendar|Revisar/)').isVisible().catch(() => false);
                console.log(`   Botão de confirmação: ${confirmBtn ? '✅ Visível' : '❌ Não encontrado'}`);
              }
            }
          }
        }
      }
    }
    
    // 6. CHECK AUTHENTICATION STATE
    console.log('\n6️⃣ VERIFICANDO ESTADO DE AUTENTICAÇÃO');
    
    const finalAuthData = await page.evaluate(() => {
      return {
        localStorage: {
          token: !!localStorage.getItem('token'),
          user: !!localStorage.getItem('user'),
          accessToken: !!localStorage.getItem('accessToken')
        },
        cookies: document.cookie.includes('auth-token')
      };
    });
    
    console.log('   LocalStorage:', finalAuthData.localStorage);
    console.log('   Cookie auth-token:', finalAuthData.cookies ? 'PRESENTE' : 'AUSENTE');
    
  } catch (error) {
    console.error('\n❌ Erro durante teste:', error.message);
  } finally {
    console.log('\n' + '='.repeat(60));
    console.log('📊 DIAGNÓSTICO DOS PROBLEMAS\n');
    
    console.log('PROBLEMA 1: Horários não aparecem');
    console.log('  - Possível causa: API de disponibilidade não retornando dados');
    console.log('  - Ou: Problema com formato de data/hora');
    
    console.log('\nPROBLEMA 2: Redirecionamento para login');
    console.log('  - Possível causa: Middleware não reconhecendo token');
    console.log('  - Ou: Cookie não sendo enviado corretamente');
    
    console.log('='.repeat(60));
    
    await page.waitForTimeout(15000); // Keep open for manual inspection
    await browser.close();
  }
}

testProductionIssues();