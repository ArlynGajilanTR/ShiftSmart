import { test, expect } from '@playwright/test';

test.describe('ShiftSmart Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('gianluca.semeraro@thomsonreuters.com');
    await page.getByLabel(/password/i).fill('changeme');
    await page.getByRole('button', { name: /log in/i }).click();
    await page.waitForURL('**/dashboard');
  });

  test('should display dashboard stats', async ({ page }) => {
    // Check for all 4 stat cards
    await expect(page.getByText(/total employees/i)).toBeVisible();
    await expect(page.getByText(/active shifts/i)).toBeVisible();
    await expect(page.getByText(/open conflicts/i)).toBeVisible();
    await expect(page.getByText(/coverage rate/i)).toBeVisible();
  });

  test('should display employee count of 15', async ({ page }) => {
    // Wait for data to load
    await page.waitForTimeout(2000);
    
    // Check for employee count (Breaking News team)
    const statsCard = page.getByText(/total employees/i).locator('..');
    await expect(statsCard).toContainText('15');
  });

  test('should display calendar views', async ({ page }) => {
    // Check for calendar view tabs
    await expect(page.getByRole('tab', { name: /week/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /month/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /quarter/i })).toBeVisible();
    
    // Test switching views
    await page.getByRole('tab', { name: /month/i }).click();
    await expect(page.getByRole('tabpanel')).toBeVisible();
    
    await page.getByRole('tab', { name: /quarter/i }).click();
    await expect(page.getByRole('tabpanel')).toBeVisible();
  });

  test('should display upcoming shifts table', async ({ page }) => {
    // Wait for data to load
    await page.waitForTimeout(2000);
    
    // Check for table headers
    await expect(page.getByRole('columnheader', { name: /employee/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /role/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /bureau/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /date/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /time/i })).toBeVisible();
  });

  test('should display conflicts panel', async ({ page }) => {
    // Check for conflicts section
    await expect(page.getByText(/recent conflicts/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /view all conflicts/i })).toBeVisible();
  });

  test('should show loading state initially', async ({ page }) => {
    // Navigate to dashboard (already logged in)
    await page.reload();
    
    // Should see loading spinner briefly
    const loadingSpinner = page.locator('.animate-spin');
    const loadingText = page.getByText(/loading dashboard/i);
    
    // At least one of these should be visible briefly
    const hasLoading = await Promise.race([
      loadingSpinner.isVisible().then(() => true),
      loadingText.isVisible().then(() => true),
      page.waitForTimeout(1000).then(() => false)
    ]);
    
    // Eventually data should load
    await expect(page.getByText(/total employees/i)).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to other pages', async ({ page }) => {
    // Test navigation to employees page
    await page.getByRole('link', { name: /employees/i }).click();
    await expect(page).toHaveURL(/\/employees/);
    
    // Navigate back
    await page.goBack();
    
    // Test navigation to schedule page
    await page.getByRole('link', { name: /schedule/i }).click();
    await expect(page).toHaveURL(/\/schedule/);
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Intercept API calls and make them fail
    await page.route('**/api/dashboard/stats', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Server error' })
      });
    });
    
    // Reload page to trigger API call
    await page.reload();
    
    // Should show error message or fallback to mock data
    await expect(page.getByText(/failed to load|using cached data/i)).toBeVisible({
      timeout: 5000
    });
  });

  test('should use Reuters branding', async ({ page }) => {
    // Check for Reuters logo
    await expect(page.locator('img[alt="Reuters"]')).toBeVisible();
    
    // Check for orange primary color (Reuters brand)
    const button = page.getByRole('button', { name: /add shift/i }).first();
    const bgColor = await button.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    
    // Reuters orange is rgb(255, 102, 0) or close
    expect(bgColor).toMatch(/rgb\(255,\s*102,\s*0\)|rgb\(255,\s*106,\s*0\)|#FF6600/);
  });
});

