import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';

test.describe('My Availability Page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/dashboard/my-availability');
  });

  test('loads current preferences and status banner', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'My Availability' })).toBeVisible();
    await expect(
      page.getByText(/Preferences Confirmed|Pending Approval/, { exact: false })
    ).toBeVisible();
  });

  test('allows updating and saving preferences', async ({ page }) => {
    // Toggle at least one preferred day
    const mondayCheckbox = page.getByRole('checkbox', { name: 'Mon' });
    await mondayCheckbox.click();

    // Toggle at least one shift type
    const morningCheckbox = page.getByRole('checkbox', { name: 'Morning' });
    await morningCheckbox.click();

    // Click save
    const saveButton = page.getByRole('button', { name: 'Save Preferences' });
    await expect(saveButton).toBeEnabled();
    await saveButton.click();

    // Expect banner or page content still present (basic smoke check that save didn't break page)
    await expect(page.getByRole('heading', { name: 'My Availability' })).toBeVisible();
  });
});
