import { test, expect } from '@playwright/test';

test.describe('General Health and Responsiveness Tests', () => {
  test('01. Check all pages for errors (Trainer)', async ({ page }) => {
    // Login as trainer
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'trainer@test.com');
    await page.fill('input[type="password"], input[name="password"]', '123456');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    const pagesToCheck = [
      '/dashboard',
      '/dashboard/trainer',
      '/schedule',
      '/trainer/schedule',
      '/trainer/availability',
      '/trainer/services',
      '/appointments',
      '/notifications',
      '/messages',
      '/analytics',
      '/trainer-analytics',
      '/reports',
      '/contact',
    ];
    
    const errors = [];
    
    for (const path of pagesToCheck) {
      await page.goto(path);
      await page.waitForTimeout(2000);
      
      // Check for error messages
      const errorIndicators = [
        'text=/error|erro|failed|falhou|500|404|403/i',
        'text=/not found|não encontrado|página não existe/i',
        'text=/something went wrong|algo deu errado/i',
        '.error, .alert-danger, [class*="error"]'
      ];
      
      for (const selector of errorIndicators) {
        const errorElement = page.locator(selector);
        if (await errorElement.count() > 0 && !path.includes('404')) {
          const errorText = await errorElement.first().textContent();
          errors.push({ path, error: errorText });
          console.log(`Error on ${path}: ${errorText}`);
        }
      }
      
      // Check if page has content
      const bodyText = await page.locator('body').textContent();
      if (bodyText && bodyText.length < 100) {
        console.log(`Page ${path} seems empty or broken`);
      }
    }
    
    console.log(`Total errors found: ${errors.length}`);
  });

  test('02. Check all pages for errors (Client)', async ({ page }) => {
    // Login as client
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'client@test.com');
    await page.fill('input[type="password"], input[name="password"]', '123456');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    const pagesToCheck = [
      '/dashboard',
      '/dashboard/client',
      '/schedule',
      '/appointments',
      '/notifications',
      '/messages',
      '/client-analytics',
      '/contact',
    ];
    
    const errors = [];
    
    for (const path of pagesToCheck) {
      await page.goto(path);
      await page.waitForTimeout(2000);
      
      // Check for error messages
      const errorIndicators = [
        'text=/error|erro|failed|falhou|500|404|403/i',
        'text=/not found|não encontrado|página não existe/i',
        'text=/something went wrong|algo deu errado/i',
        '.error, .alert-danger, [class*="error"]'
      ];
      
      for (const selector of errorIndicators) {
        const errorElement = page.locator(selector);
        if (await errorElement.count() > 0 && !path.includes('404')) {
          const errorText = await errorElement.first().textContent();
          errors.push({ path, error: errorText });
          console.log(`Error on ${path}: ${errorText}`);
        }
      }
      
      // Check if page has content
      const bodyText = await page.locator('body').textContent();
      if (bodyText && bodyText.length < 100) {
        console.log(`Page ${path} seems empty or broken`);
      }
    }
    
    console.log(`Total errors found: ${errors.length}`);
  });

  test('03. Mobile responsiveness check', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'trainer@test.com');
    await page.fill('input[type="password"], input[name="password"]', '123456');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Check for mobile menu
    const mobileMenuButton = page.locator('button[aria-label*="menu"], button:has-text(/menu/i), [class*="burger"], [class*="hamburger"]');
    if (await mobileMenuButton.count() > 0) {
      console.log('Mobile menu button found');
      await mobileMenuButton.first().click();
      await page.waitForTimeout(1000);
      
      // Check if menu opened
      const mobileMenu = page.locator('nav:visible, [class*="mobile-menu"], [class*="sidebar"]');
      if (await mobileMenu.count() > 0) {
        console.log('Mobile menu opens correctly');
      }
    }
    
    // Check for horizontal overflow
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    
    if (hasHorizontalScroll) {
      console.log('Warning: Page has horizontal scroll on mobile');
    }
    
    // Check if buttons are tapable size (at least 44x44px)
    const buttons = await page.locator('button:visible').all();
    let smallButtons = 0;
    
    for (const button of buttons.slice(0, 5)) {
      const box = await button.boundingBox();
      if (box && (box.width < 44 || box.height < 44)) {
        smallButtons++;
      }
    }
    
    if (smallButtons > 0) {
      console.log(`Warning: ${smallButtons} buttons are too small for mobile`);
    }
  });

  test('04. Check forms validation', async ({ page }) => {
    await page.goto('/login');
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    
    // Check for validation messages
    const validationMessages = page.locator('[class*="error"], [class*="invalid"], :invalid, [aria-invalid="true"]');
    const hasValidation = await validationMessages.count() > 0;
    console.log(`Login form has validation: ${hasValidation}`);
    
    // Test with invalid email
    await page.fill('input[type="email"], input[name="email"]', 'notanemail');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    
    const emailError = await page.locator('text=/email|e-mail/i').count() > 0;
    console.log(`Email validation works: ${emailError}`);
  });

  test('05. Performance check - Page load times', async ({ page }) => {
    const loadTimes = [];
    
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'trainer@test.com');
    await page.fill('input[type="password"], input[name="password"]', '123456');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    const pagesToTest = ['/dashboard', '/schedule', '/appointments'];
    
    for (const path of pagesToTest) {
      const startTime = Date.now();
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      loadTimes.push({ path, loadTime });
      console.log(`${path} loaded in ${loadTime}ms`);
      
      if (loadTime > 3000) {
        console.log(`Warning: ${path} takes more than 3 seconds to load`);
      }
    }
    
    const avgLoadTime = loadTimes.reduce((acc, curr) => acc + curr.loadTime, 0) / loadTimes.length;
    console.log(`Average load time: ${avgLoadTime}ms`);
  });

  test('06. Check for console errors', async ({ page }) => {
    const consoleErrors = [];
    
    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    page.on('pageerror', error => {
      consoleErrors.push(error.message);
    });
    
    // Login and navigate through pages
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'trainer@test.com');
    await page.fill('input[type="password"], input[name="password"]', '123456');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    const pages = ['/dashboard', '/schedule', '/appointments'];
    
    for (const path of pages) {
      await page.goto(path);
      await page.waitForTimeout(2000);
    }
    
    if (consoleErrors.length > 0) {
      console.log(`Found ${consoleErrors.length} console errors:`);
      consoleErrors.forEach(error => console.log(`  - ${error}`));
    } else {
      console.log('No console errors found');
    }
  });

  test('07. Check accessibility basics', async ({ page }) => {
    await page.goto('/login');
    
    // Check for alt texts on images
    const images = await page.locator('img').all();
    let missingAlt = 0;
    
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      if (!alt || alt.trim() === '') {
        missingAlt++;
      }
    }
    
    if (missingAlt > 0) {
      console.log(`${missingAlt} images missing alt text`);
    }
    
    // Check for form labels
    const inputs = await page.locator('input, select, textarea').all();
    let missingLabels = 0;
    
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const placeholder = await input.getAttribute('placeholder');
      
      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        if (await label.count() === 0 && !ariaLabel) {
          missingLabels++;
        }
      } else if (!ariaLabel && !placeholder) {
        missingLabels++;
      }
    }
    
    if (missingLabels > 0) {
      console.log(`${missingLabels} form inputs potentially missing labels`);
    }
    
    // Check for keyboard navigation
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);
    
    const focusedElement = await page.evaluate(() => {
      return document.activeElement?.tagName;
    });
    
    console.log(`First Tab focuses on: ${focusedElement}`);
  });
});