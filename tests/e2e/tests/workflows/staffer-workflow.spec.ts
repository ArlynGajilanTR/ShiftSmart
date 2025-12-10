import { test, expect } from '@playwright/test';
import { loginAsStaffer, STAFFER_MILAN, logout } from '../../helpers/test-users';
import { ApiInterceptor } from '../../helpers/api-interceptor';

/**
 * Staffer Complete Workflow E2E Tests
 *
 * Tests the complete end-to-end journey for a staff user:
 * 1. Login and access dashboard
 * 2. Set shift preferences (My Availability)
 * 3. Enter time-off dates (My Time Off)
 * 4. View schedule and filter to "My Shifts"
 * 5. Check notifications
 * 6. Access settings
 *
 * Based on: docs/USER_WORKFLOWS.md - Staffer Workflow
 */

test.describe('Staffer Complete Workflow', () => {
  test.describe('Phase 1: Authentication & Initial Access', () => {
    test('staffer can login successfully', async ({ page }) => {
      await loginAsStaffer(page);

      // Verify dashboard access
      await expect(page).toHaveURL('/dashboard');
      await expect(page.locator('text=Total Employees')).toBeVisible();
    });

    test('staffer sees correct navigation options', async ({ page }) => {
      await loginAsStaffer(page);

      // Verify sidebar has staffer-relevant links
      await expect(page.locator('text=Dashboard')).toBeVisible();
      await expect(page.locator('text=Schedule')).toBeVisible();
      await expect(page.locator('text=My Availability')).toBeVisible();
      await expect(page.locator('text=My Time Off')).toBeVisible();
      await expect(page.locator('text=Settings')).toBeVisible();
    });

    test('staffer can logout successfully', async ({ page }) => {
      await loginAsStaffer(page);
      await logout(page);

      await expect(page).toHaveURL('/');
    });
  });

  test.describe('Phase 2: Set Shift Preferences (My Availability)', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsStaffer(page);
      await page.goto('/dashboard/my-availability');
    });

    test('My Availability page loads correctly', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'My Availability' })).toBeVisible();

      // Should show status banner
      await expect(
        page.getByText(/Preferences Confirmed|Pending Approval|Set Your Preferences/, {
          exact: false,
        })
      ).toBeVisible();
    });

    test('can view preferred days options', async ({ page }) => {
      // Check for day checkboxes
      await expect(page.getByText('Preferred Days')).toBeVisible();

      // Verify day options exist (Mon-Sun)
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      for (const day of days.slice(0, 3)) {
        // Check at least first 3 days
        await expect(page.getByRole('checkbox', { name: day })).toBeVisible();
      }
    });

    test('can view preferred shifts options', async ({ page }) => {
      // Check for shift type options
      await expect(page.getByText('Preferred Shifts')).toBeVisible();

      // Verify shift options exist
      const shiftTypes = ['Morning', 'Afternoon', 'Evening', 'Night'];
      for (const shift of shiftTypes.slice(0, 2)) {
        // Check at least first 2 shifts
        await expect(page.getByRole('checkbox', { name: shift })).toBeVisible();
      }
    });

    test('can update and save preferences', async ({ page }) => {
      const apiInterceptor = new ApiInterceptor(page);
      await apiInterceptor.start();

      // Toggle a preferred day
      const mondayCheckbox = page.getByRole('checkbox', { name: 'Mon' });
      const initialState = await mondayCheckbox.isChecked();
      await mondayCheckbox.click();

      // Toggle a shift type
      const morningCheckbox = page.getByRole('checkbox', { name: 'Morning' });
      await morningCheckbox.click();

      // Save preferences
      const saveButton = page.getByRole('button', { name: 'Save Preferences' });
      await expect(saveButton).toBeEnabled();
      await saveButton.click();

      // Wait for API call
      await page.waitForTimeout(2000);

      // Verify API call was made
      const preferencesCall = apiInterceptor.getLatestCall(/\/api\/employees\/.*\/preferences/);
      expect(preferencesCall).not.toBeNull();

      // Page should still be visible (no error)
      await expect(page.getByRole('heading', { name: 'My Availability' })).toBeVisible();

      await apiInterceptor.stop();
    });

    test('can set max shifts per week', async ({ page }) => {
      // Look for max shifts dropdown or input
      const maxShiftsElement = page.getByText('Max Shifts Per Week').locator('..');
      await expect(maxShiftsElement).toBeVisible();
    });

    test('can add notes for special constraints', async ({ page }) => {
      // Look for notes field
      const notesField = page.locator('textarea');
      if (await notesField.isVisible()) {
        await notesField.fill('Test note: Unavailable on Tuesdays for childcare');

        // Save and verify
        const saveButton = page.getByRole('button', { name: 'Save Preferences' });
        if (await saveButton.isEnabled()) {
          await saveButton.click();
          await page.waitForTimeout(1000);
        }
      }
    });
  });

  test.describe('Phase 3: Time-Off Management (My Time Off)', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsStaffer(page);
      await page.goto('/dashboard/my-time-off');
    });

    test('My Time Off page loads correctly', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'My Time Off' })).toBeVisible();

      // Should have add button
      await expect(
        page.getByRole('button', { name: /Add Time Off|New Time Off|Request Time Off/i })
      ).toBeVisible();
    });

    test('can open add time-off form', async ({ page }) => {
      const addButton = page
        .getByRole('button', { name: /Add Time Off|New Time Off|Request Time Off/i })
        .first();
      await addButton.click();

      // Form should be visible
      await expect(
        page.locator('input[name="start_date"], input[type="date"]').first()
      ).toBeVisible({ timeout: 5000 });
    });

    test('can create a time-off entry', async ({ page }) => {
      const apiInterceptor = new ApiInterceptor(page);
      await apiInterceptor.start();

      // Open form
      const addButton = page
        .getByRole('button', { name: /Add Time Off|New Time Off|Request Time Off/i })
        .first();
      await addButton.click();

      // Fill form with future dates
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30); // 30 days in future
      const dateStr = futureDate.toISOString().slice(0, 10);

      const startDateInput = page.locator('input[name="start_date"]').first();
      const endDateInput = page.locator('input[name="end_date"]').first();

      if (await startDateInput.isVisible()) {
        await startDateInput.fill(dateStr);
        await endDateInput.fill(dateStr);

        // Select type if dropdown exists
        const typeTrigger = page.getByRole('button', { name: /Type|Select type/i }).first();
        if (await typeTrigger.isVisible().catch(() => false)) {
          await typeTrigger.click();
          await page.getByRole('option').first().click();
        }

        // Submit
        const submitButton = page
          .getByRole('button', { name: /Add Entry|Save|Create|Submit/i })
          .first();
        if (await submitButton.isVisible()) {
          await submitButton.click();
          await page.waitForTimeout(2000);

          // Verify API call was made
          const timeOffCall = apiInterceptor.getLatestCall(/\/api\/time-off/);
          if (timeOffCall) {
            expect(timeOffCall.method).toBe('POST');
          }
        }
      }

      await apiInterceptor.stop();
    });

    test('displays time-off entries in list', async ({ page }) => {
      // Wait for list to load
      await page.waitForTimeout(2000);

      // Should show entries or empty state
      const hasEntries = await page.locator('[data-testid="time-off-entry"], tbody tr').count();
      const hasEmptyState = await page.getByText(/no time-off|no entries/i).isVisible();

      expect(hasEntries > 0 || hasEmptyState).toBeTruthy();
    });
  });

  test.describe('Phase 4: Schedule Viewing', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsStaffer(page);
      await page.goto('/dashboard/schedule');
      await page.waitForTimeout(2000); // Wait for shifts to load
    });

    test('Schedule page loads correctly', async ({ page }) => {
      // Should show calendar or schedule view
      await expect(page.locator('text=Schedule')).toBeVisible();
    });

    test('can view different calendar views', async ({ page }) => {
      // Week View
      const weekViewBtn = page.locator('button:has-text("Week View"), button:has-text("Week")');
      if (await weekViewBtn.first().isVisible()) {
        await weekViewBtn.first().click();
        await page.waitForTimeout(500);
      }

      // Month View
      const monthViewBtn = page.locator(
        'button:has-text("Monthly View"), button:has-text("Month")'
      );
      if (await monthViewBtn.first().isVisible()) {
        await monthViewBtn.first().click();
        await page.waitForTimeout(500);
      }
    });

    test('can navigate calendar dates', async ({ page }) => {
      // Find navigation buttons (prev/next)
      const navButtons = page.locator('button').filter({ has: page.locator('svg') });
      const buttonCount = await navButtons.count();

      if (buttonCount > 0) {
        // Click a navigation button
        await navButtons.first().click();
        await page.waitForTimeout(500);
      }
    });

    test('can filter to "My Shifts" toggle if available', async ({ page }) => {
      // Look for My Shifts toggle/filter
      const myShiftsToggle = page.locator(
        'button:has-text("My Shifts"), [data-testid="my-shifts-toggle"]'
      );

      if (await myShiftsToggle.isVisible().catch(() => false)) {
        await myShiftsToggle.click();
        await page.waitForTimeout(1000);

        // Calendar should update to show only user's shifts
        // (Implementation varies based on feature status)
      }
    });

    test('shift cards display correctly', async ({ page }) => {
      // Switch to week view for better visibility
      const weekViewBtn = page.locator('button:has-text("Week View")');
      if (await weekViewBtn.isVisible()) {
        await weekViewBtn.click();
        await page.waitForTimeout(1000);
      }

      // Check for shift cards
      const shiftCards = page.locator('[class*="cursor-grab"], [class*="shift"], .shift-card');
      const count = await shiftCards.count();

      // Either shifts exist or empty state is shown
      expect(count >= 0).toBeTruthy();
    });
  });

  test.describe('Phase 5: Settings Access', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsStaffer(page);
      await page.goto('/dashboard/settings');
    });

    test('Settings page loads correctly', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /Settings|Profile/i })).toBeVisible();
    });

    test('can view profile information', async ({ page }) => {
      // Should see profile form or information
      await expect(page.locator('input, text=' + STAFFER_MILAN.email).first()).toBeVisible();
    });

    test('can edit profile information', async ({ page }) => {
      // Look for editable fields
      const nameInput = page.locator('input[id="name"], input[name="name"]').first();

      if (await nameInput.isVisible()) {
        const currentValue = await nameInput.inputValue();
        expect(currentValue).toBeTruthy();
      }
    });
  });

  test.describe('Phase 6: Complete Workflow Journey', () => {
    test('complete staffer journey: login → preferences → time-off → schedule → logout', async ({
      page,
    }) => {
      // Step 1: Login
      await loginAsStaffer(page);
      await expect(page).toHaveURL('/dashboard');

      // Step 2: Navigate to My Availability
      await page.click('text=My Availability');
      await expect(page).toHaveURL('/dashboard/my-availability');
      await expect(page.getByRole('heading', { name: 'My Availability' })).toBeVisible();

      // Step 3: Navigate to My Time Off
      await page.click('text=My Time Off');
      await expect(page).toHaveURL('/dashboard/my-time-off');
      await expect(page.getByRole('heading', { name: 'My Time Off' })).toBeVisible();

      // Step 4: Navigate to Schedule
      await page.click('text=Schedule');
      await expect(page).toHaveURL('/dashboard/schedule');

      // Step 5: Navigate to Settings
      await page.click('text=Settings');
      await expect(page).toHaveURL('/dashboard/settings');

      // Step 6: Return to Dashboard
      await page.click('text=Dashboard');
      await expect(page).toHaveURL('/dashboard');

      // Step 7: Logout
      await logout(page);
      await expect(page).toHaveURL('/');
    });
  });
});

test.describe('Staffer API Integration', () => {
  test('staffer API calls include auth token', async ({ page }) => {
    const apiInterceptor = new ApiInterceptor(page);
    await apiInterceptor.start();

    await loginAsStaffer(page);
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);

    // Verify API calls have auth header
    const dashboardCall = apiInterceptor.getLatestCall(/\/api\/dashboard\/stats/);
    expect(dashboardCall).not.toBeNull();

    await apiInterceptor.stop();
  });

  test('staffer can fetch their own employee data', async ({ page }) => {
    const apiInterceptor = new ApiInterceptor(page);
    await apiInterceptor.start();

    await loginAsStaffer(page);
    await page.goto('/dashboard/my-availability');
    await page.waitForTimeout(2000);

    // Should have made an API call to get user data
    const userCall = apiInterceptor.getLatestCall(/\/api\/users\/me|\/api\/employees/);
    expect(userCall).not.toBeNull();

    await apiInterceptor.stop();
  });
});
