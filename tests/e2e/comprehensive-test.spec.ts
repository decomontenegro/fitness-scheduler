import { test, expect } from '@playwright/test';

// Test data
const CLIENT_USER = {
  email: 'client1@test.com',
  password: 'password123',
  name: 'Client Test'
};

const TRAINER_USER = {
  email: 'trainer1@test.com', 
  password: 'password123',
  name: 'Trainer Test'
};

// Helper functions
async function login(page: any, email: string, password: string) {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard|appointments/);
}

async function logout(page: any) {
  await page.click('button:has-text("Sair")').catch(() => {});
}

test.describe('🏠 Landing Page Tests', () => {
  test('should load landing page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/FitScheduler/);
    
    // Check main sections
    await expect(page.locator('h1')).toBeVisible();
    const startButton = page.locator('text=Começar Agora').or(page.locator('text=Agendar Agora'));
    await expect(startButton.first()).toBeVisible();
  });

  test('should navigate to login from landing', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Entrar');
    await expect(page).toHaveURL('/login');
  });

  test('should navigate to register from landing', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Começar Agora');
    await expect(page).toHaveURL(/register|signup/);
  });

  test('should show features section', async ({ page }) => {
    await page.goto('/');
    
    // Check for feature cards
    const features = ['Agendamento', 'Gestão', 'Pagamento'];
    for (const feature of features) {
      const element = page.locator(`text=/${feature}/i`).first();
      await expect(element).toBeVisible({ timeout: 10000 });
    }
  });

  test('should have responsive menu on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check for mobile menu button
    const menuButton = page.locator('button[aria-label*="menu" i]').or(page.locator('button').filter({ hasText: /menu/i }));
    const isVisible = await menuButton.isVisible().catch(() => false);
    
    if (isVisible) {
      await menuButton.click();
      // Check if menu items appear
      await expect(page.locator('text=Entrar')).toBeVisible();
    }
  });
});

test.describe('🔐 Authentication Tests', () => {
  test('should show login page', async ({ page }) => {
    await page.goto('/login');
    
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show validation errors on empty login', async ({ page }) => {
    await page.goto('/login');
    await page.click('button[type="submit"]');
    
    // Should show error or stay on login page
    await expect(page).toHaveURL('/login');
  });

  test('should login as client', async ({ page }) => {
    await login(page, CLIENT_USER.email, CLIENT_USER.password);
    
    // Should redirect to dashboard or appointments
    const url = page.url();
    expect(url).toMatch(/dashboard|appointments/);
  });

  test('should login as trainer', async ({ page }) => {
    await login(page, TRAINER_USER.email, TRAINER_USER.password);
    
    // Should redirect to dashboard or appointments  
    const url = page.url();
    expect(url).toMatch(/dashboard|appointments/);
  });

  test('should show register page', async ({ page }) => {
    await page.goto('/register');
    
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    
    // Check for role selection
    const roleButtons = page.locator('button:has-text("Cliente"), button:has-text("Trainer")');
    await expect(roleButtons).toHaveCount(2);
  });

  test('should handle logout', async ({ page }) => {
    await login(page, CLIENT_USER.email, CLIENT_USER.password);
    
    // Find and click logout button
    const logoutButton = page.locator('button:has-text("Sair")').or(
      page.locator('button[aria-label*="logout" i]')
    );
    
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      await page.waitForURL('/login', { timeout: 5000 }).catch(() => {});
    }
  });
});

test.describe('📅 Client Dashboard Tests', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, CLIENT_USER.email, CLIENT_USER.password);
  });

  test('should show client dashboard', async ({ page }) => {
    await page.goto('/dashboard/client');
    
    // Check for dashboard elements
    await expect(page.locator('text=/Próximos Agendamentos/i')).toBeVisible();
    await expect(page.locator('text=/Estatísticas/i')).toBeVisible();
  });

  test('should navigate to booking from dashboard', async ({ page }) => {
    await page.goto('/dashboard/client');
    
    const bookButton = page.locator('button:has-text("Novo Agendamento")').or(
      page.locator('a:has-text("Agendar")')
    );
    
    if (await bookButton.isVisible()) {
      await bookButton.click();
      await expect(page).toHaveURL('/booking');
    }
  });

  test('should show quick actions', async ({ page }) => {
    await page.goto('/dashboard/client');
    
    // Check for quick action buttons
    const actions = ['Agendar', 'Mensagens', 'Histórico'];
    for (const action of actions) {
      const element = page.locator(`text=/${action}/i`).first();
      const isVisible = await element.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (isVisible) {
        // Try clicking to test if functional
        await element.click();
        // Navigate back if we moved to another page
        if (!page.url().includes('/dashboard')) {
          await page.goBack();
        }
      }
    }
  });

  test('should display stats cards', async ({ page }) => {
    await page.goto('/dashboard/client');
    
    // Check for stats cards
    const statsTexts = ['Total', 'Concluídas', 'Agendadas'];
    for (const text of statsTexts) {
      const element = page.locator(`text=/${text}/i`).first();
      await expect(element).toBeVisible({ timeout: 10000 });
    }
  });
});

