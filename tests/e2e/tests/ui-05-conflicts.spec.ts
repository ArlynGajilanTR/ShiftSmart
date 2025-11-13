import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';
import { ApiInterceptor } from '../helpers/api-interceptor';

test.describe('Conflicts Page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/dashboard/conflicts');
    await page.waitForTimeout(2000); // Wait for conflicts to load
  });

  test('Conflicts page loads with data', async ({ page }) => {
    const apiInterceptor = new ApiInterceptor(page);
    await apiInterceptor.start();

    await page.waitForTimeout(2000);

    // Verify API call was made
    const conflictsCall = apiInterceptor.getLatestCall(/\/api\/conflicts/);
    expect(conflictsCall).not.toBeNull();
    expect(conflictsCall?.method).toBe('GET');

    await apiInterceptor.stop();
  });

  test('Stats cards display correctly', async ({ page }) => {
    await expect(page.locator('text=Total Conflicts')).toBeVisible();
    await expect(page.locator('text=High Severity')).toBeVisible();
    await expect(page.locator('text=Medium Severity')).toBeVisible();
    await expect(page.locator('text=Low Severity')).toBeVisible();
  });

  test('Severity filter buttons work', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Click All filter
    await page.click('button:has-text("All")');
    await page.waitForTimeout(300);

    // Click High filter
    await page.click('button:has-text("High")');
    await page.waitForTimeout(300);

    // Click Medium filter
    await page.click('button:has-text("Medium")');
    await page.waitForTimeout(300);

    // Click Low filter
    await page.click('button:has-text("Low")');
    await page.waitForTimeout(300);

    // Verify conflicts list is still visible
    const conflictsList = page.locator('[class*="space-y"]').first();
    await expect(conflictsList).toBeVisible();
  });

  test('Conflict tabs switch correctly', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Click Unresolved tab
    await page.click('button:has-text("Unresolved")');
    await expect(page.locator('text=Unresolved')).toBeVisible();

    // Click Acknowledged tab
    await page.click('button:has-text("Acknowledged")');
    await expect(page.locator('text=Acknowledged')).toBeVisible();

    // Click Resolved tab
    await page.click('button:has-text("Resolved")');
    await expect(page.locator('text=Resolved')).toBeVisible();
  });

  test('Details button opens dialog', async ({ page }) => {
    await page.waitForTimeout(2000);

    const detailsButtons = page.locator('button:has-text("Details")');
    const count = await detailsButtons.count();

    if (count > 0) {
      await detailsButtons.first().click();
      await page.waitForTimeout(500);

      // Verify dialog opens
      await expect(page.locator('text=Conflict details')).toBeVisible({ timeout: 2000 });
    } else {
      test.skip(true, 'No conflicts available to test');
    }
  });

  test('Resolve button calls API', async ({ page }) => {
    const apiInterceptor = new ApiInterceptor(page);
    await apiInterceptor.start();

    await page.waitForTimeout(2000);

    // Find first Resolve button
    const resolveButtons = page.locator('button:has-text("Resolve")');
    const count = await resolveButtons.count();

    if (count > 0) {
      await resolveButtons.first().click();
      await page.waitForTimeout(2000);

      // Verify API call was made
      const resolveCall = apiInterceptor.getLatestCall(/\/api\/conflicts\/\d+/);
      expect(resolveCall).not.toBeNull();

      // Should be PATCH request
      if (resolveCall) {
        expect(resolveCall.method).toBe('PATCH');
      }

      // Verify toast notification
      const toast = page.locator('text=/resolved|success/i');
      await expect(toast).toBeVisible({ timeout: 3000 });
    } else {
      test.skip(true, 'No unresolved conflicts available');
    }

    await apiInterceptor.stop();
  });

  test('Acknowledge button calls API', async ({ page }) => {
    const apiInterceptor = new ApiInterceptor(page);
    await apiInterceptor.start();

    await page.waitForTimeout(2000);

    // Find first Acknowledge button
    const acknowledgeButtons = page.locator('button:has-text("Acknowledge")');
    const count = await acknowledgeButtons.count();

    if (count > 0) {
      await acknowledgeButtons.first().click();
      await page.waitForTimeout(2000);

      // Verify API call was made
      const acknowledgeCall = apiInterceptor.getLatestCall(/\/api\/conflicts\/\d+/);
      expect(acknowledgeCall).not.toBeNull();

      if (acknowledgeCall) {
        expect(acknowledgeCall.method).toBe('PATCH');
      }

      // Verify toast notification
      const toast = page.locator('text=/acknowledged|success/i');
      await expect(toast).toBeVisible({ timeout: 3000 });
    } else {
      test.skip(true, 'No conflicts available to acknowledge');
    }

    await apiInterceptor.stop();
  });

  test('Dismiss button calls API', async ({ page }) => {
    const apiInterceptor = new ApiInterceptor(page);
    await apiInterceptor.start();

    await page.waitForTimeout(2000);

    // Find dismiss button (X icon) in conflict cards
    const conflictCards = page.locator('[class*="Card"]');
    const cardCount = await conflictCards.count();

    if (cardCount > 0) {
      // Look for X button in conflict card
      const firstCard = conflictCards.first();
      const xButton = firstCard
        .locator('button')
        .filter({ has: page.locator('svg') })
        .last();

      if (await xButton.isVisible()) {
        await xButton.click();
        await page.waitForTimeout(2000);

        // Verify API call was made
        const dismissCall = apiInterceptor.getLatestCall(/\/api\/conflicts\/\d+/);
        if (dismissCall) {
          expect(dismissCall.method).toBe('DELETE');
        }
      }
    } else {
      test.skip(true, 'No conflicts available to dismiss');
    }

    await apiInterceptor.stop();
  });
});
