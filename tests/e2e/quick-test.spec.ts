import { test, expect } from '@playwright/test';

test.describe('🔍 Quick System Test', () => {
  test('comprehensive system check', async ({ page }) => {
    console.log('\n========================================');
    console.log('🚀 STARTING COMPREHENSIVE SYSTEM TEST');
    console.log('========================================\n');
    
    const results = {
      pages: [],
      errors: [],
      warnings: [],
      functionality: {
        working: [],
        notWorking: []
      }
    };

    // Test 1: Landing Page
    console.log('📄 Testing Landing Page...');
    try {
      await page.goto('/', { waitUntil: 'networkidle' });
      const title = await page.title();
      results.pages.push({ url: '/', title, status: 'OK' });
      
      // Check main elements
      const h1Visible = await page.locator('h1').isVisible();
      const hasButtons = await page.locator('button').count() > 0;
      
      if (h1Visible && hasButtons) {
        results.functionality.working.push('Landing page layout');
      } else {
        results.functionality.notWorking.push('Landing page missing elements');
      }
    } catch (error) {
      results.errors.push(`Landing page error: ${error.message}`);
    }

    // Test 2: Login Page
    console.log('🔐 Testing Login Page...');
    try {
      await page.goto('/login', { waitUntil: 'networkidle' });
      
      const emailInput = await page.locator('input[type="email"]').isVisible();
      const passwordInput = await page.locator('input[type="password"]').isVisible();
      const submitButton = await page.locator('button[type="submit"]').isVisible();
      
      if (emailInput && passwordInput && submitButton) {
        results.functionality.working.push('Login form');
        results.pages.push({ url: '/login', status: 'OK' });
      } else {
        results.functionality.notWorking.push('Login form incomplete');
      }
    } catch (error) {
      results.errors.push(`Login page error: ${error.message}`);
    }

    // Test 3: Register Page
    console.log('📝 Testing Register Page...');
    try {
      await page.goto('/register', { waitUntil: 'networkidle' });
      
      const nameInput = await page.locator('input[name="name"]').isVisible();
      const emailInput = await page.locator('input[type="email"]').isVisible();
      const roleButtons = await page.locator('button').filter({ hasText: /Cliente|Trainer/i }).count();
      
      if (nameInput && emailInput && roleButtons > 0) {
        results.functionality.working.push('Register form');
        results.pages.push({ url: '/register', status: 'OK' });
      } else {
        results.functionality.notWorking.push('Register form incomplete');
      }
    } catch (error) {
      results.errors.push(`Register page error: ${error.message}`);
    }

    // Test 4: Booking Page
    console.log('📅 Testing Booking Page...');
    try {
      await page.goto('/booking', { waitUntil: 'networkidle' });
      
      // Check for booking steps
      const hasSteps = await page.locator('text=/Escolher Trainer|Selecionar Data/i').isVisible();
      const hasTrainers = await page.locator('div').filter({ hasText: /R\$/i }).count() > 0;
      
      if (hasSteps || hasTrainers) {
        results.functionality.working.push('Booking flow visible');
        results.pages.push({ url: '/booking', status: 'OK' });
      } else {
        results.functionality.notWorking.push('Booking flow not loading');
      }
      
      // Test trainer selection
      const trainerCard = page.locator('div').filter({ hasText: /R\$.*por sessão/i }).first();
      if (await trainerCard.isVisible()) {
        await trainerCard.click();
        await page.waitForTimeout(1000);
        
        const dateVisible = await page.locator('text=/Escolha a Data/i').isVisible();
        if (dateVisible) {
          results.functionality.working.push('Trainer selection');
        } else {
          results.functionality.notWorking.push('Trainer selection navigation');
        }
      }
    } catch (error) {
      results.errors.push(`Booking page error: ${error.message}`);
    }

    // Test 5: Login Functionality
    console.log('🔑 Testing Login Functionality...');
    try {
      await page.goto('/login');
      await page.fill('input[type="email"]', 'test-client@fitness.com');
      await page.fill('input[type="password"]', '123456');
      await page.click('button[type="submit"]');
      
      await page.waitForTimeout(3000);
      
      const url = page.url();
      if (url.includes('/dashboard') || url.includes('/appointments')) {
        results.functionality.working.push('Client login');
      } else {
        results.functionality.notWorking.push('Client login (stayed on login page)');
      }
      
      // If logged in, test dashboard
      if (!url.includes('/login')) {
        console.log('📊 Testing Dashboard...');
        
        const hasStats = await page.locator('text=/Total|Agendamentos|Estatísticas/i').isVisible();
        if (hasStats) {
          results.functionality.working.push('Dashboard stats');
        } else {
          results.functionality.notWorking.push('Dashboard stats not visible');
        }
        
        // Test navigation to appointments
        const appointmentsLink = page.locator('a:has-text("Agendamentos")').or(
          page.locator('button:has-text("Agendamentos")')
        ).first();
        
        if (await appointmentsLink.isVisible()) {
          await appointmentsLink.click();
          await page.waitForTimeout(2000);
          
          if (page.url().includes('/appointments')) {
            results.functionality.working.push('Appointments navigation');
            
            // Check appointments page
            const hasAppointmentsTitle = await page.locator('text=/Meus Agendamentos/i').isVisible();
            const hasNewButton = await page.locator('button:has-text("Novo Agendamento")').isVisible();
            
            if (hasAppointmentsTitle && hasNewButton) {
              results.functionality.working.push('Appointments page');
            } else {
              results.functionality.notWorking.push('Appointments page incomplete');
            }
          }
        }
      }
    } catch (error) {
      results.errors.push(`Login functionality error: ${error.message}`);
    }

    // Test 6: API Endpoints
    console.log('🔌 Testing API Endpoints...');
    const apiEndpoints = [
      '/api/trainers',
      '/api/dashboard/client',
      '/api/appointments/stats'
    ];
    
    for (const endpoint of apiEndpoints) {
      try {
        const response = await page.request.get(endpoint);
        if (response.ok()) {
          results.functionality.working.push(`API: ${endpoint}`);
        } else {
          results.functionality.notWorking.push(`API: ${endpoint} (${response.status()})`);
        }
      } catch (error) {
        results.errors.push(`API error ${endpoint}: ${error.message}`);
      }
    }

    // Test 7: Console Errors
    console.log('🐛 Checking for Console Errors...');
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    if (consoleErrors.length > 0) {
      results.warnings.push(...consoleErrors.map(e => `Console: ${e}`));
    }

    // Test 8: Responsive Design
    console.log('📱 Testing Responsive Design...');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    const mobileMenuVisible = await page.locator('button[aria-label*="menu" i]').isVisible().catch(() => false);
    const contentVisible = await page.locator('h1').isVisible();
    
    if (contentVisible) {
      results.functionality.working.push('Mobile responsive layout');
    } else {
      results.functionality.notWorking.push('Mobile layout issues');
    }

    // Generate Report
    console.log('\n========================================');
    console.log('📋 TEST RESULTS SUMMARY');
    console.log('========================================\n');
    
    console.log('✅ WORKING FEATURES:');
    results.functionality.working.forEach(f => console.log(`  ✓ ${f}`));
    
    console.log('\n❌ NOT WORKING:');
    results.functionality.notWorking.forEach(f => console.log(`  ✗ ${f}`));
    
    console.log('\n⚠️ ERRORS FOUND:');
    results.errors.forEach(e => console.log(`  ! ${e}`));
    
    console.log('\n⚠️ WARNINGS:');
    results.warnings.forEach(w => console.log(`  ⚡ ${w}`));
    
    console.log('\n📊 PAGES TESTED:');
    results.pages.forEach(p => console.log(`  • ${p.url} - ${p.status}`));
    
    // Calculate score
    const totalTests = results.functionality.working.length + results.functionality.notWorking.length;
    const passedTests = results.functionality.working.length;
    const score = Math.round((passedTests / totalTests) * 100);
    
    console.log('\n========================================');
    console.log(`🎯 OVERALL SCORE: ${score}% (${passedTests}/${totalTests} tests passed)`);
    console.log('========================================\n');
    
    // Recommendations
    console.log('💡 RECOMMENDATIONS:');
    if (results.functionality.notWorking.includes('Client login (stayed on login page)')) {
      console.log('  1. Fix authentication system - login not working properly');
    }
    if (results.errors.length > 0) {
      console.log('  2. Fix critical errors preventing page loads');
    }
    if (results.warnings.length > 0) {
      console.log('  3. Address console errors for better stability');
    }
    if (results.functionality.notWorking.includes('Booking flow not loading')) {
      console.log('  4. Fix booking system - core functionality broken');
    }
    if (results.functionality.notWorking.includes('Dashboard stats not visible')) {
      console.log('  5. Fix dashboard components - stats not rendering');
    }
    
    console.log('\n========================================\n');
    
    // Assert at least 50% functionality works
    expect(score).toBeGreaterThan(50);
  });
});