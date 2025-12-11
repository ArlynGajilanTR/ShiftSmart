import { Page } from '@playwright/test';

/**
 * Authentication helper functions for tests
 * NOTE: This is a legacy helper. New tests should use test-users.ts instead.
 */
export const TEST_CREDENTIALS = {
  email: 'sara.rossi@thomsonreuters.com',
  password: 'changeme',
};

// Base URL for tests - fallback if not set in config
const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

/**
 * Get the full URL, handling both relative and absolute paths
 */
function getFullUrl(path: string): string {
  if (path.startsWith('http')) return path;
  return `${BASE_URL}${path}`;
}

/**
 * Login to the application
 */
export async function login(page: Page) {
  // Navigate to login page
  await page.goto(getFullUrl('/login'));

  // Wait for the form to be ready using ID selectors (most reliable)
  await page.waitForSelector('#email', { state: 'visible', timeout: 10000 });

  // Use ID-based selectors which are most reliable
  await page.fill('#email', TEST_CREDENTIALS.email);
  await page.fill('#password', TEST_CREDENTIALS.password);

  // Submit and wait for navigation
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard/, { timeout: 20000 });

  // Verify token with retry
  let token: string | null = null;
  for (let i = 0; i < 5; i++) {
    token = await page.evaluate(() => localStorage.getItem('auth_token'));
    if (token) break;
    await page.waitForTimeout(500);
  }

  if (!token) {
    throw new Error('Login failed: No auth token found in localStorage');
  }

  return token;
}

/**
 * Logout from the application
 */
export async function logout(page: Page) {
  // Try to click logout in sidebar
  const logoutButton = page.locator('text=Log Out').first();
  if (await logoutButton.isVisible({ timeout: 3000 }).catch(() => false)) {
    await logoutButton.click();
    await page.waitForURL(/^\/$|\/login/, { timeout: 5000 }).catch(() => {});
  }

  // Clear token from localStorage as fallback
  await page.evaluate(() => localStorage.removeItem('auth_token'));

  // Navigate to ensure clean state
  await page.goto(getFullUrl('/login'));
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  const token = await page.evaluate(() => localStorage.getItem('auth_token'));
  return !!token;
}
