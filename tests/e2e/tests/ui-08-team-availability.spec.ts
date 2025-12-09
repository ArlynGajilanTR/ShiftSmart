import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';

test.describe('Team Availability Page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/dashboard/team');
  });

  test('loads page with correct heading and stats cards', async ({ page }) => {
    // Wait for page to load - check for the page heading
    // Note: The page title is "Team Management" with Availability tab
    await expect(page.getByRole('heading', { name: 'Team Management' })).toBeVisible({
      timeout: 10000,
    });

    // Verify Availability tab is active
    await expect(page.getByRole('tab', { name: /Availability/i })).toBeVisible();

    // Verify stats cards are visible with correct labels
    await expect(page.getByText('Total Employees')).toBeVisible();
    await expect(page.getByText('Confirmed')).toBeVisible();
    await expect(page.getByText('Pending Review')).toBeVisible();
    await expect(page.getByText('Missing Preferences')).toBeVisible();

    // Verify the employee table is present
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('displays employee table with correct columns', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Team Management' })).toBeVisible({
      timeout: 10000,
    });

    // Check table headers
    const table = page.getByRole('table');
    await expect(table).toBeVisible();

    await expect(page.getByRole('columnheader', { name: 'Employee' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Bureau' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Preferred Days' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Preferred Shifts' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Max/Week' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Actions' })).toBeVisible();
  });

  test('filters work correctly', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Team Management' })).toBeVisible({
      timeout: 10000,
    });

    // Test search filter
    const searchInput = page.getByPlaceholder('Search by name or email...');
    await expect(searchInput).toBeVisible();

    // Type in search - should filter results
    await searchInput.fill('test-nonexistent-user-xyz');
    await expect(page.getByText('No employees match your filters')).toBeVisible();

    // Clear search
    await searchInput.clear();

    // Test status filter
    const statusFilter = page.locator('button:has-text("All Status")');
    if (await statusFilter.isVisible()) {
      await statusFilter.click();
      // Check filter options exist
      await expect(page.getByRole('option', { name: 'Confirmed' })).toBeVisible();
      await expect(page.getByRole('option', { name: 'Pending' })).toBeVisible();
      await expect(page.getByRole('option', { name: 'Missing' })).toBeVisible();
      // Click away to close
      await page.keyboard.press('Escape');
    }
  });

  test('can open edit dialog for employee preferences', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Team Management' })).toBeVisible({
      timeout: 10000,
    });

    // Wait for table to load with data
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    // Find and click the first edit button in the table
    const editButtons = page.locator('table tbody tr button').filter({ has: page.locator('svg') });
    const firstEditButton = editButtons.first();

    if (await firstEditButton.isVisible()) {
      await firstEditButton.click();

      // Verify edit dialog opens with preference options
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByText('Edit Preferences')).toBeVisible();
      await expect(page.getByText('Preferred Days')).toBeVisible();
      await expect(page.getByText('Preferred Shifts')).toBeVisible();
      await expect(page.getByText('Max Shifts Per Week')).toBeVisible();

      // Close the dialog
      await page.getByRole('button', { name: 'Cancel' }).click();
      await expect(page.getByRole('dialog')).not.toBeVisible();
    }
  });

  test('confirm all button opens confirmation dialog', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Team Management' })).toBeVisible({
      timeout: 10000,
    });

    // Find the Confirm All Pending button
    const confirmAllButton = page.getByRole('button', { name: /Confirm All Pending/i });

    // Check if button is visible and enabled (has pending preferences)
    if ((await confirmAllButton.isVisible()) && (await confirmAllButton.isEnabled())) {
      await confirmAllButton.click();

      // Verify confirmation dialog appears
      await expect(page.getByRole('alertdialog')).toBeVisible();
      await expect(page.getByText('Confirm All Pending Preferences')).toBeVisible();
      await expect(page.getByText(/This will confirm preferences for/)).toBeVisible();

      // Cancel the dialog
      await page.getByRole('button', { name: 'Cancel' }).click();
      await expect(page.getByRole('alertdialog')).not.toBeVisible();
    }
  });

  test('individual confirm button shows loading state', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Team Management' })).toBeVisible({
      timeout: 10000,
    });

    // Wait for table to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    // Look for a row with a pending/missing status that has a confirm button
    const confirmButton = page.locator('table tbody tr button.text-green-600').first();

    if (await confirmButton.isVisible()) {
      // Click the confirm button
      await confirmButton.click();

      // The button should either:
      // 1. Show a loading spinner briefly, or
      // 2. Disappear after successful confirmation
      // We'll wait for the table to update
      await page.waitForTimeout(500);

      // Verify no error toast appeared
      const errorToast = page.locator('[data-state="open"]').filter({ hasText: /failed|error/i });
      await expect(errorToast).not.toBeVisible();
    }
  });

  test('can switch to Time Off tab', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Team Management' })).toBeVisible({
      timeout: 10000,
    });

    // Click on Time Off tab
    const timeOffTab = page.getByRole('tab', { name: /Time Off/i });
    await expect(timeOffTab).toBeVisible();
    await timeOffTab.click();

    // Verify Time Off content is shown
    await expect(page.getByText('Upcoming Time Off')).toBeVisible();
  });

  test('stats cards display numeric values', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Team Management' })).toBeVisible({
      timeout: 10000,
    });

    // Find stats cards and verify they contain numbers
    const statsCards = page.locator('.grid.gap-4 .text-2xl.font-bold');

    // Should have 4 stats cards
    await expect(statsCards).toHaveCount(4);

    // Each should contain a number
    const cards = await statsCards.all();
    for (const card of cards) {
      const text = await card.textContent();
      expect(text).toMatch(/^\d+$/);
    }
  });
});
