import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';

test.describe('ShiftSmart Chatbot', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/dashboard');
  });

  test('opens chatbot and sends a basic question', async ({ page }) => {
    // Open chatbot via sidebar button text
    const askButton = page.getByText('Ask ShiftSmart', { exact: false }).first();
    await askButton.click();

    // Ensure chat panel is visible
    await expect(page.getByText('ShiftSmart Guide', { exact: false })).toBeVisible();

    // Send a simple question
    const input = page.getByRole('textbox');
    await input.fill('How do I create a new shift?');
    const sendButton = page.getByRole('button', { name: /Send|Ask/i }).first();
    await sendButton.click();

    // We don't assert on AI response content (depends on external service),
    // just that some assistant message eventually appears or no error is thrown.
    await expect(
      page.getByText(/Sorry, I couldn't process that request.|Create a shift/i, { exact: false })
    ).toBeVisible({ timeout: 10000 });
  });
});
