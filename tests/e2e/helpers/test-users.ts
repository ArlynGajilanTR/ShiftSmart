import { Page } from '@playwright/test';

/**
 * Test user credentials for different roles
 * Based on actual database users in ShiftSmart-v2 project
 */

// Admin user - full system access
export const ADMIN_USER = {
  email: 'arlyn.gajilan@thomsonreuters.com',
  password: 'testtest',
  role: 'admin',
  name: 'Arlyn Gajilan',
  bureau: 'Reuters Italy - Rome',
};

// Manager user - team management and scheduling
export const MANAGER_USER = {
  email: 'gavin.jones@thomsonreuters.com',
  password: 'changeme',
  role: 'manager',
  name: 'Gavin Jones',
  bureau: 'Reuters Italy - Rome',
};

// Staff user - basic staffer (Milan bureau)
// Note: Using Sara Rossi instead of Gianluca Semeraro because Gianluca is a team leader
export const STAFFER_MILAN = {
  email: 'sara.rossi@thomsonreuters.com',
  password: 'changeme',
  role: 'staff',
  name: 'Sara Rossi',
  bureau: 'Reuters Italy - Milan',
  shift_role: 'senior',
};

// Staff user - correspondent (Rome bureau)
export const STAFFER_ROME = {
  email: 'alvise.armellini@thomsonreuters.com',
  password: 'changeme',
  role: 'staff',
  name: 'Alvise Armellini',
  bureau: 'Reuters Italy - Rome',
  shift_role: 'senior',
};

// Staff user - correspondent (for cross-user tests)
export const STAFFER_CORRESPONDENT = {
  email: 'alessia.pe@thomsonreuters.com',
  password: 'changeme',
  role: 'staff',
  name: "Alessia Pe'",
  bureau: 'Reuters Italy - Milan',
  shift_role: 'correspondent',
};

// Type definitions
export interface TestUser {
  email: string;
  password: string;
  role: string;
  name: string;
  bureau: string;
  shift_role?: string;
}

/**
 * Login with a specific test user
 */
export async function loginAs(page: Page, user: TestUser): Promise<string> {
  await page.goto('/login');
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);
  await page.click('button[type="submit"]');

  // Wait for navigation to dashboard (increased timeout for slow responses)
  await page.waitForURL('/dashboard', { timeout: 30000 });

  // Verify token is stored
  const token = await page.evaluate(() => localStorage.getItem('auth_token'));
  if (!token) {
    throw new Error(`Login failed for ${user.email}: No auth token found in localStorage`);
  }

  return token;
}

/**
 * Login as admin user
 */
export async function loginAsAdmin(page: Page): Promise<string> {
  return loginAs(page, ADMIN_USER);
}

/**
 * Login as manager user
 */
export async function loginAsManager(page: Page): Promise<string> {
  return loginAs(page, MANAGER_USER);
}

/**
 * Login as staff user (default: Milan)
 */
export async function loginAsStaffer(page: Page, user: TestUser = STAFFER_MILAN): Promise<string> {
  return loginAs(page, user);
}

/**
 * Logout from the application
 */
export async function logout(page: Page): Promise<void> {
  // Click logout button with force to bypass any overlays
  const logoutButton = page.getByRole('button', { name: 'Log Out' });
  await logoutButton.click({ force: true });

  // Wait for navigation to start
  await page.waitForTimeout(1000);

  // Clear token from localStorage as a fallback
  await page.evaluate(() => localStorage.removeItem('auth_token'));

  // Navigate to login page
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
}

/**
 * Check if user has a specific role capability
 */
export function isManager(user: TestUser): boolean {
  return user.role === 'admin' || user.role === 'manager';
}

/**
 * Check if user is staffer
 */
export function isStaffer(user: TestUser): boolean {
  return user.role === 'staff';
}
