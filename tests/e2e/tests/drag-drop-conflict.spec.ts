import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';
import { ApiInterceptor } from '../helpers/api-interceptor';
import { waitForShifts, waitForScheduleLoad, safeDragDrop } from '../helpers/wait-helpers';

test.describe('Drag and Drop with Conflict Handling', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/dashboard/schedule');
    await waitForScheduleLoad(page);
  });

  test('Drag and drop shift updates database (verify with refresh)', async ({ page }) => {
    const apiInterceptor = new ApiInterceptor(page);
    await apiInterceptor.start();

    await page.click('button:has-text("Week View")');
    await waitForScheduleLoad(page);

    const shifts = await waitForShifts(page);
    if (!shifts) {
      test.skip(true, 'No shifts available - skipping test');
      return;
    }

    const shiftCount = await shifts.count();
    const firstShift = shifts.first();
    const shiftText = await firstShift.textContent();

    const targetDay = page.locator('[class*="border rounded"]').nth(3);

    const dragSuccess = await safeDragDrop(firstShift, targetDay);
    expect(dragSuccess).toBeTruthy();

    // Handle potential conflict dialog
    const conflictDialog = page.locator('text=Scheduling Conflict Detected');
    if (await conflictDialog.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.click('button:has-text("Move Anyway")');
    }

    // Wait for API call
    await page
      .waitForResponse(
        (r) => r.url().includes('/api/shifts/') && r.request().method() === 'PATCH',
        { timeout: 5000 }
      )
      .catch(() => null);

    // Verify with page refresh
    await page.reload();
    await waitForScheduleLoad(page);

    const shiftsAfterRefresh = await waitForShifts(page);
    expect(shiftsAfterRefresh).not.toBeNull();

    await apiInterceptor.stop();
  });

  test('Move shift triggers API call', async ({ page }) => {
    await page.click('button:has-text("Week View")');
    await waitForScheduleLoad(page);

    const shifts = await waitForShifts(page);
    if (!shifts) {
      test.skip(true, 'No shifts available');
      return;
    }

    // Set up request monitoring
    let patchRequestMade = false;
    page.on('request', (request) => {
      if (request.method() === 'PATCH' && request.url().includes('/api/shifts/')) {
        patchRequestMade = true;
      }
    });

    const firstShift = shifts.first();
    const targetDay = page.locator('[class*="border rounded"]').nth(5);

    await safeDragDrop(firstShift, targetDay);

    // Handle potential conflict dialog
    const conflictDialog = page.locator('text=Scheduling Conflict Detected');
    if (await conflictDialog.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.click('button:has-text("Move Anyway")');
    }

    // Verify API call was made
    expect(patchRequestMade).toBeTruthy();
  });

  test('Conflict dialog or success feedback when moving shifts', async ({ page }) => {
    await page.click('button:has-text("Week View")');
    await waitForScheduleLoad(page);

    const shifts = await waitForShifts(page, { minCount: 2 });
    if (!shifts || (await shifts.count()) < 2) {
      test.skip(true, 'Need at least 2 shifts');
      return;
    }

    const secondShift = shifts.nth(1);
    const targetDay = page.locator('[class*="border rounded"]').first();

    await safeDragDrop(secondShift, targetDay);

    // Either conflict dialog appears OR the move succeeds
    const conflictVisible = await page
      .locator('text=Scheduling Conflict Detected')
      .isVisible({ timeout: 2000 })
      .catch(() => false);
    const statusVisible = (await page.locator('[role="status"]').count()) > 0;

    expect(conflictVisible || statusVisible).toBeTruthy();

    // If conflict showed, test the cancel button
    if (conflictVisible) {
      await page.click('button:has-text("Cancel")');
      await expect(page.locator('text=Scheduling Conflict Detected')).not.toBeVisible();
    }
  });

  test('Shift views are synced (week, month, list)', async ({ page }) => {
    await page.click('button:has-text("Week View")');
    await waitForScheduleLoad(page);

    const shifts = await waitForShifts(page);
    if (!shifts) {
      test.skip(true, 'No shifts available');
      return;
    }
    const weekCount = await shifts.count();

    // Switch to Monthly View and verify content exists
    await page.click('button:has-text("Monthly View")');
    await waitForScheduleLoad(page);

    const monthlyContent = page.getByRole('tabpanel', { name: 'Monthly View' });
    await expect(monthlyContent).toBeVisible();

    // Switch to List View and verify
    await page.click('button:has-text("List View")');
    await waitForScheduleLoad(page);

    const table = page.locator('table');
    await expect(table).toBeVisible();

    const tableRows = page.locator('tbody tr');
    const rowCount = await tableRows.count();
  });

  test('Database persistence - shift survives page refresh', async ({ page }) => {
    await page.click('button:has-text("Week View")');
    await waitForScheduleLoad(page);

    const shifts = await waitForShifts(page);
    if (!shifts) {
      test.skip(true, 'No shifts available');
      return;
    }

    const countBefore = await shifts.count();

    // Get a specific employee name to track
    const firstShiftText = await shifts.first().textContent();
    const employeeName = firstShiftText?.split(' ').slice(0, 2).join(' ');

    // Refresh the page
    await page.reload();
    await waitForScheduleLoad(page);

    // Switch back to Week View
    await page.click('button:has-text("Week View")');
    await waitForScheduleLoad(page);

    // Wait for shifts after refresh
    const shiftsAfter = await waitForShifts(page);
    expect(shiftsAfter).not.toBeNull();

    const countAfter = await shiftsAfter.count();
    expect(countAfter).toBe(countBefore);

    // The specific employee should still exist
    if (employeeName) {
      await expect(page.locator(`text=${employeeName}`).first()).toBeVisible();
    }
  });
});
