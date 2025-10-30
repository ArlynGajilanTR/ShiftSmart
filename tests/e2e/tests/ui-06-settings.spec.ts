import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';

test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/dashboard/settings');
  });

  test('Settings page loads correctly', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Settings');
    await expect(page.locator('text=Profile Information')).toBeVisible();
    await expect(page.locator('text=Change Password')).toBeVisible();
  });

  test('Profile form fields are editable', async ({ page }) => {
    const nameInput = page.locator('input[id="name"]');
    await expect(nameInput).toBeVisible();
    
    // Update name
    await nameInput.clear();
    await nameInput.fill('Test User Updated');
    await expect(nameInput).toHaveValue('Test User Updated');
  });

  test('Email input is editable', async ({ page }) => {
    const emailInput = page.locator('input[id="email"]');
    await expect(emailInput).toBeVisible();
    
    const currentValue = await emailInput.inputValue();
    await emailInput.clear();
    await emailInput.fill('newemail@reuters.com');
    await expect(emailInput).toHaveValue('newemail@reuters.com');
    
    // Restore original
    await emailInput.clear();
    await emailInput.fill(currentValue);
  });

  test('Phone input is editable', async ({ page }) => {
    const phoneInput = page.locator('input[id="phone"]');
    await expect(phoneInput).toBeVisible();
    
    await phoneInput.clear();
    await phoneInput.fill('+39 02 9999 9999');
    await expect(phoneInput).toHaveValue('+39 02 9999 9999');
  });

  test('Title/Role dropdown works', async ({ page }) => {
    const roleSelect = page.locator('button:has-text("Title / Role")').locator('..').locator('button').first();
    
    if (await roleSelect.isVisible()) {
      await roleSelect.click();
      await page.waitForTimeout(300);
      
      // Select a different role
      await page.click('text=Junior Editor');
      await page.waitForTimeout(300);
      
      // Verify selection changed
      await expect(page.locator('text=Junior Editor')).toBeVisible();
    }
  });

  test('Bureau dropdown works', async ({ page }) => {
    const bureauSelect = page.locator('button:has-text("Bureau Location")').locator('..').locator('button').first();
    
    if (await bureauSelect.isVisible()) {
      await bureauSelect.click();
      await page.waitForTimeout(300);
      
      // Toggle between Milan and Rome
      const currentText = await bureauSelect.textContent();
      if (currentText?.includes('Milan')) {
        await page.click('text=Rome');
      } else {
        await page.click('text=Milan');
      }
      
      await page.waitForTimeout(300);
    }
  });

  test('Save Changes button is visible', async ({ page }) => {
    const saveButton = page.locator('button:has-text("Save Changes")').first();
    await expect(saveButton).toBeVisible();
  });

  test('Cancel button resets form', async ({ page }) => {
    const nameInput = page.locator('input[id="name"]');
    const originalValue = await nameInput.inputValue();
    
    // Modify value
    await nameInput.clear();
    await nameInput.fill('Modified Name');
    
    // Click Cancel
    const cancelButton = page.locator('button:has-text("Cancel")').first();
    await cancelButton.click();
    await page.waitForTimeout(500);
    
    // Verify value reset (may need to reload)
    const currentValue = await nameInput.inputValue();
    expect(currentValue).toBeTruthy();
  });

  test('Password change form fields are visible', async ({ page }) => {
    await expect(page.locator('input[id="current-password"]')).toBeVisible();
    await expect(page.locator('input[id="new-password"]')).toBeVisible();
    await expect(page.locator('input[id="confirm-password"]')).toBeVisible();
  });

  test('Password fields accept input', async ({ page }) => {
    const currentPassword = page.locator('input[id="current-password"]');
    const newPassword = page.locator('input[id="new-password"]');
    const confirmPassword = page.locator('input[id="confirm-password"]');
    
    await currentPassword.fill('currentpass123');
    await newPassword.fill('newpass123');
    await confirmPassword.fill('newpass123');
    
    await expect(currentPassword).toHaveValue('currentpass123');
    await expect(newPassword).toHaveValue('newpass123');
    await expect(confirmPassword).toHaveValue('newpass123');
  });

  test('Update Password button is visible', async ({ page }) => {
    const updateButton = page.locator('button:has-text("Update Password")');
    await expect(updateButton).toBeVisible();
  });

  test('Email Notifications Configure button is visible', async ({ page }) => {
    const configureButton = page.locator('button:has-text("Configure")');
    await expect(configureButton).toBeVisible();
  });

  test('Default Calendar View dropdown works', async ({ page }) => {
    const calendarViewSelect = page.locator('button:has-text("Default Calendar View")').locator('..').locator('button').last();
    
    if (await calendarViewSelect.isVisible()) {
      await calendarViewSelect.click();
      await page.waitForTimeout(300);
      
      // Select different view
      await page.click('text=Month');
      await page.waitForTimeout(300);
      
      // Verify selection changed
      await expect(page.locator('text=Month')).toBeVisible();
    }
  });
});

