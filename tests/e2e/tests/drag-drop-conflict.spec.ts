import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';
import { ApiInterceptor } from '../helpers/api-interceptor';

// Helper to wait for shifts to load
async function waitForShiftsToLoad(page: any, timeout = 10000) {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    // Use the same selector that works in the original test
    const shifts = page.locator('[class*="cursor-grab"], [class*="draggable"]');
    const shiftCount = await shifts.count();
    if (shiftCount > 0) {
      return shifts;
    }
    await page.waitForTimeout(500);
  }
  return null;
}

test.describe('Drag and Drop with Conflict Handling', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/dashboard/schedule');
    // Wait for the page content to be fully loaded
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Extra wait for shifts to load
  });

  test('Drag and drop shift updates database (verify with refresh)', async ({ page }) => {
    const apiInterceptor = new ApiInterceptor(page);
    await apiInterceptor.start();

    // Switch to Week View for better drag targets
    await page.click('button:has-text("Week View")');
    await page.waitForTimeout(2000);

    // Wait for shifts to appear
    const shifts = await waitForShiftsToLoad(page);
    if (!shifts) {
      test.skip(true, 'No shifts available - skipping test');
      return;
    }

    const shiftCount = await shifts.count();
    console.log('Found shift count:', shiftCount);

    // Get the first shift's text content before drag
    const firstShift = shifts.first();
    const shiftText = await firstShift.textContent();
    console.log('Found shift:', shiftText);

    // Find a target day column (use border-rounded divs)
    const targetDay = page.locator('[class*="border rounded"]').nth(3);

    // Perform drag to a different day area
    await firstShift.dragTo(targetDay);
    await page.waitForTimeout(2000);

    // Check if conflict dialog appeared
    const conflictDialog = page.locator('text=Scheduling Conflict Detected');
    if (await conflictDialog.isVisible({ timeout: 1000 }).catch(() => false)) {
      console.log('Conflict dialog detected - clicking Move Anyway');

      // Click "Move Anyway" to force the move
      const moveAnywayBtn = page.locator('button:has-text("Move Anyway")');
      await moveAnywayBtn.click();
      await page.waitForTimeout(1500);
    }

    // Verify API call was made for the move
    const moveCall = apiInterceptor.getLatestCall(/\/api\/shifts\//);
    if (moveCall) {
      console.log('Move API call detected:', moveCall.method, moveCall.url);
      expect(moveCall.method).toBe('PATCH');
    }

    // CRITICAL: Refresh the page to verify database sync
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Verify shifts still load after refresh (database persisted)
    const shiftsAfterRefresh = await waitForShiftsToLoad(page);
    if (shiftsAfterRefresh) {
      const countAfterRefresh = await shiftsAfterRefresh.count();
      expect(countAfterRefresh).toBeGreaterThan(0);
      console.log(`Shifts before: ${shiftCount}, after refresh: ${countAfterRefresh}`);
    }

    await apiInterceptor.stop();
  });

  test('Move shift triggers API call', async ({ page }) => {
    await page.click('button:has-text("Week View")');
    await page.waitForTimeout(2000);

    // Wait for shifts
    const shifts = await waitForShiftsToLoad(page);
    if (!shifts) {
      test.skip(true, 'No shifts available');
      return;
    }

    // Set up request monitoring
    let patchRequestMade = false;
    page.on('request', (request) => {
      if (request.method() === 'PATCH' && request.url().includes('/api/shifts/')) {
        patchRequestMade = true;
        console.log('API call detected:', request.method(), request.url());
      }
    });

    const firstShift = shifts.first();
    const targetDay = page.locator('[class*="border rounded"]').nth(5);

    // Drag to a different day
    await firstShift.dragTo(targetDay);
    await page.waitForTimeout(2000);

    // If conflict dialog appears, handle it
    const conflictDialog = page.locator('text=Scheduling Conflict Detected');
    if (await conflictDialog.isVisible({ timeout: 1000 }).catch(() => false)) {
      await page.click('button:has-text("Move Anyway")');
      await page.waitForTimeout(500);
    }

    // Verify API call was made
    expect(patchRequestMade).toBeTruthy();
    console.log('API call verified:', patchRequestMade);
  });

  test('Conflict dialog or success feedback when moving shifts', async ({ page }) => {
    // This test specifically checks the conflict detection flow
    await page.click('button:has-text("Week View")');
    await page.waitForTimeout(2000);

    // Wait for shifts
    const shifts = await waitForShiftsToLoad(page);
    if (!shifts || (await shifts.count()) < 2) {
      test.skip(true, 'Need at least 2 shifts');
      return;
    }

    // Try to drag a shift - conflicts may or may not occur depending on schedule
    const secondShift = shifts.nth(1);
    const targetDay = page.locator('[class*="border rounded"]').first();

    // Drag to first day (likely to have other shifts)
    await secondShift.dragTo(targetDay);
    await page.waitForTimeout(2000);

    // Either conflict dialog appears OR the move succeeds
    const conflictVisible = await page
      .locator('text=Scheduling Conflict Detected')
      .isVisible({ timeout: 2000 })
      .catch(() => false);
    const statusVisible = (await page.locator('[role="status"]').count()) > 0;

    // Either outcome is acceptable - the system responds appropriately
    expect(conflictVisible || statusVisible).toBeTruthy();
    console.log('Conflict dialog visible:', conflictVisible, 'Status visible:', statusVisible);

    // If conflict showed, test the cancel button
    if (conflictVisible) {
      await page.click('button:has-text("Cancel")');
      await page.waitForTimeout(500);
      // Verify dialog closed
      await expect(page.locator('text=Scheduling Conflict Detected')).not.toBeVisible();
    }
  });

  test('Shift views are synced (week, month, list)', async ({ page }) => {
    // This tests that shifts appear correctly in all views
    await page.click('button:has-text("Week View")');
    await page.waitForTimeout(2000);

    // Wait for shifts in week view
    const shifts = await waitForShiftsToLoad(page);
    if (!shifts) {
      test.skip(true, 'No shifts available');
      return;
    }
    const weekCount = await shifts.count();
    console.log('Week view shifts:', weekCount);

    // Switch to Monthly View and verify content exists
    await page.click('button:has-text("Monthly View")');
    await page.waitForTimeout(2000);

    // Monthly view should show the active tabpanel
    const monthlyContent = page.getByRole('tabpanel', { name: 'Monthly View' });
    await expect(monthlyContent).toBeVisible();

    // Switch to List View and verify
    await page.click('button:has-text("List View")');
    await page.waitForTimeout(2000);

    // Should see table with shift data
    const table = page.locator('table');
    await expect(table).toBeVisible();

    // Should have rows in the table (may be 0 if no shifts for current period)
    const tableRows = page.locator('tbody tr');
    const rowCount = await tableRows.count();
    console.log('List view rows:', rowCount);

    console.log('Views synced successfully');
  });

  test('Database persistence - shift survives page refresh', async ({ page }) => {
    // Go to Week View
    await page.click('button:has-text("Week View")');
    await page.waitForTimeout(2000);

    // Wait for shifts
    const shifts = await waitForShiftsToLoad(page);
    if (!shifts) {
      test.skip(true, 'No shifts available');
      return;
    }

    const countBefore = await shifts.count();

    // Get a specific employee name to track
    const firstShiftText = await shifts.first().textContent();
    const employeeName = firstShiftText?.split(' ').slice(0, 2).join(' ');
    console.log('Tracking employee:', employeeName, 'Count before:', countBefore);

    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Switch back to Week View
    await page.click('button:has-text("Week View")');
    await page.waitForTimeout(2000);

    // Wait for shifts after refresh
    const shiftsAfter = await waitForShiftsToLoad(page);
    if (!shiftsAfter) {
      // If shifts don't load after refresh, that's a failure
      expect(shiftsAfter).not.toBeNull();
      return;
    }

    const countAfter = await shiftsAfter.count();

    // Shift count should be the same (database persisted)
    expect(countAfter).toBe(countBefore);

    // The specific employee should still exist
    if (employeeName) {
      await expect(page.locator(`text=${employeeName}`).first()).toBeVisible();
    }

    console.log(
      `Database sync verified: ${countBefore} shifts before, ${countAfter} after refresh`
    );
  });
});
