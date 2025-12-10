import { Page, Locator } from '@playwright/test';

/**
 * Wait for shifts to appear in the schedule view
 * Uses polling with exponential backoff instead of fixed timeout
 */
export async function waitForShifts(
  page: Page,
  options?: {
    minCount?: number;
    timeout?: number;
  }
): Promise<Locator | null> {
  const { minCount = 1, timeout = 15000 } = options || {};
  const startTime = Date.now();
  let pollInterval = 200;

  while (Date.now() - startTime < timeout) {
    const shifts = page.locator('[class*="cursor-grab"], [data-testid="draggable-shift"]');
    const count = await shifts.count();

    if (count >= minCount) {
      return shifts;
    }

    await page.waitForTimeout(pollInterval);
    pollInterval = Math.min(pollInterval * 1.5, 1000); // Cap at 1 second
  }

  return null;
}

/**
 * Wait for network to be idle with custom conditions
 */
export async function waitForScheduleLoad(page: Page): Promise<void> {
  // Wait for the API call to complete
  await Promise.race([
    page.waitForResponse(
      (response) => response.url().includes('/api/shifts') && response.status() === 200,
      { timeout: 10000 }
    ),
    page.waitForTimeout(10000), // Fallback if no API call is made
  ]);

  // Wait for any loading spinners to disappear
  await page
    .locator('.animate-spin')
    .waitFor({ state: 'hidden', timeout: 5000 })
    .catch(() => {});
}

/**
 * Safely perform drag and drop with retry logic
 */
export async function safeDragDrop(
  source: Locator,
  target: Locator,
  options?: { retries?: number }
): Promise<boolean> {
  const { retries = 2 } = options || {};

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      await source.dragTo(target, { timeout: 5000 });
      return true;
    } catch (error) {
      if (attempt === retries) {
        console.error(`Drag failed after ${retries + 1} attempts:`, error);
        return false;
      }
      await source.page().waitForTimeout(500);
    }
  }
  return false;
}
