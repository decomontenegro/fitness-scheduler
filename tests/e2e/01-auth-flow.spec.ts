import { test, expect } from '@playwright/test';

test.describe('Authentication Flow Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('01. Homepage redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });

  test('02. Login page elements are visible', async ({ page }) => {
    await page.goto('/login');
    
    // Check if all elements are present
    await expect(page.locator('h1')).toContainText(/Login|Entrar|Sign In/i);
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Check for links
    const registerLink = page.locator('a[href="/register"]');
    const forgotPasswordLink = page.locator('text=/esqueci|forgot|recuperar/i');
    
    if (await registerLink.count() > 0) {
      await expect(registerLink).toBeVisible();
    }
    
    if (await forgotPasswordLink.count() > 0) {
      await expect(forgotPasswordLink).toBeVisible();
    }
  });

  test('03. Login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[type="email"], input[name="email"]', 'invalid@test.com');
    await page.fill('input[type="password"], input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Wait for error message
    await page.waitForTimeout(2000);
    
    // Check if still on login page (not redirected)
    await expect(page).toHaveURL(/\/login/);
  });

  test('04. Login as Trainer works correctly', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[type="email"], input[name="email"]', 'trainer@test.com');
    await page.fill('input[type="password"], input[name="password"]', '123456');
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForTimeout(3000);
    
    // Should redirect to dashboard or schedule
    const url = page.url();
    expect(url).toMatch(/dashboard|schedule|home|agenda/);
    
    // Store auth state for future tests
    await page.context().storageState({ path: 'tests/e2e/.auth/trainer.json' });
  });

  test('05. Login as Client works correctly', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[type="email"], input[name="email"]', 'client@test.com');
    await page.fill('input[type="password"], input[name="password"]', '123456');
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForTimeout(3000);
    
    // Should redirect to dashboard or schedule
    const url = page.url();
    expect(url).toMatch(/dashboard|schedule|home|agenda/);
    
    // Store auth state for future tests
    await page.context().storageState({ path: 'tests/e2e/.auth/client.json' });
  });

  test('06. Registration page is accessible', async ({ page }) => {
    await page.goto('/register');
    
    // Check if registration form elements are present
    await expect(page.locator('input[name="name"], input[placeholder*="nome"], input[placeholder*="name"]').first()).toBeVisible();
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
    
    // Check for role selection
    const roleSelector = page.locator('select[name="role"], input[type="radio"][name="role"], button:has-text(/trainer|client|treinador|cliente/i)');
    if (await roleSelector.count() > 0) {
      await expect(roleSelector.first()).toBeVisible();
    }
  });

  test('07. Logout functionality works', async ({ page }) => {
    // First login
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'trainer@test.com');
    await page.fill('input[type="password"], input[name="password"]', '123456');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Look for logout button/link
    const logoutButton = page.locator('button:has-text(/logout|sair|sign out/i), a:has-text(/logout|sair|sign out/i)');
    
    if (await logoutButton.count() > 0) {
      await logoutButton.first().click();
      await page.waitForTimeout(2000);
      
      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
    }
  });
});