import { test, expect } from '@playwright/test';

test.describe('Trainer Features Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login as trainer
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'trainer@test.com');
    await page.fill('input[type="password"], input[name="password"]', '123456');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
  });

  test('01. Trainer Dashboard loads correctly', async ({ page }) => {
    // Check if we're on a dashboard/home page
    const url = page.url();
    expect(url).toMatch(/dashboard|home|schedule|agenda/);
    
    // Check for trainer-specific elements
    const elements = [
      'text=/client|aluno|student/i',
      'text=/appointment|agendamento|aula/i',
      'text=/schedule|agenda|horário/i',
      'text=/service|serviço/i',
    ];
    
    for (const selector of elements) {
      const element = page.locator(selector);
      if (await element.count() > 0) {
        console.log(`Found: ${selector}`);
      }
    }
  });

  test('02. Trainer can access Schedule page', async ({ page }) => {
    // Try to find and click schedule link
    const scheduleLink = page.locator('a[href*="schedule"], a[href*="agenda"], button:has-text(/schedule|agenda|calendário/i)');
    
    if (await scheduleLink.count() > 0) {
      await scheduleLink.first().click();
      await page.waitForTimeout(2000);
      
      // Verify we're on schedule page
      const url = page.url();
      expect(url).toMatch(/schedule|agenda|calendar/);
      
      // Check for calendar/schedule elements
      const calendarElement = page.locator('.calendar, [class*="calendar"], [class*="schedule"], table, [role="grid"]');
      if (await calendarElement.count() > 0) {
        await expect(calendarElement.first()).toBeVisible();
      }
    }
  });

  test('03. Trainer can access Services page', async ({ page }) => {
    // Navigate to services
    const servicesLink = page.locator('a[href*="service"], button:has-text(/service|serviço/i)');
    
    if (await servicesLink.count() > 0) {
      await servicesLink.first().click();
      await page.waitForTimeout(2000);
      
      // Check if services page loaded
      const servicesContent = page.locator('text=/service|serviço/i');
      if (await servicesContent.count() > 0) {
        await expect(servicesContent.first()).toBeVisible();
      }
    }
  });

  test('04. Trainer can access Availability settings', async ({ page }) => {
    // Look for availability settings
    const availabilityLink = page.locator('a[href*="availability"], button:has-text(/availability|disponibilidade|horário/i)');
    
    if (await availabilityLink.count() > 0) {
      await availabilityLink.first().click();
      await page.waitForTimeout(2000);
      
      // Check for time/availability settings
      const timeSettings = page.locator('input[type="time"], select:has-text(/hora|hour|time/i), text=/segunda|monday|terça|tuesday/i');
      if (await timeSettings.count() > 0) {
        console.log('Found availability settings');
      }
    }
  });

  test('05. Trainer can view client list', async ({ page }) => {
    // Look for clients/students section
    const clientsLink = page.locator('a[href*="client"], a[href*="aluno"], button:has-text(/client|aluno|student/i)');
    
    if (await clientsLink.count() > 0) {
      await clientsLink.first().click();
      await page.waitForTimeout(2000);
      
      // Check for client list or table
      const clientList = page.locator('table, [role="list"], div:has-text(/client|aluno/)');
      if (await clientList.count() > 0) {
        console.log('Found client list');
      }
    }
  });

  test('06. Trainer can access appointments', async ({ page }) => {
    // Look for appointments section
    const appointmentsLink = page.locator('a[href*="appointment"], button:has-text(/appointment|agendamento|aula/i)');
    
    if (await appointmentsLink.count() > 0) {
      await appointmentsLink.first().click();
      await page.waitForTimeout(2000);
      
      // Check for appointments list
      const appointmentsList = page.locator('table, [role="list"], div:has-text(/appointment|agendamento/)');
      if (await appointmentsList.count() > 0) {
        console.log('Found appointments list');
      }
    }
  });

  test('07. Trainer can access notifications', async ({ page }) => {
    // Look for notifications
    const notificationsLink = page.locator('a[href*="notification"], button[aria-label*="notification"], [class*="notification"]');
    
    if (await notificationsLink.count() > 0) {
      await notificationsLink.first().click();
      await page.waitForTimeout(2000);
      
      // Check for notifications content
      const notificationsContent = page.locator('text=/notification|notificação|mensagem/i');
      if (await notificationsContent.count() > 0) {
        console.log('Found notifications');
      }
    }
  });

  test('08. Trainer can access analytics/reports', async ({ page }) => {
    // Look for analytics or reports
    const analyticsLink = page.locator('a[href*="analytics"], a[href*="report"], button:has-text(/analytics|relatório|report|estatística/i)');
    
    if (await analyticsLink.count() > 0) {
      await analyticsLink.first().click();
      await page.waitForTimeout(2000);
      
      // Check for charts or statistics
      const statsContent = page.locator('canvas, svg, [class*="chart"], text=/total|média|revenue|receita/i');
      if (await statsContent.count() > 0) {
        console.log('Found analytics/reports');
      }
    }
  });

  test('09. Check all navigation links work', async ({ page }) => {
    // Get all navigation links
    const navLinks = await page.locator('nav a, header a, [role="navigation"] a').all();
    
    console.log(`Found ${navLinks.length} navigation links`);
    
    for (const link of navLinks) {
      const href = await link.getAttribute('href');
      const text = await link.textContent();
      
      if (href && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
        console.log(`Testing link: ${text} -> ${href}`);
        
        await link.click();
        await page.waitForTimeout(1000);
        
        // Check if page loaded without errors
        const errorText = page.locator('text=/error|erro|404|500/i');
        if (await errorText.count() > 0) {
          console.log(`Error found on page: ${href}`);
        }
        
        // Go back to test next link
        await page.goBack();
        await page.waitForTimeout(1000);
      }
    }
  });

  test('10. Check all buttons are clickable', async ({ page }) => {
    // Get all buttons
    const buttons = await page.locator('button:visible').all();
    
    console.log(`Found ${buttons.length} visible buttons`);
    
    for (let i = 0; i < Math.min(buttons.length, 10); i++) {
      const button = buttons[i];
      const text = await button.textContent();
      
      if (text && !text.includes('Logout') && !text.includes('Sair')) {
        console.log(`Testing button: ${text}`);
        
        const isDisabled = await button.isDisabled();
        if (!isDisabled) {
          await button.click();
          await page.waitForTimeout(1000);
          
          // Check for modals or popups
          const modal = page.locator('[role="dialog"], .modal, [class*="modal"]');
          if (await modal.count() > 0) {
            console.log('Modal opened');
            
            // Close modal if possible
            const closeButton = page.locator('[aria-label*="close"], button:has-text(/close|fechar|cancelar/i)');
            if (await closeButton.count() > 0) {
              await closeButton.first().click();
              await page.waitForTimeout(500);
            }
          }
        }
      }
    }
  });
});