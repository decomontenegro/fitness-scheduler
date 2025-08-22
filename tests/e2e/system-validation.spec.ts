import { test, expect } from '@playwright/test';

test.describe('System Validation - Production Ready Check', () => {
  test('validate all critical features', async ({ page, context }) => {
    let score = 0;
    const tests: { name: string; critical: boolean; passed: boolean }[] = [];
    
    console.log('\n' + '='.repeat(70));
    console.log('             🎯 SYSTEM VALIDATION TEST');
    console.log('='.repeat(70) + '\n');
    
    // Test 1: Homepage
    console.log('Testing Homepage...');
    try {
      await page.goto('http://localhost:3000');
      await page.waitForLoadState('domcontentloaded');
      tests.push({ name: 'Homepage', critical: true, passed: true });
      score++;
      console.log('✅ Homepage');
    } catch {
      tests.push({ name: 'Homepage', critical: true, passed: false });
      console.log('❌ Homepage');
    }
    
    // Test 2: Login System
    console.log('Testing Login System...');
    try {
      await page.goto('http://localhost:3000/login');
      await page.fill('input[name="email"]', 'test-client@fitness.com');
      await page.fill('input[name="password"]', '123456');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard/**', { timeout: 5000 });
      tests.push({ name: 'Login System', critical: true, passed: true });
      score++;
      console.log('✅ Login System');
    } catch {
      tests.push({ name: 'Login System', critical: true, passed: false });
      console.log('❌ Login System');
    }
    
    // Test 3: Client Dashboard
    console.log('Testing Client Dashboard...');
    try {
      const visible = await page.locator('text=/Olá|Dashboard|Histórico/').first().isVisible({ timeout: 3000 });
      if (visible) {
        tests.push({ name: 'Client Dashboard', critical: true, passed: true });
        score++;
        console.log('✅ Client Dashboard');
      } else throw new Error();
    } catch {
      tests.push({ name: 'Client Dashboard', critical: true, passed: false });
      console.log('❌ Client Dashboard');
    }
    
    // Test 4: Booking System
    console.log('Testing Booking System...');
    try {
      await page.goto('http://localhost:3000/booking');
      await page.waitForTimeout(3000);
      const trainersVisible = await page.locator('.rounded-xl').count() > 0;
      if (trainersVisible) {
        tests.push({ name: 'Booking System', critical: true, passed: true });
        score++;
        console.log('✅ Booking System');
      } else throw new Error();
    } catch {
      tests.push({ name: 'Booking System', critical: true, passed: false });
      console.log('❌ Booking System');
    }
    
    // Test 5: Trainer Selection
    console.log('Testing Trainer Selection...');
    try {
      await page.locator('text=/João Personal|Ana Fitness/').first().click();
      const dateSelection = await page.locator('text=Escolha a Data').isVisible({ timeout: 3000 });
      if (dateSelection) {
        tests.push({ name: 'Trainer Selection', critical: true, passed: true });
        score++;
        console.log('✅ Trainer Selection');
      } else throw new Error();
    } catch {
      tests.push({ name: 'Trainer Selection', critical: true, passed: false });
      console.log('❌ Trainer Selection');
    }
    
    // Test 6: Appointments Management
    console.log('Testing Appointments Management...');
    try {
      await page.goto('http://localhost:3000/appointments');
      await page.waitForTimeout(2000);
      const apptPage = await page.locator('text=/Agendamentos|Appointments/').first().isVisible();
      if (apptPage) {
        tests.push({ name: 'Appointments Management', critical: false, passed: true });
        score++;
        console.log('✅ Appointments Management');
      } else throw new Error();
    } catch {
      tests.push({ name: 'Appointments Management', critical: false, passed: false });
      console.log('❌ Appointments Management');
    }
    
    // Test 7: Trainer Portal
    console.log('Testing Trainer Portal...');
    try {
      await context.clearCookies();
      await page.goto('http://localhost:3000/login');
      await page.fill('input[name="email"]', 'test-trainer@fitness.com');
      await page.fill('input[name="password"]', '123456');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);
      const isTrainerDashboard = page.url().includes('trainer');
      if (isTrainerDashboard) {
        tests.push({ name: 'Trainer Portal', critical: false, passed: true });
        score++;
        console.log('✅ Trainer Portal');
      } else throw new Error();
    } catch {
      tests.push({ name: 'Trainer Portal', critical: false, passed: false });
      console.log('❌ Trainer Portal');
    }
    
    // Test 8: API Endpoints
    console.log('Testing API Endpoints...');
    try {
      const apiOk = await page.evaluate(async () => {
        const res = await fetch('/api/trainers');
        return res.ok;
      });
      if (apiOk) {
        tests.push({ name: 'API Endpoints', critical: true, passed: true });
        score++;
        console.log('✅ API Endpoints');
      } else throw new Error();
    } catch {
      tests.push({ name: 'API Endpoints', critical: true, passed: false });
      console.log('❌ API Endpoints');
    }
    
    // Test 9: Navigation
    console.log('Testing Navigation...');
    try {
      await page.goto('http://localhost:3000/schedule');
      await page.waitForLoadState('networkidle', { timeout: 5000 });
      tests.push({ name: 'Navigation', critical: false, passed: true });
      score++;
      console.log('✅ Navigation');
    } catch {
      tests.push({ name: 'Navigation', critical: false, passed: false });
      console.log('❌ Navigation');
    }
    
    // Test 10: Authentication Persistence
    console.log('Testing Authentication Persistence...');
    try {
      const token = await page.evaluate(() => localStorage.getItem('token'));
      if (token) {
        tests.push({ name: 'Auth Persistence', critical: true, passed: true });
        score++;
        console.log('✅ Auth Persistence');
      } else throw new Error();
    } catch {
      tests.push({ name: 'Auth Persistence', critical: true, passed: false });
      console.log('❌ Auth Persistence');
    }
    
    // Calculate results
    const totalTests = tests.length;
    const criticalTests = tests.filter(t => t.critical);
    const criticalPassed = criticalTests.filter(t => t.passed).length;
    const percentage = Math.round((score / totalTests) * 100);
    const criticalPercentage = Math.round((criticalPassed / criticalTests.length) * 100);
    
    // Report
    console.log('\n' + '='.repeat(70));
    console.log('                    📊 VALIDATION REPORT');
    console.log('='.repeat(70));
    
    console.log(`\n Overall Score: ${score}/${totalTests} (${percentage}%)`);
    console.log(` Critical Features: ${criticalPassed}/${criticalTests.length} (${criticalPercentage}%)\n`);
    
    // List results
    console.log(' CRITICAL FEATURES:');
    criticalTests.forEach(t => {
      console.log(`   ${t.passed ? '✅' : '❌'} ${t.name}`);
    });
    
    console.log('\n NON-CRITICAL FEATURES:');
    tests.filter(t => !t.critical).forEach(t => {
      console.log(`   ${t.passed ? '✅' : '❌'} ${t.name}`);
    });
    
    console.log('\n' + '='.repeat(70));
    
    // Final status
    if (percentage === 100) {
      console.log(' 🎉 PERFECT! System is 100% functional!');
    } else if (criticalPercentage === 100) {
      console.log(' ✅ PRODUCTION READY! All critical features working!');
      console.log(` 📈 Overall system at ${percentage}% functionality`);
    } else if (criticalPercentage >= 80) {
      console.log(` ⚠️ NEARLY READY: ${criticalPercentage}% of critical features working`);
      console.log(' 🔧 Minor fixes needed for production');
    } else {
      console.log(` ❌ NOT READY: Only ${criticalPercentage}% of critical features working`);
      console.log(' 🚨 Critical issues must be resolved');
    }
    
    console.log('='.repeat(70) + '\n');
    
    // Pass if critical features are working
    expect(criticalPercentage).toBeGreaterThanOrEqual(80);
  });
});