import { test, expect } from '@playwright/test';

test.describe('ShiftSmart Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login page correctly', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/ShiftSmart/i);
    
    // Check for login form elements
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /log in/i })).toBeVisible();
    
    // Check for Reuters branding
    await expect(page.locator('img[alt="Reuters"]')).toBeVisible();
  });

  test('should reject invalid credentials', async ({ page }) => {
    // Fill in invalid credentials
    await page.getByLabel(/email/i).fill('invalid@test.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    
    // Submit form
    await page.getByRole('button', { name: /log in/i }).click();
    
    // Check for error message
    await expect(page.getByText(/login failed/i)).toBeVisible();
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    // Fill in valid credentials
    await page.getByLabel(/email/i).fill('gianluca.semeraro@thomsonreuters.com');
    await page.getByLabel(/password/i).fill('changeme');
    
    // Submit form
    await page.getByRole('button', { name: /log in/i }).click();
    
    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard');
    
    // Verify we're on the dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText(/total employees/i)).toBeVisible();
  });

  test('should store auth token in localStorage', async ({ page }) => {
    // Login
    await page.getByLabel(/email/i).fill('gianluca.semeraro@thomsonreuters.com');
    await page.getByLabel(/password/i).fill('changeme');
    await page.getByRole('button', { name: /log in/i }).click();
    
    // Wait for dashboard
    await page.waitForURL('**/dashboard');
    
    // Check localStorage for token
    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(token).toBeTruthy();
    expect(token?.length).toBeGreaterThan(20);
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.getByLabel(/email/i).fill('gianluca.semeraro@thomsonreuters.com');
    await page.getByLabel(/password/i).fill('changeme');
    await page.getByRole('button', { name: /log in/i }).click();
    await page.waitForURL('**/dashboard');
    
    // Find and click logout button
    await page.getByRole('button', { name: /logout/i }).click();
    
    // Should redirect to login
    await page.waitForURL('**/login');
    await expect(page).toHaveURL(/\/login/);
    
    // Token should be cleared
    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(token).toBeNull();
  });
});

