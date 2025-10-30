import { Page } from '@playwright/test';

/**
 * Authentication helper functions for tests
 */
export const TEST_CREDENTIALS = {
  email: 'gianluca.semeraro@thomsonreuters.com',
  password: 'changeme',
};

/**
 * Login to the application
 */
export async function login(page: Page) {
  await page.goto('/login');
  await page.fill('input[type="email"]', TEST_CREDENTIALS.email);
  await page.fill('input[type="password"]', TEST_CREDENTIALS.password);
  await page.click('button[type="submit"]');
  
  // Wait for navigation to dashboard
  await page.waitForURL('/dashboard', { timeout: 10000 });
  
  // Verify token is stored
  const token = await page.evaluate(() => localStorage.getItem('auth_token'));
  if (!token) {
    throw new Error('Login failed: No auth token found in localStorage');
  }
  
  return token;
}

/**
 * Logout from the application
 */
export async function logout(page: Page) {
  // Click logout in sidebar
  await page.click('text=Log Out');
  await page.waitForURL('/', { timeout: 5000 });
  
  // Verify token is removed
  const token = await page.evaluate(() => localStorage.getItem('auth_token'));
  if (token) {
    throw new Error('Logout failed: Auth token still present in localStorage');
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  const token = await page.evaluate(() => localStorage.getItem('auth_token'));
  return !!token;
}

