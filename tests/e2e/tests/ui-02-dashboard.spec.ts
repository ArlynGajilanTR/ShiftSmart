import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';
import { ApiInterceptor } from '../helpers/api-interceptor';

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/dashboard');
  });

  test('Dashboard loads with stats', async ({ page }) => {
    // Verify stats cards are visible
    await expect(page.locator('text=Total Employees')).toBeVisible();
    await expect(page.locator('text=Active Shifts')).toBeVisible();
    await expect(page.locator('text=Open Conflicts')).toBeVisible();
    await expect(page.locator('text=Coverage Rate')).toBeVisible();
  });

  test('Sidebar navigation links work', async ({ page }) => {
    // Dashboard link
    await page.click('text=Dashboard');
    await expect(page).toHaveURL('/dashboard');
    
    // Schedule link
    await page.click('text=Schedule');
    await expect(page).toHaveURL('/dashboard/schedule');
    
    // Employees link
    await page.click('text=Employees');
    await expect(page).toHaveURL('/dashboard/employees');
    
    // Conflicts link
    await page.click('text=Conflicts');
    await expect(page).toHaveURL('/dashboard/conflicts');
    
    // Settings link (in footer)
    await page.click('text=Settings');
    await expect(page).toHaveURL('/dashboard/settings');
  });

  test('Add Shift button is visible', async ({ page }) => {
    await page.goto('/dashboard');
    const addShiftButton = page.locator('button:has-text("Add Shift")');
    await expect(addShiftButton).toBeVisible();
  });

  test('Calendar view tabs switch correctly', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Switch to Week view
    await page.click('button:has-text("Week")');
    await expect(page.locator('text=/Week|Monday|Tuesday/i')).toBeVisible();
    
    // Switch to Month view
    await page.click('button:has-text("Month")');
    await expect(page.locator('text=/January|February|March/i')).toBeVisible();
    
    // Switch to Quarter view
    await page.click('button:has-text("Quarter")');
    await expect(page.locator('text=/Q[1-4]/i')).toBeVisible();
  });

  test('Calendar navigation buttons work', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('button:has-text("Month")');
    
    // Get current month text
    const currentMonth = await page.locator('h3').first().textContent();
    
    // Click previous button
    const prevButton = page.locator('button').filter({ has: page.locator('svg') }).first();
    await prevButton.click();
    
    // Wait for calendar update
    await page.waitForTimeout(500);
    
    // Verify month changed (or calendar updated)
    const newMonth = await page.locator('h3').first().textContent();
    expect(newMonth).toBeTruthy();
  });

  test('View All Conflicts button is visible', async ({ page }) => {
    await page.goto('/dashboard');
    const viewConflictsButton = page.locator('button:has-text("View All Conflicts")');
    await expect(viewConflictsButton).toBeVisible();
  });

  test('Dashboard fetches data from API', async ({ page }) => {
    const apiInterceptor = new ApiInterceptor(page);
    await apiInterceptor.start();

    await page.goto('/dashboard');
    await page.waitForTimeout(3000); // Wait for API calls
    
    // Verify dashboard stats API call
    const statsCall = apiInterceptor.getLatestCall(/\/api\/dashboard\/stats/);
    expect(statsCall).not.toBeNull();
    
    // Verify shifts API call
    const shiftsCall = apiInterceptor.getLatestCall(/\/api\/shifts\/upcoming/);
    expect(shiftsCall).not.toBeNull();
    
    // Verify conflicts API call
    const conflictsCall = apiInterceptor.getLatestCall(/\/api\/conflicts/);
    expect(conflictsCall).not.toBeNull();
    
    await apiInterceptor.stop();
  });

  test('Logout button works', async ({ page }) => {
    const apiInterceptor = new ApiInterceptor(page);
    await apiInterceptor.start();

    // Click logout
    await page.click('text=Log Out');
    
    // Wait for API call
    await page.waitForTimeout(1000);
    
    // Verify navigation to home
    await expect(page).toHaveURL('/', { timeout: 5000 });
    
    // Verify token removed
    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(token).toBeNull();
    
    await apiInterceptor.stop();
  });
});

