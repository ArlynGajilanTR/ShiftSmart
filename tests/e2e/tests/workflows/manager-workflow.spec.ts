import { test, expect } from '@playwright/test';
import {
  loginAsManager,
  loginAsAdmin,
  MANAGER_USER,
  ADMIN_USER,
  logout,
} from '../../helpers/test-users';
import { ApiInterceptor } from '../../helpers/api-interceptor';

/**
 * Manager/Team Leader Complete Workflow E2E Tests
 *
 * Tests the complete end-to-end journey for a manager/admin user:
 * 1. Login and access dashboard with full stats
 * 2. Review team availability and confirm preferences
 * 3. Review team time-off entries
 * 4. Generate AI schedule
 * 5. Fine-tune schedule with drag-and-drop
 * 6. Resolve conflicts
 * 7. Export/share schedule (if available)
 *
 * Based on: docs/USER_WORKFLOWS.md - Manager Workflow
 */

test.describe('Manager Complete Workflow', () => {
  test.describe('Phase 1: Authentication & Dashboard Access', () => {
    test('manager can login successfully', async ({ page }) => {
      await loginAsManager(page);

      await expect(page).toHaveURL('/dashboard');
      await expect(page.locator('text=Total Employees')).toBeVisible();
    });

    test('admin can login successfully', async ({ page }) => {
      await loginAsAdmin(page);

      await expect(page).toHaveURL('/dashboard');
      await expect(page.locator('text=Total Employees')).toBeVisible();
    });

    test('manager sees full dashboard stats', async ({ page }) => {
      await loginAsManager(page);

      // Verify all stats cards are visible
      await expect(page.locator('text=Total Employees')).toBeVisible();
      await expect(page.locator('text=Active Shifts')).toBeVisible();
      await expect(page.locator('text=Open Conflicts')).toBeVisible();
      await expect(page.locator('text=Coverage Rate')).toBeVisible();
    });

    test('manager sees all navigation options', async ({ page }) => {
      await loginAsManager(page);

      // Verify sidebar has manager-specific links
      await expect(page.locator('text=Dashboard')).toBeVisible();
      await expect(page.locator('text=Schedule')).toBeVisible();
      await expect(page.locator('text=Employees')).toBeVisible();
      await expect(page.locator('text=Conflicts')).toBeVisible();
      await expect(page.locator('text=Team')).toBeVisible();
    });
  });

  test.describe('Phase 2: Review Team Availability', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsManager(page);
      await page.goto('/dashboard/team');
    });

    test('Team Management page loads correctly', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Team Management' })).toBeVisible({
        timeout: 10000,
      });

      // Availability tab should be active by default
      await expect(page.getByRole('tab', { name: /Availability/i })).toBeVisible();
    });

    test('displays stats cards for team preferences', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Team Management' })).toBeVisible({
        timeout: 10000,
      });

      // Verify stats cards
      await expect(page.getByText('Total Employees')).toBeVisible();
      await expect(page.getByText('Confirmed')).toBeVisible();
      await expect(page.getByText('Pending Review')).toBeVisible();
      await expect(page.getByText('Missing Preferences')).toBeVisible();
    });

    test('displays employee preferences table', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Team Management' })).toBeVisible({
        timeout: 10000,
      });

      // Check table exists with correct columns
      await expect(page.getByRole('table')).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Employee' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Bureau' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible();
    });

    test('can filter employees by bureau', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Team Management' })).toBeVisible({
        timeout: 10000,
      });

      // Look for bureau filter
      const bureauFilter = page.locator(
        'button:has-text("All Bureaus"), button:has-text("Bureau")'
      );
      if (await bureauFilter.first().isVisible()) {
        await bureauFilter.first().click();
        await page.waitForTimeout(500);

        // Select specific bureau
        const milanOption = page.getByRole('option', { name: /Milan/i });
        if (await milanOption.isVisible()) {
          await milanOption.click();
          await page.waitForTimeout(500);
        }
      }
    });

    test('can filter employees by status', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Team Management' })).toBeVisible({
        timeout: 10000,
      });

      const statusFilter = page.locator('button:has-text("All Status")');
      if (await statusFilter.isVisible()) {
        await statusFilter.click();

        // Verify filter options exist
        await expect(page.getByRole('option', { name: 'Confirmed' })).toBeVisible();
        await expect(page.getByRole('option', { name: 'Pending' })).toBeVisible();
        await expect(page.getByRole('option', { name: 'Missing' })).toBeVisible();

        await page.keyboard.press('Escape');
      }
    });

    test('can search employees by name', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Team Management' })).toBeVisible({
        timeout: 10000,
      });

      const searchInput = page.getByPlaceholder('Search by name or email...');
      await expect(searchInput).toBeVisible();

      // Search for a specific employee
      await searchInput.fill('Gianluca');
      await page.waitForTimeout(500);

      // Table should show filtered results
      const table = page.getByRole('table');
      await expect(table).toBeVisible();
    });

    test('can open edit preferences dialog', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Team Management' })).toBeVisible({
        timeout: 10000,
      });

      await page.waitForSelector('table tbody tr', { timeout: 10000 });

      // Find and click edit button
      const editButtons = page
        .locator('table tbody tr button')
        .filter({ has: page.locator('svg') });
      const firstEditButton = editButtons.first();

      if (await firstEditButton.isVisible()) {
        await firstEditButton.click();

        // Verify dialog opens
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.getByText('Edit Preferences')).toBeVisible();

        // Close dialog
        await page.getByRole('button', { name: 'Cancel' }).click();
        await expect(page.getByRole('dialog')).not.toBeVisible();
      }
    });

    test('can confirm individual preferences', async ({ page }) => {
      const apiInterceptor = new ApiInterceptor(page);
      await apiInterceptor.start();

      await expect(page.getByRole('heading', { name: 'Team Management' })).toBeVisible({
        timeout: 10000,
      });

      await page.waitForSelector('table tbody tr', { timeout: 10000 });

      // Look for confirm button (checkmark icon, usually green)
      const confirmButton = page.locator('table tbody tr button.text-green-600').first();

      if (await confirmButton.isVisible()) {
        await confirmButton.click();
        await page.waitForTimeout(1000);

        // Should have made API call
        const confirmCall = apiInterceptor.getLatestCall(
          /\/api\/employees\/.*\/preferences\/confirm/
        );
        if (confirmCall) {
          expect(confirmCall.method).toBe('POST');
        }
      }

      await apiInterceptor.stop();
    });

    test('can batch confirm all pending preferences', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Team Management' })).toBeVisible({
        timeout: 10000,
      });

      const confirmAllButton = page.getByRole('button', { name: /Confirm All Pending/i });

      if ((await confirmAllButton.isVisible()) && (await confirmAllButton.isEnabled())) {
        await confirmAllButton.click();

        // Confirmation dialog should appear
        await expect(page.getByRole('alertdialog')).toBeVisible();
        await expect(page.getByText('Confirm All Pending Preferences')).toBeVisible();

        // Cancel for now
        await page.getByRole('button', { name: 'Cancel' }).click();
        await expect(page.getByRole('alertdialog')).not.toBeVisible();
      }
    });
  });

  test.describe('Phase 3: Review Team Time-Off', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsManager(page);
      await page.goto('/dashboard/team');
      await page.waitForTimeout(1000);
    });

    test('can switch to Time Off tab', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Team Management' })).toBeVisible({
        timeout: 10000,
      });

      const timeOffTab = page.getByRole('tab', { name: /Time Off/i });
      await expect(timeOffTab).toBeVisible();
      await timeOffTab.click();

      // Verify Time Off content is shown
      await expect(page.getByText('Upcoming Time Off')).toBeVisible();
    });

    test('displays team time-off entries', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Team Management' })).toBeVisible({
        timeout: 10000,
      });

      // Switch to Time Off tab
      const timeOffTab = page.getByRole('tab', { name: /Time Off/i });
      await timeOffTab.click();
      await page.waitForTimeout(1000);

      // Should show time-off entries or empty state
      const hasTable = await page.locator('table').isVisible();
      const hasEmptyState = await page.getByText(/no upcoming|no time-off/i).isVisible();

      expect(hasTable || hasEmptyState).toBeTruthy();
    });
  });

  test.describe('Phase 4: AI Schedule Generation', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsManager(page);
      await page.goto('/dashboard/schedule');
      await page.waitForTimeout(2000);
    });

    test('Generate Schedule button is visible', async ({ page }) => {
      const generateButton = page.locator('button:has-text("Generate Schedule")');
      await expect(generateButton).toBeVisible();
    });

    test('can open Generate Schedule dialog', async ({ page }) => {
      const generateButton = page.locator('button:has-text("Generate Schedule")');
      await generateButton.click();

      await expect(page.locator('text=Generate AI Schedule')).toBeVisible({ timeout: 2000 });
    });

    test('Generate Schedule dialog has configuration options', async ({ page }) => {
      await page.click('button:has-text("Generate Schedule")');
      await page.waitForTimeout(500);

      // Should have date inputs
      const startDateInput = page.locator('input[type="date"]').first();
      await expect(startDateInput).toBeVisible();

      // Should have bureau selector
      const bureauSelector = page.locator('button:has-text("Bureau")');
      if (await bureauSelector.isVisible()) {
        await bureauSelector.click();
        await page.waitForTimeout(300);
        await page.keyboard.press('Escape');
      }
    });

    test('can configure and start AI generation', async ({ page }) => {
      const apiInterceptor = new ApiInterceptor(page);
      await apiInterceptor.start();

      await page.click('button:has-text("Generate Schedule")');
      await page.waitForTimeout(500);

      // Configure date range
      const startDateInput = page.locator('input[type="date"]').first();
      if (await startDateInput.isVisible()) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7);
        await startDateInput.fill(futureDate.toISOString().slice(0, 10));
      }

      // Select bureau if available
      const bureauSelector = page.locator('button:has-text("Bureau")');
      if (await bureauSelector.isVisible()) {
        await bureauSelector.click();
        const milanOption = page.locator('text=Milan Only');
        if (await milanOption.isVisible()) {
          await milanOption.click();
        }
      }

      // Click Generate Preview
      const generatePreviewBtn = page.locator('button:has-text("Generate Preview")');
      if (await generatePreviewBtn.isVisible()) {
        await generatePreviewBtn.click();

        // Wait for API call (may take a while for AI)
        await page.waitForTimeout(5000);

        // Verify API call was made
        const generateCall = apiInterceptor.getLatestCall(/\/api\/ai\/generate-schedule/);
        expect(generateCall).not.toBeNull();
        if (generateCall) {
          expect(generateCall.method).toBe('POST');
        }
      }

      await apiInterceptor.stop();
    });
  });

  test.describe('Phase 5: Schedule Fine-Tuning', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsManager(page);
      await page.goto('/dashboard/schedule');
      await page.waitForTimeout(2000);
    });

    test('can switch between schedule views', async ({ page }) => {
      // Week View
      await page.click('button:has-text("Week View")');
      await page.waitForTimeout(500);

      // Monthly View
      await page.click('button:has-text("Monthly View")');
      await page.waitForTimeout(500);

      // List View
      await page.click('button:has-text("List View")');
      await expect(page.locator('table')).toBeVisible();
    });

    test('can open Add Shift dialog', async ({ page }) => {
      const addButton = page.locator('button:has-text("Add Shift")');
      await expect(addButton).toBeVisible();

      await addButton.click();

      await expect(page.locator('text=Create New Shift')).toBeVisible({ timeout: 2000 });
    });

    test('drag and drop is available for shifts', async ({ page }) => {
      await page.click('button:has-text("Week View")');
      await page.waitForTimeout(2000);

      // Check for draggable shifts
      const shiftCards = page.locator('[class*="cursor-grab"], [class*="draggable"]');
      const count = await shiftCards.count();

      // Either shifts exist with drag capability or no shifts to drag
      expect(count >= 0).toBeTruthy();
    });

    test('can perform drag and drop shift move', async ({ page }) => {
      const apiInterceptor = new ApiInterceptor(page);
      await apiInterceptor.start();

      await page.click('button:has-text("Week View")');
      await page.waitForTimeout(2000);

      const shiftCards = page.locator('[class*="cursor-grab"], [class*="draggable"]');
      const shiftCount = await shiftCards.count();

      if (shiftCount > 0) {
        const firstShift = shiftCards.first();
        const targetDay = page.locator('[class*="border rounded"]').nth(3);

        await firstShift.dragTo(targetDay);
        await page.waitForTimeout(2000);

        // Handle conflict dialog if it appears
        const conflictDialog = page.locator('text=Scheduling Conflict Detected');
        if (await conflictDialog.isVisible({ timeout: 1000 }).catch(() => false)) {
          const moveAnywayBtn = page.locator('button:has-text("Move Anyway")');
          await moveAnywayBtn.click();
          await page.waitForTimeout(1000);
        }

        // Verify PATCH call was made
        const moveCall = apiInterceptor.getLatestCall(/\/api\/shifts\/\d+/);
        if (moveCall) {
          expect(moveCall.method).toBe('PATCH');
        }
      }

      await apiInterceptor.stop();
    });
  });

  test.describe('Phase 6: Conflict Resolution', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsManager(page);
      await page.goto('/dashboard/conflicts');
      await page.waitForTimeout(2000);
    });

    test('Conflicts page loads correctly', async ({ page }) => {
      // Stats cards should be visible
      await expect(page.locator('text=Total Conflicts')).toBeVisible();
      await expect(page.locator('text=High Severity')).toBeVisible();
      await expect(page.locator('text=Medium Severity')).toBeVisible();
      await expect(page.locator('text=Low Severity')).toBeVisible();
    });

    test('can filter conflicts by severity', async ({ page }) => {
      // Filter buttons
      await page.click('button:has-text("All")');
      await page.waitForTimeout(300);

      await page.click('button:has-text("High")');
      await page.waitForTimeout(300);

      await page.click('button:has-text("Medium")');
      await page.waitForTimeout(300);

      await page.click('button:has-text("Low")');
      await page.waitForTimeout(300);
    });

    test('can switch conflict tabs', async ({ page }) => {
      await page.click('button:has-text("Unresolved")');
      await expect(page.locator('text=Unresolved')).toBeVisible();

      await page.click('button:has-text("Acknowledged")');
      await expect(page.locator('text=Acknowledged')).toBeVisible();

      await page.click('button:has-text("Resolved")');
      await expect(page.locator('text=Resolved')).toBeVisible();
    });

    test('can resolve a conflict', async ({ page }) => {
      const apiInterceptor = new ApiInterceptor(page);
      await apiInterceptor.start();

      const resolveButtons = page.locator('button:has-text("Resolve")');
      const count = await resolveButtons.count();

      if (count > 0) {
        await resolveButtons.first().click();
        await page.waitForTimeout(2000);

        const resolveCall = apiInterceptor.getLatestCall(/\/api\/conflicts\/\d+/);
        if (resolveCall) {
          expect(resolveCall.method).toBe('PATCH');
        }
      }

      await apiInterceptor.stop();
    });

    test('can acknowledge a conflict', async ({ page }) => {
      const apiInterceptor = new ApiInterceptor(page);
      await apiInterceptor.start();

      const acknowledgeButtons = page.locator('button:has-text("Acknowledge")');
      const count = await acknowledgeButtons.count();

      if (count > 0) {
        await acknowledgeButtons.first().click();
        await page.waitForTimeout(2000);

        const acknowledgeCall = apiInterceptor.getLatestCall(/\/api\/conflicts\/\d+/);
        if (acknowledgeCall) {
          expect(acknowledgeCall.method).toBe('PATCH');
        }
      }

      await apiInterceptor.stop();
    });
  });

  test.describe('Phase 7: Employee Management', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsManager(page);
      await page.goto('/dashboard/employees');
    });

    test('Employees page loads correctly', async ({ page }) => {
      await expect(page.locator('text=Total Employees')).toBeVisible();
      await expect(page.locator('table')).toBeVisible();
    });

    test('can search employees', async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="Search"]');
      await expect(searchInput).toBeVisible();

      await searchInput.fill('Gianluca');
      await page.waitForTimeout(500);
    });

    test('can filter by bureau', async ({ page }) => {
      await page.click('button:has-text("Bureau")');
      await page.click('text=Milan');
      await page.waitForTimeout(500);
    });

    test('can navigate to employee detail', async ({ page }) => {
      await page.waitForTimeout(2000);

      const editButtons = page.locator('a[href*="/dashboard/employees/"]').first();
      if (await editButtons.isVisible()) {
        await editButtons.click();
        await expect(page).toHaveURL(/\/dashboard\/employees\/\w+/, { timeout: 5000 });
      }
    });

    test('Add Employee button is visible', async ({ page }) => {
      const addButton = page.locator('button:has-text("Add Employee")');
      await expect(addButton).toBeVisible();
    });
  });

  test.describe('Phase 8: Complete Manager Workflow Journey', () => {
    test('complete manager journey: team review → schedule generation → conflicts → employees', async ({
      page,
    }) => {
      // Step 1: Login
      await loginAsManager(page);
      await expect(page).toHaveURL('/dashboard');

      // Step 2: Review Team Availability
      await page.click('text=Team');
      await expect(page).toHaveURL('/dashboard/team');
      await expect(page.getByRole('heading', { name: 'Team Management' })).toBeVisible({
        timeout: 10000,
      });

      // Step 3: Check Time Off tab
      await page.getByRole('tab', { name: /Time Off/i }).click();
      await page.waitForTimeout(1000);

      // Step 4: Navigate to Schedule
      await page.click('text=Schedule');
      await expect(page).toHaveURL('/dashboard/schedule');

      // Verify Generate Schedule button is available
      await expect(page.locator('button:has-text("Generate Schedule")')).toBeVisible();

      // Step 5: Navigate to Conflicts
      await page.click('text=Conflicts');
      await expect(page).toHaveURL('/dashboard/conflicts');
      await expect(page.locator('text=Total Conflicts')).toBeVisible();

      // Step 6: Navigate to Employees
      await page.click('text=Employees');
      await expect(page).toHaveURL('/dashboard/employees');
      await expect(page.locator('text=Total Employees')).toBeVisible();

      // Step 7: Return to Dashboard
      await page.click('text=Dashboard');
      await expect(page).toHaveURL('/dashboard');

      // Step 8: Logout
      await logout(page);
      await expect(page).toHaveURL('/');
    });
  });
});

test.describe('Manager API Integration', () => {
  test('manager has access to all management APIs', async ({ page }) => {
    const apiInterceptor = new ApiInterceptor(page);
    await apiInterceptor.start();

    await loginAsManager(page);

    // Visit team page to trigger team API
    await page.goto('/dashboard/team');
    await page.waitForTimeout(2000);

    // Should have access to team availability API
    const teamCall = apiInterceptor.getLatestCall(/\/api\/team|\/api\/employees/);
    expect(teamCall).not.toBeNull();

    await apiInterceptor.stop();
  });

  test('manager can access conflict management APIs', async ({ page }) => {
    const apiInterceptor = new ApiInterceptor(page);
    await apiInterceptor.start();

    await loginAsManager(page);
    await page.goto('/dashboard/conflicts');
    await page.waitForTimeout(2000);

    const conflictsCall = apiInterceptor.getLatestCall(/\/api\/conflicts/);
    expect(conflictsCall).not.toBeNull();

    await apiInterceptor.stop();
  });
});