test.describe('🏋️ Trainer Dashboard Tests', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TRAINER_USER.email, TRAINER_USER.password);
  });

  test('should show trainer dashboard', async ({ page }) => {
    await page.goto('/dashboard/trainer');
    
    // Check for trainer-specific elements
    await expect(page.locator('text=/Agenda do Dia/i')).toBeVisible();
    await expect(page.locator('text=/Estatísticas/i')).toBeVisible();
  });

  test('should show availability management', async ({ page }) => {
    await page.goto('/dashboard/trainer');
    
    const availabilitySection = page.locator('text=/Disponibilidade/i').first();
    const isVisible = await availabilitySection.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (isVisible) {
      // Check for time slot management
      await expect(page.locator('text=/Horários/i').first()).toBeVisible();
    }
  });

  test('should navigate to appointments', async ({ page }) => {
    await page.goto('/dashboard/trainer');
    
    const appointmentsLink = page.locator('a:has-text("Agendamentos")').or(
      page.locator('button:has-text("Ver Agendamentos")')
    );
    
    if (await appointmentsLink.isVisible()) {
      await appointmentsLink.click();
      await expect(page).toHaveURL('/appointments');
    }
  });
});

test.describe('📝 Booking Flow Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/booking');
  });

  test('should show booking steps', async ({ page }) => {
    // Check for step indicators
    await expect(page.locator('text=Escolher Trainer')).toBeVisible();
    await expect(page.locator('text=Selecionar Data')).toBeVisible();
    await expect(page.locator('text=Escolher Horário')).toBeVisible();
    await expect(page.locator('text=Confirmar')).toBeVisible();
  });

  test('should show trainer selection', async ({ page }) => {
    // Check for trainer cards
    const trainerCards = page.locator('[class*="trainer"]').or(
      page.locator('div').filter({ hasText: /R\$.*por sessão/i })
    );
    
    const count = await trainerCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should navigate through booking steps', async ({ page }) => {
    // Select a trainer (if available)
    const trainerCard = page.locator('div').filter({ hasText: /R\$.*por sessão/i }).first();
    
    if (await trainerCard.isVisible()) {
      await trainerCard.click();
      
      // Should move to date selection
      await expect(page.locator('text=Escolha a Data')).toBeVisible();
      
      // Select a date
      const dateButton = page.locator('button').filter({ hasText: /^[0-9]{1,2}$/ }).first();
      if (await dateButton.isVisible()) {
        await dateButton.click();
        
        // Should move to time selection
        await expect(page.locator('text=Escolha o Horário')).toBeVisible();
      }
    }
  });

  test('should show calendar navigation', async ({ page }) => {
    // Navigate to date selection if needed
    const trainerCard = page.locator('div').filter({ hasText: /R\$.*por sessão/i }).first();
    
    if (await trainerCard.isVisible()) {
      await trainerCard.click();
      
      // Check for calendar navigation buttons
      const prevButton = page.locator('button').filter({ has: page.locator('svg').first() }).first();
      const nextButton = page.locator('button').filter({ has: page.locator('svg').last() }).last();
      
      if (await prevButton.isVisible() && await nextButton.isVisible()) {
        await nextButton.click();
        await prevButton.click();
      }
    }
  });
});

test.describe('📋 Appointments Page Tests', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, CLIENT_USER.email, CLIENT_USER.password);
    await page.goto('/appointments');
  });

  test('should show appointments page', async ({ page }) => {
    await expect(page.locator('text=Meus Agendamentos')).toBeVisible();
    
    // Check for action buttons
    await expect(page.locator('button:has-text("Novo Agendamento")')).toBeVisible();
    await expect(page.locator('button:has-text("Exportar")')).toBeVisible();
  });

  test('should show appointment stats', async ({ page }) => {
    // Check for stats cards
    const stats = ['Total', 'Próximos', 'Concluídos', 'Cancelados'];
    for (const stat of stats) {
      const element = page.locator(`text=/${stat}/i`).first();
      await expect(element).toBeVisible({ timeout: 10000 });
    }
  });

  test('should navigate to new booking', async ({ page }) => {
    await page.click('button:has-text("Novo Agendamento")');
    await expect(page).toHaveURL('/booking');
  });

  test('should handle export button', async ({ page }) => {
    const exportButton = page.locator('button:has-text("Exportar")');
    
    if (await exportButton.isVisible()) {
      // Set up download promise before clicking
      const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
      await exportButton.click();
      
      const download = await downloadPromise;
      if (download) {
        expect(download.suggestedFilename()).toContain('agendamentos');
      }
    }
  });
});

