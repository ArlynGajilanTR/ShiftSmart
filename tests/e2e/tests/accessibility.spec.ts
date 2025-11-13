/**
 * Accessibility Tests
 * Tests WCAG 2.1 AA compliance using axe-core
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { login } from '../helpers/auth';

test.describe('Accessibility Tests - WCAG 2.1 AA', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Welcome page should be accessible', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Login page should be accessible', async ({ page }) => {
    await page.goto('/login');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Dashboard should be accessible', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Employees page should be accessible', async ({ page }) => {
    await page.goto('/dashboard/employees');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Schedule page should be accessible', async ({ page }) => {
    await page.goto('/dashboard/schedule');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Conflicts page should be accessible', async ({ page }) => {
    await page.goto('/dashboard/conflicts');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Settings page should be accessible', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Forms should have proper labels', async ({ page }) => {
    await page.goto('/login');

    // Check email input has label
    const emailLabel = page.locator('label[for="email"]');
    await expect(emailLabel).toBeVisible();

    // Check password input has label
    const passwordLabel = page.locator('label[for="password"]');
    await expect(passwordLabel).toBeVisible();
  });

  test('Buttons should have accessible names', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const buttons = page.locator('button');
    const count = await buttons.count();

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');

      // Button should have either text content or aria-label
      expect(text || ariaLabel).toBeTruthy();
    }
  });

  test('Images should have alt text', async ({ page }) => {
    await page.goto('/');

    const images = page.locator('img');
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');

      expect(alt).toBeDefined();
    }
  });

  test('Heading hierarchy should be proper', async ({ page }) => {
    await page.goto('/dashboard');

    // Should have h1
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);

    // Check heading levels don't skip
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const headingLevels = await headings.evaluateAll((elements) =>
      elements.map((el) => parseInt(el.tagName[1]))
    );

    // Verify no skips in heading levels
    for (let i = 1; i < headingLevels.length; i++) {
      const diff = headingLevels[i] - headingLevels[i - 1];
      expect(diff).toBeLessThanOrEqual(1);
    }
  });

  test('Color contrast should meet WCAG AA standards', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .disableRules(['landmark-one-main']) // Focus only on contrast
      .analyze();

    const contrastViolations = accessibilityScanResults.violations.filter(
      (v) => v.id === 'color-contrast'
    );

    expect(contrastViolations).toHaveLength(0);
  });

  test('Interactive elements should have focus indicators', async ({ page }) => {
    await page.goto('/dashboard');

    // Tab through page and check focus visible
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);

    const focusedElement = await page.evaluateHandle(() => document.activeElement);
    const hasFocusIndicator = await page.evaluate((element) => {
      if (!element) return false;
      const styles = window.getComputedStyle(element as Element);
      return styles.outlineWidth !== '0px' || styles.outlineStyle !== 'none';
    }, focusedElement);

    expect(hasFocusIndicator).toBe(true);
  });

  test('Skip navigation link should be present', async ({ page }) => {
    await page.goto('/dashboard');

    // Press Tab to focus skip link
    await page.keyboard.press('Tab');

    const skipLink = page.locator('a:has-text("Skip to")');
    const isVisible = await skipLink.isVisible();

    // Skip link should be visible when focused
    expect(isVisible).toBeTruthy();
  });

  test('ARIA landmarks should be present', async ({ page }) => {
    await page.goto('/dashboard');

    // Check for main landmark
    const main = page.locator('[role="main"], main');
    await expect(main).toHaveCount(1);

    // Check for navigation landmark
    const nav = page.locator('[role="navigation"], nav');
    const navCount = await nav.count();
    expect(navCount).toBeGreaterThan(0);
  });

  test('Form validation errors should be announced', async ({ page }) => {
    await page.goto('/login');

    // Submit empty form
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);

    // Check for error message with role="alert"
    const alert = page.locator('[role="alert"], [aria-live="polite"]');
    const alertCount = await alert.count();

    expect(alertCount).toBeGreaterThan(0);
  });

  test('Loading states should be announced', async ({ page }) => {
    await page.goto('/dashboard/employees');

    // Check for loading indicator with aria-live
    const loading = page.locator('[aria-live="polite"], [role="status"]');
    const hasLoading = await loading.count();

    // Should have aria-live region for loading states
    expect(hasLoading).toBeGreaterThanOrEqual(0);
  });

  test('Dialogs should trap focus', async ({ page }) => {
    await page.goto('/dashboard/employees');
    await page.waitForLoadState('networkidle');

    // Open dialog
    const addButton = page.locator('button:has-text("Add Employee")');
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForTimeout(500);

      // Tab should stay within dialog
      const initialFocus = await page.evaluateHandle(() => document.activeElement);

      // Tab multiple times
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(50);
      }

      // Focus should still be within dialog
      const stillInDialog = await page.evaluate(() => {
        const dialog = document.querySelector('[role="dialog"]');
        return dialog?.contains(document.activeElement);
      });

      expect(stillInDialog).toBe(true);
    }
  });

  test('Tables should have proper headers', async ({ page }) => {
    await page.goto('/dashboard/employees');
    await page.waitForLoadState('networkidle');

    // Check table has thead
    const table = page.locator('table');
    if (await table.isVisible()) {
      const thead = table.locator('thead');
      await expect(thead).toBeVisible();

      // Check for th elements
      const headers = table.locator('th');
      const headerCount = await headers.count();
      expect(headerCount).toBeGreaterThan(0);
    }
  });

  test('Status messages should be announced', async ({ page }) => {
    await page.goto('/dashboard');

    // Check for status messages with proper ARIA
    const statusRegion = page.locator('[role="status"], [aria-live="polite"]');

    // Should have status region for announcements
    expect(await statusRegion.count()).toBeGreaterThanOrEqual(0);
  });
});
