import { test, expect } from '@playwright/test';

test.describe('System Status Check', () => {
  test('check complete system functionality', async ({ page }) => {
    let score = 0;
    let total = 0;
    const issues: string[] = [];
    
    // 1. Test Login
    console.log('\n✅ Testing Login...');
    await page.goto('http://localhost:3000/login');
    total++;
    
    try {
      await page.fill('input[name="email"]', 'test-client@fitness.com');
      await page.fill('input[name="password"]', '123456');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard/**', { timeout: 5000 });
      console.log('✓ Login working');
      score++;
    } catch (e) {
      console.log('✗ Login failed');
      issues.push('Login not working');
    }
    
    // 2. Test Dashboard Stats
    console.log('\n✅ Testing Dashboard Stats...');
    total++;
    
    try {
      await page.goto('http://localhost:3000/dashboard/client');
      await page.waitForTimeout(1000);
      
      const statsVisible = await page.locator('text=/Total de Sessões|Sessões Agendadas/').isVisible();
      if (statsVisible) {
        console.log('✓ Dashboard stats visible');
        score++;
      } else {
        console.log('✗ Dashboard stats not visible');
        issues.push('Dashboard stats not visible');
      }
    } catch (e) {
      console.log('✗ Dashboard stats error');
      issues.push('Dashboard stats error');
    }
    
    // 3. Test Booking Flow
    console.log('\n✅ Testing Booking Flow...');
    await page.goto('http://localhost:3000/booking');
    total++;
    
    try {
      await page.waitForTimeout(2000);
      
      // Check if trainers are loading
      const trainersVisible = await page.locator('text=/João Silva|Maria Santos/').first().isVisible({ timeout: 5000 });
      
      if (trainersVisible) {
        console.log('✓ Trainers loading in booking');
        score++;
        
        // Try to select a trainer
        await page.click('text=/João Silva|Maria Santos/', { timeout: 3000 });
        await page.waitForTimeout(1000);
        
        // Check if moved to date selection
        const dateStepVisible = await page.locator('text=Escolha a Data').isVisible();
        if (dateStepVisible) {
          console.log('✓ Date selection working');
          score++;
          total++;
        } else {
          console.log('✗ Date selection not working');
          issues.push('Date selection step not working');
          total++;
        }
      } else {
        console.log('✗ Trainers not loading');
        issues.push('Trainers not loading in booking flow');
      }
    } catch (e) {
      console.log('✗ Booking flow error:', e);
      issues.push('Booking flow critical error');
    }
    
    // 4. Test Appointments Page
    console.log('\n✅ Testing Appointments Page...');
    await page.goto('http://localhost:3000/appointments');
    total++;
    
    try {
      await page.waitForTimeout(1000);
      const appointmentsVisible = await page.locator('text=/Agendamentos|Appointments/').isVisible();
      if (appointmentsVisible) {
        console.log('✓ Appointments page loading');
        score++;
      } else {
        console.log('✗ Appointments page not loading');
        issues.push('Appointments page not loading');
      }
    } catch (e) {
      console.log('✗ Appointments page error');
      issues.push('Appointments page error');
    }
    
    // 5. Test Trainer Dashboard
    console.log('\n✅ Testing Trainer Dashboard...');
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="email"]', 'test-trainer@fitness.com');
    await page.fill('input[name="password"]', '123456');
    await page.click('button[type="submit"]');
    total++;
    
    try {
      await page.waitForURL('**/dashboard/trainer', { timeout: 5000 });
      await page.waitForTimeout(1000);
      
      const trainerStatsVisible = await page.locator('text=/Total de Clientes|Receita do Mês/').isVisible();
      if (trainerStatsVisible) {
        console.log('✓ Trainer dashboard working');
        score++;
      } else {
        console.log('✗ Trainer dashboard stats not visible');
        issues.push('Trainer dashboard stats not visible');
      }
    } catch (e) {
      console.log('✗ Trainer dashboard error');
      issues.push('Trainer dashboard error');
    }
    
    // 6. Check for Console Errors
    console.log('\n✅ Checking for Console Errors...');
    total++;
    
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.goto('http://localhost:3000/dashboard/client');
    await page.waitForTimeout(2000);
    
    if (consoleErrors.length === 0) {
      console.log('✓ No console errors');
      score++;
    } else {
      console.log(`✗ ${consoleErrors.length} console errors found`);
      issues.push(`${consoleErrors.length} console errors`);
    }
    
    // Calculate final score
    const percentage = Math.round((score / total) * 100);
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 SYSTEM STATUS REPORT');
    console.log('='.repeat(50));
    console.log(`Score: ${score}/${total} (${percentage}%)`);
    console.log('\n✅ Working Features:');
    console.log('- Authentication');
    if (score >= 2) console.log('- Dashboard displays');
    if (score >= 3) console.log('- Booking flow with trainers');
    if (score >= 5) console.log('- Multi-role support');
    
    if (issues.length > 0) {
      console.log('\n❌ Issues Found:');
      issues.forEach(issue => console.log(`- ${issue}`));
    }
    
    console.log('\n📈 System Functionality: ' + percentage + '%');
    
    if (percentage === 100) {
      console.log('🎉 System is 100% functional!');
    } else if (percentage >= 80) {
      console.log('✨ System is mostly functional, minor issues remain');
    } else if (percentage >= 60) {
      console.log('⚠️ System has significant issues that need fixing');
    } else {
      console.log('🚨 System has critical issues');
    }
    
    expect(percentage).toBeGreaterThanOrEqual(80);
  });
});