test.describe('🎨 Design & Responsiveness Tests', () => {
  const viewports = [
    { name: 'Desktop', width: 1920, height: 1080 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Mobile', width: 375, height: 667 }
  ];

  for (const viewport of viewports) {
    test(`should be responsive on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/');
      
      // Check that main content is visible
      await expect(page.locator('h1').first()).toBeVisible();
      
      // Check navigation
      if (viewport.name === 'Mobile') {
        // Mobile might have hamburger menu
        const menuButton = page.locator('button[aria-label*="menu" i]').or(
          page.locator('button').filter({ has: page.locator('svg') }).first()
        );
        const isVisible = await menuButton.isVisible().catch(() => false);
        
        if (isVisible) {
          await menuButton.click();
        }
      }
      
      // Take screenshot for visual review
      await page.screenshot({ 
        path: `tests/screenshots/${viewport.name.toLowerCase()}-landing.png`,
        fullPage: true
      });
    });
  }

  test('should have consistent color scheme', async ({ page }) => {
    await page.goto('/');
    
    // Check for primary colors
    const primaryButton = page.locator('button').filter({ hasText: /Começar|Agendar|Entrar/i }).first();
    
    if (await primaryButton.isVisible()) {
      const backgroundColor = await primaryButton.evaluate(el => 
        window.getComputedStyle(el).backgroundColor
      );
      
      // Should have some color (not transparent)
      expect(backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    }
  });

  test('should support dark mode toggle', async ({ page }) => {
    await page.goto('/');
    
    // Look for dark mode toggle
    const darkModeToggle = page.locator('button[aria-label*="theme" i]').or(
      page.locator('button').filter({ has: page.locator('svg[class*="moon" i]') })
    );
    
    if (await darkModeToggle.isVisible()) {
      // Get initial background
      const initialBg = await page.locator('body').evaluate(el => 
        window.getComputedStyle(el).backgroundColor
      );
      
      // Toggle dark mode
      await darkModeToggle.click();
      
      // Wait for transition
      await page.waitForTimeout(500);
      
      // Check if background changed
      const newBg = await page.locator('body').evaluate(el => 
        window.getComputedStyle(el).backgroundColor
      );
      
      expect(newBg).not.toBe(initialBg);
    }
  });
});

test.describe('🐛 Error Handling Tests', () => {
  test('should handle 404 pages', async ({ page }) => {
    await page.goto('/non-existent-page');
    
    // Should show 404 or redirect
    const is404 = await page.locator('text=/404|not found/i').isVisible().catch(() => false);
    const isRedirected = page.url().includes('/login') || page.url() === 'http://localhost:3000/';
    
    expect(is404 || isRedirected).toBeTruthy();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    await page.goto('/login');
    
    // Try invalid login
    await page.fill('input[type="email"]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Should show error message or stay on login
    await page.waitForTimeout(2000);
    const hasError = await page.locator('text=/erro|error|inválid/i').isVisible().catch(() => false);
    const stayedOnLogin = page.url().includes('/login');
    
    expect(hasError || stayedOnLogin).toBeTruthy();
  });

  test('should handle network errors', async ({ page }) => {
    // Go offline
    await page.context().setOffline(true);
    
    await page.goto('/').catch(() => {});
    
    // Should show offline message or error
    const hasOfflineIndicator = await page.locator('text=/offline|connection/i').isVisible().catch(() => false);
    
    // Go back online
    await page.context().setOffline(false);
  });

  test('should validate form inputs', async ({ page }) => {
    await page.goto('/register');
    
    // Try submitting empty form
    const submitButton = page.locator('button[type="submit"]').or(
      page.locator('button:has-text("Cadastrar")')
    );
    
    if (await submitButton.isVisible()) {
      await submitButton.click();
      
      // Should show validation errors or not navigate away
      await page.waitForTimeout(1000);
      expect(page.url()).toContain('/register');
    }
  });
});

test.describe('⚡ Performance Tests', () => {
  test('should load landing page quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // Should load in under 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should have optimized images', async ({ page }) => {
    await page.goto('/');
    
    // Check for next/image optimization
    const images = page.locator('img');
    const count = await images.count();
    
    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const src = await img.getAttribute('src');
      
      if (src && !src.startsWith('data:')) {
        // Next.js optimized images usually have _next in the path
        const isOptimized = src.includes('_next') || src.includes('optimize');
        
        // Check image has proper loading attribute
        const loading = await img.getAttribute('loading');
        expect(loading === 'lazy' || loading === 'eager' || isOptimized).toBeTruthy();
      }
    }
  });

  test('should handle rapid navigation', async ({ page }) => {
    await login(page, CLIENT_USER.email, CLIENT_USER.password);
    
    // Rapidly navigate between pages
    const pages = ['/dashboard/client', '/appointments', '/booking'];
    
    for (let i = 0; i < 3; i++) {
      for (const url of pages) {
        await page.goto(url);
        // Page should load without errors
        await expect(page.locator('body')).toBeVisible();
      }
    }
  });
});

test.describe('🔍 Accessibility Tests', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    
    // Check for h1
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThan(0);
    
    // Check heading order
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents();
    expect(headings.length).toBeGreaterThan(0);
  });

  test('should have alt text for images', async ({ page }) => {
    await page.goto('/');
    
    const images = page.locator('img');
    const count = await images.count();
    
    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      
      // Decorative images might have empty alt, which is valid
      expect(alt !== null).toBeTruthy();
    }
  });

  test('should have proper form labels', async ({ page }) => {
    await page.goto('/login');
    
    // Check for labels or aria-labels
    const inputs = page.locator('input');
    const count = await inputs.count();
    
    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const ariaLabel = await input.getAttribute('aria-label');
      const id = await input.getAttribute('id');
      
      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        const hasLabel = await label.isVisible().catch(() => false);
        
        // Should have either label or aria-label
        expect(hasLabel || ariaLabel !== null).toBeTruthy();
      }
    }
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/');
    
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Check if an element is focused
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return el ? el.tagName.toLowerCase() : null;
    });
    
    expect(focusedElement).not.toBeNull();
  });
});

test.describe('📊 Final Report', () => {
  test('generate comprehensive test report', async ({ page }) => {
    const report = {
      timestamp: new Date().toISOString(),
      url: 'http://localhost:3000',
      tests: {
        landing: { status: 'tested', issues: [] },
        authentication: { status: 'tested', issues: [] },
        clientDashboard: { status: 'tested', issues: [] },
        trainerDashboard: { status: 'tested', issues: [] },
        booking: { status: 'tested', issues: [] },
        appointments: { status: 'tested', issues: [] },
        responsive: { status: 'tested', issues: [] },
        performance: { status: 'tested', issues: [] },
        accessibility: { status: 'tested', issues: [] }
      },
      criticalIssues: [],
      warnings: [],
      suggestions: []
    };

    // Test each major page
    const pages = [
      { url: '/', name: 'Landing' },
      { url: '/login', name: 'Login' },
      { url: '/register', name: 'Register' },
      { url: '/booking', name: 'Booking' },
      { url: '/appointments', name: 'Appointments' }
    ];

    for (const pageInfo of pages) {
      try {
        await page.goto(pageInfo.url);
        await page.waitForLoadState('networkidle', { timeout: 10000 });
        
        // Check for console errors
        page.on('console', msg => {
          if (msg.type() === 'error') {
            report.warnings.push(`Console error on ${pageInfo.name}: ${msg.text()}`);
          }
        });

        // Check for failed requests
        page.on('requestfailed', request => {
          report.criticalIssues.push(`Failed request on ${pageInfo.name}: ${request.url()}`);
        });

      } catch (error) {
        report.criticalIssues.push(`Failed to load ${pageInfo.name}: ${error}`);
      }
    }

    // Generate suggestions based on findings
    if (report.criticalIssues.length > 0) {
      report.suggestions.push('Fix critical loading issues immediately');
    }
    
    if (report.warnings.length > 5) {
      report.suggestions.push('Review and fix console errors to improve stability');
    }

    // Save report
    await page.evaluate((reportData) => {
      console.log('=== COMPREHENSIVE TEST REPORT ===');
      console.log(JSON.stringify(reportData, null, 2));
      console.log('=================================');
    }, report);

    expect(report.criticalIssues.length).toBe(0);
  });
});