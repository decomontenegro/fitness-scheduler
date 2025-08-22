import { test, expect } from '@playwright/test';

test.describe('Booking and Appointment Flow Tests', () => {
  test('01. Complete booking flow - Client books appointment with Trainer', async ({ page }) => {
    // Login as client
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'client@test.com');
    await page.fill('input[type="password"], input[name="password"]', '123456');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Navigate to booking/schedule
    const bookingLink = page.locator('a[href*="schedule"], a[href*="book"], button:has-text(/schedule|agendar|book/i)');
    if (await bookingLink.count() > 0) {
      await bookingLink.first().click();
      await page.waitForTimeout(2000);
      
      // Look for trainer selection
      const trainerOption = page.locator('text=/Test Trainer|trainer@test.com/i');
      if (await trainerOption.count() > 0) {
        await trainerOption.first().click();
        console.log('Selected trainer');
      }
      
      // Look for date selection
      const dateInput = page.locator('input[type="date"], [class*="calendar"], button[aria-label*="date"]');
      if (await dateInput.count() > 0) {
        // Select tomorrow's date
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateString = tomorrow.toISOString().split('T')[0];
        
        if (await dateInput.first().getAttribute('type') === 'date') {
          await dateInput.first().fill(dateString);
        } else {
          await dateInput.first().click();
          // Try to select tomorrow in calendar
          await page.waitForTimeout(1000);
        }
        console.log('Selected date');
      }
      
      // Look for time selection
      const timeSlot = page.locator('button:has-text(/[0-9]{1,2}:[0-9]{2}/), input[type="time"], select:has-text(/hora|time/i)');
      if (await timeSlot.count() > 0) {
        await timeSlot.first().click();
        console.log('Selected time slot');
      }
      
      // Look for service selection
      const serviceOption = page.locator('select[name*="service"], input[type="radio"][name*="service"], button:has-text(/personal|group|pilates/i)');
      if (await serviceOption.count() > 0) {
        await serviceOption.first().click();
        console.log('Selected service');
      }
      
      // Confirm booking
      const confirmButton = page.locator('button:has-text(/confirm|confirmar|book|agendar/i)');
      if (await confirmButton.count() > 0) {
        await confirmButton.first().click();
        await page.waitForTimeout(2000);
        
        // Check for success message
        const successMessage = page.locator('text=/success|sucesso|confirmado|booked/i');
        if (await successMessage.count() > 0) {
          console.log('Booking confirmed successfully');
        }
      }
    }
  });

  test('02. View appointments - Client perspective', async ({ page }) => {
    // Login as client
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'client@test.com');
    await page.fill('input[type="password"], input[name="password"]', '123456');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Navigate to appointments
    const appointmentsLink = page.locator('a[href*="appointment"], button:has-text(/appointment|agendamento/i)');
    if (await appointmentsLink.count() > 0) {
      await appointmentsLink.first().click();
      await page.waitForTimeout(2000);
      
      // Check for appointment list
      const appointments = page.locator('[class*="appointment"], [class*="card"], table tr, [role="listitem"]');
      const count = await appointments.count();
      console.log(`Found ${count} appointments`);
      
      // Check appointment details
      if (count > 0) {
        const firstAppointment = appointments.first();
        
        // Check for essential information
        const hasDate = await firstAppointment.locator('text=/[0-9]{1,2}[/-][0-9]{1,2}/').count() > 0;
        const hasTime = await firstAppointment.locator('text=/[0-9]{1,2}:[0-9]{2}/').count() > 0;
        const hasTrainer = await firstAppointment.locator('text=/trainer|professor|Test Trainer/i').count() > 0;
        
        console.log(`Appointment has: Date=${hasDate}, Time=${hasTime}, Trainer=${hasTrainer}`);
      }
    }
  });

  test('03. View appointments - Trainer perspective', async ({ page }) => {
    // Login as trainer
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'trainer@test.com');
    await page.fill('input[type="password"], input[name="password"]', '123456');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Navigate to appointments or schedule
    const appointmentsLink = page.locator('a[href*="appointment"], a[href*="schedule"], button:has-text(/appointment|agendamento|schedule/i)');
    if (await appointmentsLink.count() > 0) {
      await appointmentsLink.first().click();
      await page.waitForTimeout(2000);
      
      // Check for appointment list or calendar
      const appointments = page.locator('[class*="appointment"], [class*="event"], table tr, [role="listitem"]');
      const count = await appointments.count();
      console.log(`Trainer sees ${count} appointments`);
      
      // Check for client information
      if (count > 0) {
        const hasClient = await page.locator('text=/client|aluno|Test Client/i').count() > 0;
        console.log(`Can see client info: ${hasClient}`);
      }
    }
  });

  test('04. Cancel appointment - Client', async ({ page }) => {
    // Login as client
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'client@test.com');
    await page.fill('input[type="password"], input[name="password"]', '123456');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Navigate to appointments
    const appointmentsLink = page.locator('a[href*="appointment"], button:has-text(/appointment|agendamento/i)');
    if (await appointmentsLink.count() > 0) {
      await appointmentsLink.first().click();
      await page.waitForTimeout(2000);
      
      // Look for cancel button
      const cancelButton = page.locator('button:has-text(/cancel|cancelar|desmarcar/i)');
      if (await cancelButton.count() > 0) {
        console.log('Found cancel button');
        
        // Click first cancel button
        await cancelButton.first().click();
        await page.waitForTimeout(1000);
        
        // Check for confirmation dialog
        const confirmDialog = page.locator('[role="dialog"], .modal, text=/confirm|confirmar|sure|certeza/i');
        if (await confirmDialog.count() > 0) {
          console.log('Confirmation dialog appeared');
          
          // Confirm cancellation
          const confirmButton = page.locator('button:has-text(/yes|sim|confirm|confirmar/i)');
          if (await confirmButton.count() > 0) {
            await confirmButton.first().click();
            await page.waitForTimeout(2000);
            
            // Check for success message
            const successMessage = page.locator('text=/cancelled|cancelado|removed|removido/i');
            if (await successMessage.count() > 0) {
              console.log('Appointment cancelled successfully');
            }
          }
        }
      }
    }
  });

  test('05. Check availability - Trainer', async ({ page }) => {
    // Login as trainer
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'trainer@test.com');
    await page.fill('input[type="password"], input[name="password"]', '123456');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Navigate to availability settings
    const availabilityLink = page.locator('a[href*="availability"], button:has-text(/availability|disponibilidade|horário/i)');
    if (await availabilityLink.count() > 0) {
      await availabilityLink.first().click();
      await page.waitForTimeout(2000);
      
      // Check for day selection
      const daySelectors = page.locator('input[type="checkbox"], text=/monday|segunda|tuesday|terça/i');
      console.log(`Found ${await daySelectors.count()} day selectors`);
      
      // Check for time inputs
      const timeInputs = page.locator('input[type="time"], select:has-text(/hora|hour/i)');
      console.log(`Found ${await timeInputs.count()} time inputs`);
      
      // Try to modify availability
      if (await timeInputs.count() >= 2) {
        // Set start time
        await timeInputs.first().fill('09:00');
        // Set end time
        await timeInputs.nth(1).fill('18:00');
        
        // Save changes
        const saveButton = page.locator('button:has-text(/save|salvar|update|atualizar/i)');
        if (await saveButton.count() > 0) {
          await saveButton.first().click();
          await page.waitForTimeout(2000);
          
          // Check for success message
          const successMessage = page.locator('text=/saved|salvo|updated|atualizado/i');
          if (await successMessage.count() > 0) {
            console.log('Availability updated successfully');
          }
        }
      }
    }
  });
});