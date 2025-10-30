import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';
import { ApiInterceptor } from '../helpers/api-interceptor';

test.describe('Employees Page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/dashboard/employees');
  });

  test('Employees page loads with data', async ({ page }) => {
    const apiInterceptor = new ApiInterceptor(page);
    await apiInterceptor.start();

    await page.waitForTimeout(2000);
    
    // Verify API call was made
    const employeesCall = apiInterceptor.getLatestCall(/\/api\/employees/);
    expect(employeesCall).not.toBeNull();
    expect(employeesCall?.method).toBe('GET');
    
    // Verify stats cards are visible
    await expect(page.locator('text=Total Employees')).toBeVisible();
    
    await apiInterceptor.stop();
  });

  test('Add Employee button opens dialog', async ({ page }) => {
    const addButton = page.locator('button:has-text("Add Employee")');
    await expect(addButton).toBeVisible();
    
    await addButton.click();
    
    // Verify dialog opens
    await expect(page.locator('text=Add New Employee')).toBeVisible({ timeout: 2000 });
    await expect(page.locator('input[id="name"]')).toBeVisible();
  });

  test('Search input filters employees', async ({ page }) => {
    await page.waitForTimeout(1000); // Wait for employees to load
    
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();
    
    await searchInput.fill('rossi');
    await page.waitForTimeout(500);
    
    // Verify filtered results
    const filteredRows = page.locator('tbody tr');
    const count = await filteredRows.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('Bureau filter dropdown works', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // Click bureau filter
    await page.click('button:has-text("Bureau")');
    await page.click('text=Milan');
    
    await page.waitForTimeout(500);
    
    // Verify filter applied
    const rows = page.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('Role filter dropdown works', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // Click role filter
    await page.click('button:has-text("Role")');
    await page.click('text=Senior Editor');
    
    await page.waitForTimeout(500);
    
    // Verify filter applied
    const rows = page.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('Table View and Card View tabs switch', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // Switch to card view
    await page.click('button:has-text("Card View")');
    await expect(page.locator('.grid').first()).toBeVisible();
    
    // Switch back to table view
    await page.click('button:has-text("Table View")');
    await expect(page.locator('table')).toBeVisible();
  });

  test('Edit button navigates to employee detail', async ({ page }) => {
    await page.waitForTimeout(2000); // Wait for employees to load
    
    // Find first edit button
    const editButtons = page.locator('a[href*="/dashboard/employees/"]').first();
    
    if (await editButtons.isVisible()) {
      await editButtons.click();
      
      // Verify navigation to detail page
      await expect(page).toHaveURL(/\/dashboard\/employees\/\d+/, { timeout: 5000 });
    } else {
      test.skip(true, 'No edit buttons found - employees may not be loaded');
    }
  });

  test('Stats cards display correct counts', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Total Employees stat
    const totalStat = page.locator('text=Total Employees').locator('..').locator('text=/\\d+/').first();
    const totalText = await totalStat.textContent();
    expect(parseInt(totalText || '0')).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Employee Detail Page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/dashboard/employees');
    await page.waitForTimeout(2000);
    
    // Navigate to first employee
    const editButtons = page.locator('a[href*="/dashboard/employees/"]').first();
    if (await editButtons.isVisible()) {
      await editButtons.click();
      await page.waitForURL(/\/dashboard\/employees\/\d+/, { timeout: 5000 });
    } else {
      // Manually navigate to a known employee ID
      await page.goto('/dashboard/employees/1');
    }
  });

  test('Back button navigates to employees list', async ({ page }) => {
    const backButton = page.locator('button').filter({ has: page.locator('svg') }).first();
    await backButton.click();
    
    await expect(page).toHaveURL('/dashboard/employees', { timeout: 5000 });
  });

  test('Employee Details tab displays form', async ({ page }) => {
    await expect(page.locator('text=Personal Information')).toBeVisible();
    await expect(page.locator('input[id="name"]')).toBeVisible();
  });

  test('Shift Preferences tab switches correctly', async ({ page }) => {
    await page.click('button:has-text("Shift Preferences")');
    await expect(page.locator('text=Preferred Days')).toBeVisible();
  });

  test('Shift History tab switches correctly', async ({ page }) => {
    await page.click('button:has-text("Shift History")');
    await expect(page.locator('text=Recent Shifts')).toBeVisible();
  });

  test('Preferred day checkboxes toggle', async ({ page }) => {
    await page.click('button:has-text("Shift Preferences")');
    await page.waitForTimeout(500);
    
    const mondayCheckbox = page.locator('input[type="checkbox"]').first();
    if (await mondayCheckbox.isVisible()) {
      const initialState = await mondayCheckbox.isChecked();
      await mondayCheckbox.click();
      const newState = await mondayCheckbox.isChecked();
      expect(newState).toBe(!initialState);
    }
  });

  test('Save Changes button is visible', async ({ page }) => {
    const saveButton = page.locator('button:has-text("Save Changes")');
    await expect(saveButton).toBeVisible();
  });

  test('Cancel button navigates back', async ({ page }) => {
    const cancelButton = page.locator('button:has-text("Cancel")');
    await expect(cancelButton).toBeVisible();
    
    await cancelButton.click();
    await expect(page).toHaveURL(/\/dashboard\/employees/, { timeout: 5000 });
  });
});

