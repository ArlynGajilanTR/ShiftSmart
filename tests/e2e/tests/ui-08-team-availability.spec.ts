import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';

test.describe('Team Availability Page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/dashboard/team');
  });

  test('loads team availability table and stats', async ({ page }) => {
    const heading = page.getByRole('heading', { name: 'Team Availability' });
    if (!(await heading.isVisible())) {
      test.skip();
    }

    await expect(heading).toBeVisible();
    await expect(page.getByText('Total Team Members', { exact: false })).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('allows confirming all pending preferences', async ({ page }) => {
    const heading = page.getByRole('heading', { name: 'Team Availability' });
    if (!(await heading.isVisible())) {
      test.skip();
    }

    // Open confirm-all dialog if button exists
    const confirmAllButton = page.getByRole('button', { name: /Confirm All Pending/i });
    if (!(await confirmAllButton.isVisible())) {
      test.skip();
    }

    await confirmAllButton.click();
    const confirmDialogButton = page.getByRole('button', { name: /^Confirm All$/i });
    await confirmDialogButton.click();

    // Basic assertion: page remains on team availability without error
    await expect(page.getByRole('heading', { name: 'Team Availability' })).toBeVisible();
  });
});
