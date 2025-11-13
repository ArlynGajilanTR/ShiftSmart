import { test, expect } from '@playwright/test';
import { ApiInterceptor } from '../helpers/api-interceptor';

test.describe('Welcome and Login Pages', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Welcome page loads correctly', async ({ page }) => {
    await expect(page).toHaveTitle(/ShiftSmart/i);
    await expect(page.locator('h1')).toContainText('ShiftSmart');
  });

  test('Log In button navigates to login page', async ({ page }) => {
    const logInButton = page.locator('button:has-text("Log In")');
    await expect(logInButton).toBeVisible();

    await logInButton.click();
    await expect(page).toHaveURL('/login');
  });

  test('Reuters logo link works', async ({ page }) => {
    const logo = page.locator('img[alt="Reuters"]').locator('..');
    await logo.click();
    await expect(page).toHaveURL('/');
  });

  test('Login form submission works', async ({ page }) => {
    const apiInterceptor = new ApiInterceptor(page);
    await apiInterceptor.start();

    await page.goto('/login');

    // Fill login form
    await page.fill('input[type="email"]', 'gianluca.semeraro@thomsonreuters.com');
    await page.fill('input[type="password"]', 'changeme');

    // Click login button
    const loginButton = page.locator('button[type="submit"]');
    await expect(loginButton).toBeVisible();
    await expect(loginButton).toContainText('Log In');

    await loginButton.click();

    // Wait for API call
    await page.waitForTimeout(2000);

    // Verify API call was made
    const loginCall = apiInterceptor.getLatestCall(/\/api\/auth\/login/);
    expect(loginCall).not.toBeNull();
    expect(loginCall?.method).toBe('POST');
    expect(loginCall?.status).toBe(200);

    // Verify navigation to dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });

    // Verify token stored
    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(token).toBeTruthy();

    await apiInterceptor.stop();
  });

  test('Login with invalid credentials shows error', async ({ page }) => {
    const apiInterceptor = new ApiInterceptor(page);
    await apiInterceptor.start();

    await page.goto('/login');

    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Wait for error toast
    await page.waitForTimeout(3000);

    // Verify error is shown (toast notification or error message)
    const errorElement = page.locator('text=/login failed|invalid|error/i').first();
    const hasError = await errorElement.isVisible().catch(() => false);
    expect(hasError).toBeTruthy();

    await apiInterceptor.stop();
  });

  test('Sign up link navigates to signup page', async ({ page }) => {
    await page.goto('/login');

    const signUpLink = page.locator('a:has-text("Sign up")');
    await expect(signUpLink).toBeVisible();

    await signUpLink.click();
    await expect(page).toHaveURL('/signup');
  });

  test('Signup form submission works', async ({ page }) => {
    const apiInterceptor = new ApiInterceptor(page);
    await apiInterceptor.start();

    await page.goto('/signup');

    // Fill signup form
    await page.fill('input[id="fullName"]', 'Test User');
    await page.fill('input[id="email"]', `test${Date.now()}@reuters.com`);
    await page.fill('input[id="password"]', 'testpassword123');

    // Select bureau
    await page.click('button:has-text("Select your bureau")');
    await page.click('text=Milan');

    // Select role
    await page.click('button:has-text("Select your role")');
    await page.click('text=Editor');

    // Submit form
    const createButton = page.locator('button:has-text("Create Account")');
    await expect(createButton).toBeVisible();

    await createButton.click();

    // Wait for API call
    await page.waitForTimeout(2000);

    // Verify API call was made
    const signupCall = apiInterceptor.getLatestCall(/\/api\/auth\/signup/);
    expect(signupCall).not.toBeNull();
    expect(signupCall?.method).toBe('POST');

    // Should redirect to login
    await expect(page).toHaveURL('/login', { timeout: 10000 });

    await apiInterceptor.stop();
  });
});
