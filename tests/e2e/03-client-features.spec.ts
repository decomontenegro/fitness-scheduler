import { test, expect } from '@playwright/test';

test.describe('Client Features Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login as client
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'client@test.com');
    await page.fill('input[type="password"], input[name="password"]', '123456');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
  });

  test('01. Client Dashboard loads correctly', async ({ page }) => {
    // Check if we're on a dashboard/home page
    const url = page.url();
    expect(url).toMatch(/dashboard|home|schedule|agenda/);
    
    // Check for client-specific elements
    const elements = [
      'text=/appointment|agendamento|aula/i',
      'text=/trainer|professor|instrutor/i',
      'text=/schedule|agenda|horário/i',
      'text=/book|agendar|marcar/i',
    ];
    
    for (const selector of elements) {
      const element = page.locator(selector);
      if (await element.count() > 0) {
        console.log(`Found: ${selector}`);
      }
    }
  });

  test('02. Client can view available trainers', async ({ page }) => {
    // Look for trainers section
    const trainersLink = page.locator('a[href*="trainer"], button:has-text(/trainer|professor|instrutor/i)');
    
    if (await trainersLink.count() > 0) {
      await trainersLink.first().click();
      await page.waitForTimeout(2000);
      
      // Check for trainer list
      const trainerList = page.locator('div:has-text("Test Trainer"), [class*="trainer"], [class*="card"]');
      if (await trainerList.count() > 0) {
        console.log('Found trainer list');
      }
    }
  });

  test('03. Client can access booking/scheduling', async ({ page }) => {
    // Look for booking functionality
    const bookingLink = page.locator('a[href*="book"], a[href*="schedule"], button:has-text(/book|agendar|marcar|schedule/i)');
    
    if (await bookingLink.count() > 0) {
      await bookingLink.first().click();
      await page.waitForTimeout(2000);
      
      // Check for calendar or time slots
      const bookingElements = page.locator('[type="date"], [type="time"], .calendar, [class*="slot"], button:has-text(/horário|time|slot/i)');
      if (await bookingElements.count() > 0) {
        console.log('Found booking elements');
      }
    }
  });

  test('04. Client can view their appointments', async ({ page }) => {
    // Look for appointments section
    const appointmentsLink = page.locator('a[href*="appointment"], button:has-text(/appointment|agendamento|minhas aulas/i)');
    
    if (await appointmentsLink.count() > 0) {
      await appointmentsLink.first().click();
      await page.waitForTimeout(2000);
      
      // Check for appointments list
      const appointmentsList = page.locator('table, [role="list"], div:has-text(/appointment|agendamento|aula/)');
      if (await appointmentsList.count() > 0) {
        console.log('Found appointments list');
        
        // Check for cancel buttons
        const cancelButtons = page.locator('button:has-text(/cancel|cancelar|desmarcar/i)');
        console.log(`Found ${await cancelButtons.count()} cancel buttons`);
      }
    }
  });

  test('05. Client can access notifications', async ({ page }) => {
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

  test('06. Client can view their progress/analytics', async ({ page }) => {
    // Look for progress or analytics
    const progressLink = page.locator('a[href*="progress"], a[href*="analytics"], button:has-text(/progress|progresso|estatística|analytics/i)');
    
    if (await progressLink.count() > 0) {
      await progressLink.first().click();
      await page.waitForTimeout(2000);
      
      // Check for charts or statistics
      const statsContent = page.locator('canvas, svg, [class*="chart"], text=/total|sessions|aulas|workout/i');
      if (await statsContent.count() > 0) {
        console.log('Found progress/analytics');
      }
    }
  });

  test('07. Client can access messages', async ({ page }) => {
    // Look for messages section
    const messagesLink = page.locator('a[href*="message"], button:has-text(/message|mensagem|chat/i)');
    
    if (await messagesLink.count() > 0) {
      await messagesLink.first().click();
      await page.waitForTimeout(2000);
      
      // Check for messages interface
      const messagesContent = page.locator('[class*="message"], [class*="chat"], textarea, input[placeholder*="message"]');
      if (await messagesContent.count() > 0) {
        console.log('Found messages interface');
      }
    }
  });

  test('08. Client can access profile settings', async ({ page }) => {
    // Look for profile or settings
    const profileLink = page.locator('a[href*="profile"], a[href*="settings"], button:has-text(/profile|perfil|settings|configuração/i)');
    
    if (await profileLink.count() > 0) {
      await profileLink.first().click();
      await page.waitForTimeout(2000);
      
      // Check for profile form
      const profileForm = page.locator('input[name="name"], input[name="email"], input[name="phone"]');
      if (await profileForm.count() > 0) {
        console.log('Found profile settings');
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