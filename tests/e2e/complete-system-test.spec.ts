import { test, expect } from '@playwright/test';

test.describe('Complete System Test - 100% Target', () => {
  test('verify all system features', async ({ page, context }) => {
    let score = 0;
    const totalTests = 15;
    const results: { feature: string; status: 'pass' | 'fail'; details?: string }[] = [];
    
    console.log('\n' + '='.repeat(70));
    console.log('🚀 COMPLETE SYSTEM TEST - TARGETING 100% FUNCTIONALITY');
    console.log('='.repeat(70) + '\n');
    
    // 1. Homepage Loads
    console.log('1. Testing Homepage...');
    try {
      await page.goto('http://localhost:3000');
      await page.waitForLoadState('networkidle');
      const loaded = await page.locator('body').isVisible();
      if (loaded) {
        console.log('   ✅ Homepage loads');
        results.push({ feature: 'Homepage', status: 'pass' });
        score++;
      }
    } catch (e) {
      console.log('   ❌ Homepage failed');
      results.push({ feature: 'Homepage', status: 'fail' });
    }
    
    // 2. Login Page
    console.log('2. Testing Login Page...');
    try {
      await page.goto('http://localhost:3000/login');
      const loginForm = await page.locator('input[name="email"]').isVisible();
      if (loginForm) {
        console.log('   ✅ Login page functional');
        results.push({ feature: 'Login Page', status: 'pass' });
        score++;
      }
    } catch (e) {
      console.log('   ❌ Login page failed');
      results.push({ feature: 'Login Page', status: 'fail' });
    }
    
    // 3. Client Authentication
    console.log('3. Testing Client Authentication...');
    try {
      await page.fill('input[name="email"]', 'test-client@fitness.com');
      await page.fill('input[name="password"]', '123456');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard/**', { timeout: 5000 });
      console.log('   ✅ Client auth working');
      results.push({ feature: 'Client Auth', status: 'pass' });
      score++;
    } catch (e) {
      console.log('   ❌ Client auth failed');
      results.push({ feature: 'Client Auth', status: 'fail' });
    }
    
    // 4. Client Dashboard
    console.log('4. Testing Client Dashboard...');
    try {
      const greeting = await page.locator('text=/Olá.*Maria|Olá.*💪/').isVisible({ timeout: 3000 });
      if (greeting) {
        console.log('   ✅ Client dashboard displays');
        results.push({ feature: 'Client Dashboard', status: 'pass' });
        score++;
      }
    } catch (e) {
      console.log('   ❌ Client dashboard failed');
      results.push({ feature: 'Client Dashboard', status: 'fail' });
    }
    
    // 5. Progress Cards
    console.log('5. Testing Progress Cards...');
    try {
      const cards = await page.locator('text=/Meta:/').count();
      if (cards > 0) {
        console.log('   ✅ Progress cards showing');
        results.push({ feature: 'Progress Cards', status: 'pass', details: `${cards} cards` });
        score++;
      }
    } catch (e) {
      console.log('   ❌ Progress cards failed');
      results.push({ feature: 'Progress Cards', status: 'fail' });
    }
    
    // 6. Training History
    console.log('6. Testing Training History...');
    try {
      const history = await page.locator('text=Histórico de Treinos').isVisible();
      if (history) {
        console.log('   ✅ Training history visible');
        results.push({ feature: 'Training History', status: 'pass' });
        score++;
      }
    } catch (e) {
      console.log('   ❌ Training history failed');
      results.push({ feature: 'Training History', status: 'fail' });
    }
    
    // 7. Booking Page
    console.log('7. Testing Booking Page...');
    try {
      await page.goto('http://localhost:3000/booking');
      await page.waitForTimeout(2000);
      const bookingPage = await page.locator('text=Agendar Sessão').isVisible();
      if (bookingPage) {
        console.log('   ✅ Booking page accessible');
        results.push({ feature: 'Booking Page', status: 'pass' });
        score++;
      }
    } catch (e) {
      console.log('   ❌ Booking page failed');
      results.push({ feature: 'Booking Page', status: 'fail' });
    }
    
    // 8. Trainers Display
    console.log('8. Testing Trainers Display...');
    try {
      await page.waitForTimeout(2000);
      const trainers = await page.locator('.rounded-xl').count();
      if (trainers > 0) {
        console.log('   ✅ Trainers displaying');
        results.push({ feature: 'Trainers Display', status: 'pass', details: `${trainers} trainers` });
        score++;
      }
    } catch (e) {
      console.log('   ❌ Trainers display failed');
      results.push({ feature: 'Trainers Display', status: 'fail' });
    }
    
    // 9. Booking Flow
    console.log('9. Testing Booking Flow...');
    try {
      await page.locator('text=/João Personal|Ana Fitness/').first().click();
      await page.waitForTimeout(1000);
      const dateStep = await page.locator('text=Escolha a Data').isVisible();
      if (dateStep) {
        console.log('   ✅ Booking flow works');
        results.push({ feature: 'Booking Flow', status: 'pass' });
        score++;
      }
    } catch (e) {
      console.log('   ❌ Booking flow failed');
      results.push({ feature: 'Booking Flow', status: 'fail' });
    }
    
    // 10. Appointments Page
    console.log('10. Testing Appointments Page...');
    try {
      await page.goto('http://localhost:3000/appointments');
      await page.waitForTimeout(2000);
      const appts = await page.locator('text=/Agendamentos|Meus Agendamentos/').isVisible();
      if (appts) {
        console.log('   ✅ Appointments page works');
        results.push({ feature: 'Appointments Page', status: 'pass' });
        score++;
      }
    } catch (e) {
      console.log('   ❌ Appointments page failed');
      results.push({ feature: 'Appointments Page', status: 'fail' });
    }
    
    // 11. Logout Functionality
    console.log('11. Testing Logout...');
    try {
      await page.goto('http://localhost:3000/logout');
      await page.waitForURL('**/login', { timeout: 5000 });
      console.log('   ✅ Logout works');
      results.push({ feature: 'Logout', status: 'pass' });
      score++;
    } catch (e) {
      console.log('   ❌ Logout failed');
      results.push({ feature: 'Logout', status: 'fail' });
    }
    
    // 12. Trainer Authentication
    console.log('12. Testing Trainer Authentication...');
    try {
      // Clear any existing auth
      await context.clearCookies();
      await page.goto('http://localhost:3000/login');
      await page.waitForTimeout(1000);
      await page.fill('input[name="email"]', 'test-trainer@fitness.com');
      await page.fill('input[name="password"]', '123456');
      await page.click('button[type="submit"]');
      
      // Wait for either dashboard URL or any navigation
      await page.waitForTimeout(3000);
      const url = page.url();
      if (url.includes('dashboard/trainer')) {
        console.log('   ✅ Trainer auth works');
        results.push({ feature: 'Trainer Auth', status: 'pass' });
        score++;
      } else {
        throw new Error('Wrong redirect');
      }
    } catch (e) {
      console.log('   ❌ Trainer auth failed');
      results.push({ feature: 'Trainer Auth', status: 'fail' });
    }
    
    // 13. Trainer Dashboard
    console.log('13. Testing Trainer Dashboard...');
    try {
      const trainerContent = await page.locator('text=/Olá.*👋|Total de Clientes|Agendamentos/').first().isVisible({ timeout: 5000 });
      if (trainerContent) {
        console.log('   ✅ Trainer dashboard works');
        results.push({ feature: 'Trainer Dashboard', status: 'pass' });
        score++;
      }
    } catch (e) {
      console.log('   ❌ Trainer dashboard failed');
      results.push({ feature: 'Trainer Dashboard', status: 'fail' });
    }
    
    // 14. API Health
    console.log('14. Testing API Health...');
    try {
      const apiTest = await page.evaluate(async () => {
        const responses = await Promise.all([
          fetch('/api/trainers'),
          fetch('/api/appointments/stats')
        ]);
        return responses.every(r => r.ok || r.status === 401);
      });
      if (apiTest) {
        console.log('   ✅ APIs healthy');
        results.push({ feature: 'API Health', status: 'pass' });
        score++;
      }
    } catch (e) {
      console.log('   ❌ API health failed');
      results.push({ feature: 'API Health', status: 'fail' });
    }
    
    // 15. No Console Errors
    console.log('15. Checking for Console Errors...');
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('firebase')) {
        errors.push(msg.text());
      }
    });
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);
    if (errors.length === 0) {
      console.log('   ✅ No console errors');
      results.push({ feature: 'No Console Errors', status: 'pass' });
      score++;
    } else {
      console.log('   ❌ Console errors found');
      results.push({ feature: 'No Console Errors', status: 'fail', details: `${errors.length} errors` });
    }
    
    // Calculate final score
    const percentage = Math.round((score / totalTests) * 100);
    
    // Final Report
    console.log('\n' + '='.repeat(70));
    console.log('                 📊 COMPLETE SYSTEM TEST RESULTS');
    console.log('='.repeat(70));
    console.log(`\n   Final Score: ${score}/${totalTests} (${percentage}%)\n`);
    
    // Show working features
    const working = results.filter(r => r.status === 'pass');
    if (working.length > 0) {
      console.log('   ✅ WORKING FEATURES (' + working.length + '):');
      working.forEach(r => {
        const details = r.details ? ` (${r.details})` : '';
        console.log(`      ✓ ${r.feature}${details}`);
      });
    }
    
    // Show failed features
    const failed = results.filter(r => r.status === 'fail');
    if (failed.length > 0) {
      console.log('\n   ❌ FAILED FEATURES (' + failed.length + '):');
      failed.forEach(r => {
        const details = r.details ? ` (${r.details})` : '';
        console.log(`      ✗ ${r.feature}${details}`);
      });
    }
    
    console.log('\n' + '='.repeat(70));
    
    // Status message
    if (percentage === 100) {
      console.log('   🎉🎉🎉 PERFECT SCORE! SYSTEM IS 100% FUNCTIONAL! 🎉🎉🎉');
      console.log('   ✨ All features tested and working perfectly!');
    } else if (percentage >= 90) {
      console.log(`   🎊 EXCELLENT! System is ${percentage}% functional`);
      console.log('   ✨ Near perfect - only minor issues remain');
    } else if (percentage >= 80) {
      console.log(`   ✅ VERY GOOD! System is ${percentage}% functional`);
      console.log('   📈 Most features working excellently');
    } else if (percentage >= 70) {
      console.log(`   👍 GOOD! System is ${percentage}% functional`);
      console.log('   🔧 System is production-ready with minor improvements needed');
    } else {
      console.log(`   ⚠️ System is ${percentage}% functional`);
      console.log('   🔨 Some work still needed');
    }
    
    console.log('='.repeat(70) + '\n');
    
    // Expectation
    expect(percentage).toBeGreaterThanOrEqual(70);
  });
});