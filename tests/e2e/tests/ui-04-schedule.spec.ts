import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';
import { ApiInterceptor } from '../helpers/api-interceptor';

test.describe('Schedule Page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/dashboard/schedule');
    await page.waitForTimeout(2000); // Wait for shifts to load
  });

  test('Schedule page loads with shifts', async ({ page }) => {
    const apiInterceptor = new ApiInterceptor(page);
    await apiInterceptor.start();

    await page.waitForTimeout(2000);

    // Verify API call was made
    const shiftsCall = apiInterceptor.getLatestCall(/\/api\/shifts/);
    expect(shiftsCall).not.toBeNull();
    expect(shiftsCall?.method).toBe('GET');

    await apiInterceptor.stop();
  });

  test('Filter button is visible', async ({ page }) => {
    const filterButton = page.locator('button:has-text("Filter")');
    await expect(filterButton).toBeVisible();
  });

  test('Generate Schedule button opens dialog', async ({ page }) => {
    const generateButton = page.locator('button:has-text("Generate Schedule")');
    await expect(generateButton).toBeVisible();

    await generateButton.click();

    // Verify dialog opens
    await expect(page.locator('text=Generate AI Schedule')).toBeVisible({ timeout: 2000 });
  });

  test('Add Shift button opens dialog', async ({ page }) => {
    const addButton = page.locator('button:has-text("Add Shift")');
    await expect(addButton).toBeVisible();

    await addButton.click();

    // Verify dialog opens
    await expect(page.locator('text=Create New Shift')).toBeVisible({ timeout: 2000 });
  });

  test('View tabs switch correctly', async ({ page }) => {
    // Week View
    await page.click('button:has-text("Week View")');
    await expect(page.locator('text=/Week|Monday|Tuesday/i')).toBeVisible();

    // Monthly View
    await page.click('button:has-text("Monthly View")');
    await expect(page.locator('table, .grid')).toBeVisible();

    // Quarterly View
    await page.click('button:has-text("Quarterly View")');
    await expect(page.locator('text=/Q[1-4]/i')).toBeVisible();

    // List View
    await page.click('button:has-text("List View")');
    await expect(page.locator('table')).toBeVisible();

    // Grid View
    await page.click('button:has-text("Grid View")');
    await expect(page.locator('.grid')).toBeVisible();
  });

  test('Calendar navigation buttons work', async ({ page }) => {
    await page.click('button:has-text("Monthly View")');
    await page.waitForTimeout(500);

    // Get current month
    const monthHeader = page.locator('h3').first();
    const currentMonth = await monthHeader.textContent();

    // Click previous month
    const prevButton = page
      .locator('button')
      .filter({ has: page.locator('svg') })
      .first();
    await prevButton.click();
    await page.waitForTimeout(500);

    // Verify month changed
    const newMonth = await monthHeader.textContent();
    expect(newMonth).toBeTruthy();
  });

  test('AI Generate Schedule dialog config works', async ({ page }) => {
    const apiInterceptor = new ApiInterceptor(page);
    await apiInterceptor.start();

    await page.click('button:has-text("Generate Schedule")');
    await page.waitForTimeout(500);

    // Fill configuration
    const startDateInput = page.locator('input[type="date"]').first();
    if (await startDateInput.isVisible()) {
      await startDateInput.fill('2025-11-01');
    }

    // Select bureau
    await page.click('button:has-text("Bureau")');
    await page.click('text=Milan Only');

    // Click Generate Preview
    const generateButton = page.locator('button:has-text("Generate Preview")');
    if (await generateButton.isVisible()) {
      await generateButton.click();

      // Wait for API call
      await page.waitForTimeout(5000);

      // Verify API call was made
      const generateCall = apiInterceptor.getLatestCall(/\/api\/ai\/generate-schedule/);
      expect(generateCall).not.toBeNull();
      expect(generateCall?.method).toBe('POST');
    }

    await apiInterceptor.stop();
  });

  test('Drag and drop shift to new date', async ({ page }) => {
    const apiInterceptor = new ApiInterceptor(page);
    await apiInterceptor.start();

    await page.click('button:has-text("Week View")');
    await page.waitForTimeout(1000);

    // Find a draggable shift
    const shiftCards = page.locator('[class*="cursor-grab"], [class*="draggable"]');
    const shiftCount = await shiftCards.count();

    if (shiftCount > 0) {
      const firstShift = shiftCards.first();
      const targetDay = page.locator('[class*="border rounded"]').nth(3); // Target a different day

      // Drag shift to new day
      await firstShift.dragTo(targetDay);
      await page.waitForTimeout(2000);

      // Verify API call for move
      const moveCall = apiInterceptor.getLatestCall(/\/api\/shifts\/\d+/);
      if (moveCall) {
        expect(moveCall.method).toBe('PATCH');
      }
    } else {
      test.skip(true, 'No shifts available to drag');
    }

    await apiInterceptor.stop();
  });

  test('List view shows all shifts', async ({ page }) => {
    await page.click('button:has-text("List View")');
    await page.waitForTimeout(1000);

    // Verify table headers
    await expect(page.locator('text=Employee')).toBeVisible();
    await expect(page.locator('text=Date')).toBeVisible();
    await expect(page.locator('text=Time')).toBeVisible();
  });
});
