import { test, expect } from '@playwright/test';

test.describe('Full System Test', () => {
  test('check system functionality percentage', async ({ page }) => {
    let score = 0;
    const totalTests = 10;
    const results: { feature: string; status: 'pass' | 'fail'; reason?: string }[] = [];
    
    // 1. Test Login
    console.log('\n🔐 Testing Authentication...');
    try {
      await page.goto('http://localhost:3000/login');
      await page.fill('input[name="email"]', 'test-client@fitness.com');
      await page.fill('input[name="password"]', '123456');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard/**', { timeout: 5000 });
      console.log('✅ Authentication working');
      results.push({ feature: 'Authentication', status: 'pass' });
      score++;
    } catch (e) {
      console.log('❌ Authentication failed');
      results.push({ feature: 'Authentication', status: 'fail', reason: 'Login not working' });
    }
    
    // 2. Test Client Dashboard
    console.log('\n📊 Testing Client Dashboard...');
    try {
      await page.goto('http://localhost:3000/dashboard/client');
      await page.waitForTimeout(2000);
      
      const dashboardVisible = await page.locator('text=/Dashboard|Painel/').isVisible();
      if (dashboardVisible) {
        console.log('✅ Client dashboard loading');
        results.push({ feature: 'Client Dashboard', status: 'pass' });
        score++;
      } else {
        throw new Error('Dashboard not visible');
      }
    } catch (e) {
      console.log('❌ Client dashboard failed');
      results.push({ feature: 'Client Dashboard', status: 'fail', reason: 'Dashboard not loading' });
    }
    
    // 3. Test Dashboard Stats
    console.log('\n📈 Testing Dashboard Stats...');
    try {
      const statsVisible = await page.locator('text=/Total de Sessões|Sessões Agendadas|Total Gasto/').first().isVisible({ timeout: 3000 });
      if (statsVisible) {
        console.log('✅ Dashboard stats visible');
        results.push({ feature: 'Dashboard Stats', status: 'pass' });
        score++;
      } else {
        throw new Error('Stats not visible');
      }
    } catch (e) {
      console.log('❌ Dashboard stats not visible');
      results.push({ feature: 'Dashboard Stats', status: 'fail', reason: 'Stats widgets not showing' });
    }
    
    // 4. Test Booking Page Access
    console.log('\n📅 Testing Booking Page...');
    try {
      await page.goto('http://localhost:3000/booking');
      await page.waitForTimeout(2000);
      
      const bookingPageVisible = await page.locator('text=/Escolha seu Trainer|Agendar Sessão/').isVisible();
      if (bookingPageVisible) {
        console.log('✅ Booking page accessible');
        results.push({ feature: 'Booking Page', status: 'pass' });
        score++;
      } else {
        throw new Error('Booking page not loading');
      }
    } catch (e) {
      console.log('❌ Booking page failed');
      results.push({ feature: 'Booking Page', status: 'fail', reason: 'Page not loading' });
    }
    
    // 5. Test Trainers Loading
    console.log('\n👥 Testing Trainers Loading...');
    try {
      await page.waitForTimeout(2000);
      
      const trainersLoaded = await page.locator('text=/João Personal|Ana Fitness|Carlos Strong/').first().isVisible({ timeout: 5000 });
      if (trainersLoaded) {
        console.log('✅ Trainers loading successfully');
        results.push({ feature: 'Trainers Display', status: 'pass' });
        score++;
      } else {
        throw new Error('Trainers not loading');
      }
    } catch (e) {
      console.log('❌ Trainers not loading');
      results.push({ feature: 'Trainers Display', status: 'fail', reason: 'Trainer cards not showing' });
    }
    
    // 6. Test Booking Flow
    console.log('\n🎯 Testing Booking Flow...');
    try {
      // Click on a trainer
      await page.click('text=/João Personal|Ana Fitness/', { timeout: 3000 });
      await page.waitForTimeout(1000);
      
      // Check if moved to date selection
      const dateStepVisible = await page.locator('text=Escolha a Data').isVisible({ timeout: 3000 });
      if (dateStepVisible) {
        console.log('✅ Booking flow working');
        results.push({ feature: 'Booking Flow', status: 'pass' });
        score++;
      } else {
        throw new Error('Booking flow not progressing');
      }
    } catch (e) {
      console.log('❌ Booking flow failed');
      results.push({ feature: 'Booking Flow', status: 'fail', reason: 'Cannot progress through steps' });
    }
    
    // 7. Test Appointments Page
    console.log('\n📋 Testing Appointments Page...');
    try {
      await page.goto('http://localhost:3000/appointments');
      await page.waitForTimeout(2000);
      
      const appointmentsVisible = await page.locator('text=/Agendamentos|Meus Agendamentos/').isVisible({ timeout: 3000 });
      if (appointmentsVisible) {
        console.log('✅ Appointments page working');
        results.push({ feature: 'Appointments Page', status: 'pass' });
        score++;
      } else {
        throw new Error('Appointments page not loading');
      }
    } catch (e) {
      console.log('❌ Appointments page failed');
      results.push({ feature: 'Appointments Page', status: 'fail', reason: 'Page not accessible' });
    }
    
    // 8. Test Trainer Dashboard
    console.log('\n🏋️ Testing Trainer Dashboard...');
    try {
      // Logout first
      await page.goto('http://localhost:3000/logout');
      await page.waitForTimeout(1000);
      
      // Login as trainer
      await page.goto('http://localhost:3000/login');
      await page.fill('input[name="email"]', 'test-trainer@fitness.com');
      await page.fill('input[name="password"]', '123456');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard/trainer', { timeout: 5000 });
      
      const trainerDashboardVisible = await page.locator('text=/Dashboard do Trainer|Painel do Trainer/').isVisible();
      if (trainerDashboardVisible) {
        console.log('✅ Trainer dashboard working');
        results.push({ feature: 'Trainer Dashboard', status: 'pass' });
        score++;
      } else {
        throw new Error('Trainer dashboard not visible');
      }
    } catch (e) {
      console.log('❌ Trainer dashboard failed');
      results.push({ feature: 'Trainer Dashboard', status: 'fail', reason: 'Dashboard not accessible' });
    }
    
    // 9. Test Trainer Stats
    console.log('\n📊 Testing Trainer Stats...');
    try {
      const trainerStatsVisible = await page.locator('text=/Total de Clientes|Receita do Mês/').first().isVisible({ timeout: 3000 });
      if (trainerStatsVisible) {
        console.log('✅ Trainer stats visible');
        results.push({ feature: 'Trainer Stats', status: 'pass' });
        score++;
      } else {
        throw new Error('Trainer stats not visible');
      }
    } catch (e) {
      console.log('❌ Trainer stats not visible');
      results.push({ feature: 'Trainer Stats', status: 'fail', reason: 'Stats not showing' });
    }
    
    // 10. Test API Health
    console.log('\n🔧 Testing API Health...');
    try {
      const response = await page.evaluate(async () => {
        const res = await fetch('/api/trainers');
        return res.ok;
      });
      
      if (response) {
        console.log('✅ API endpoints working');
        results.push({ feature: 'API Health', status: 'pass' });
        score++;
      } else {
        throw new Error('API not responding');
      }
    } catch (e) {
      console.log('❌ API health check failed');
      results.push({ feature: 'API Health', status: 'fail', reason: 'API not responding correctly' });
    }
    
    // Calculate final score
    const percentage = Math.round((score / totalTests) * 100);
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL SYSTEM STATUS REPORT');
    console.log('='.repeat(60));
    console.log(`Overall Score: ${score}/${totalTests} (${percentage}%)`);
    
    console.log('\n✅ Working Features:');
    results.filter(r => r.status === 'pass').forEach(r => {
      console.log(`   ✓ ${r.feature}`);
    });
    
    if (results.filter(r => r.status === 'fail').length > 0) {
      console.log('\n❌ Failed Features:');
      results.filter(r => r.status === 'fail').forEach(r => {
        console.log(`   ✗ ${r.feature}: ${r.reason}`);
      });
    }
    
    console.log('\n📈 System Health: ' + percentage + '%');
    
    if (percentage === 100) {
      console.log('🎉 SYSTEM IS 100% FUNCTIONAL!');
    } else if (percentage >= 80) {
      console.log('✨ System is mostly functional');
    } else if (percentage >= 60) {
      console.log('⚠️ System needs attention');
    } else {
      console.log('🚨 System has critical issues');
    }
    
    console.log('='.repeat(60));
    
    // Store results for potential further analysis
    await page.evaluate((results) => {
      console.log('Test Results:', results);
    }, results);
    
    expect(percentage).toBeGreaterThanOrEqual(70);
  });
});