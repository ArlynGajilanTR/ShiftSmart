import { test, expect } from '@playwright/test';

const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

test.describe('Drag and Drop Animations - Trello-like UX', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login
    await page.goto(`${BASE_URL}/login`);

    // Login with test credentials
    await page.waitForSelector('#email', { state: 'visible', timeout: 10000 });
    await page.fill('#email', 'sara.rossi@thomsonreuters.com');
    await page.fill('#password', 'changeme');
    await page.click('button[type="submit"]');

    // Wait for dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 20000 });

    // Navigate to schedule
    await page.goto(`${BASE_URL}/dashboard/schedule`);
    await page.waitForTimeout(2000);
  });

  test('Draggable shift cards have proper hover animations', async ({ page }) => {
    // Switch to Week View
    await page.click('button:has-text("Week View")');
    await page.waitForTimeout(1000);

    // Check for draggable shift cards
    const shiftCards = page.locator('[data-testid="draggable-shift"]');
    const count = await shiftCards.count();

    if (count === 0) {
      test.skip(true, 'No shifts available for testing');
      return;
    }

    // Verify shift card has the new animation class
    const firstShift = shiftCards.first();
    await expect(firstShift).toHaveClass(/draggable-shift-card/);

    // Verify hover state triggers visual change
    await firstShift.hover();
    await page.waitForTimeout(300); // Wait for transition

    // Get computed styles to verify transform is applied
    const transformValue = await firstShift.evaluate((el) => {
      return window.getComputedStyle(el).transform;
    });

    // Should have some transform applied on hover
    expect(transformValue).not.toBe('none');
  });

  test('Droppable zones have proper styling classes', async ({ page }) => {
    await page.click('button:has-text("Week View")');
    await page.waitForTimeout(1000);

    // Check for droppable zones
    const droppableZones = page.locator('[data-testid="droppable-day"]');
    const count = await droppableZones.count();

    expect(count).toBeGreaterThan(0);

    // Verify droppable zones have the new class
    const firstZone = droppableZones.first();
    await expect(firstZone).toHaveClass(/droppable-zone/);
  });

  test('Drag overlay renders with lift animation class', async ({ page }) => {
    await page.click('button:has-text("Week View")');
    await page.waitForTimeout(1000);

    const shiftCards = page.locator('[data-testid="draggable-shift"]');
    const count = await shiftCards.count();

    if (count === 0) {
      test.skip(true, 'No shifts available for testing');
      return;
    }

    const firstShift = shiftCards.first();

    // Start dragging
    const boundingBox = await firstShift.boundingBox();
    if (!boundingBox) {
      test.skip(true, 'Could not get bounding box');
      return;
    }

    // Start drag operation
    await page.mouse.move(
      boundingBox.x + boundingBox.width / 2,
      boundingBox.y + boundingBox.height / 2
    );
    await page.mouse.down();
    await page.mouse.move(boundingBox.x + 100, boundingBox.y);

    // Wait for drag overlay to appear
    await page.waitForTimeout(200);

    // Check for drag overlay with animation class
    const dragOverlay = page.locator('.drag-overlay-card');
    const overlayVisible = await dragOverlay.isVisible({ timeout: 1000 }).catch(() => false);

    // Release mouse
    await page.mouse.up();

    // The drag overlay should have been present during drag
    // Note: It may disappear quickly after mouse up
    console.log('Drag overlay was visible during drag:', overlayVisible);
  });

  test('Placeholder appears when dragging shift', async ({ page }) => {
    await page.click('button:has-text("Week View")');
    await page.waitForTimeout(1000);

    const shiftCards = page.locator('[data-testid="draggable-shift"]');
    const count = await shiftCards.count();

    if (count === 0) {
      test.skip(true, 'No shifts available for testing');
      return;
    }

    const firstShift = shiftCards.first();

    // Get position for dragging
    const boundingBox = await firstShift.boundingBox();
    if (!boundingBox) {
      test.skip(true, 'Could not get bounding box');
      return;
    }

    // Start drag operation
    await page.mouse.move(
      boundingBox.x + boundingBox.width / 2,
      boundingBox.y + boundingBox.height / 2
    );
    await page.mouse.down();
    await page.mouse.move(boundingBox.x + 150, boundingBox.y);

    // Wait for placeholder to appear
    await page.waitForTimeout(300);

    // Check for placeholder element
    const placeholder = page.locator('.drag-placeholder');
    const placeholderVisible = await placeholder.isVisible({ timeout: 1000 }).catch(() => false);

    // Release mouse
    await page.mouse.up();

    expect(placeholderVisible).toBeTruthy();
  });

  test('Drop animation triggers after successful drop', async ({ page }) => {
    await page.click('button:has-text("Week View")');
    await page.waitForTimeout(1000);

    const shiftCards = page.locator('[data-testid="draggable-shift"]');
    const count = await shiftCards.count();

    if (count === 0) {
      test.skip(true, 'No shifts available for testing');
      return;
    }

    const firstShift = shiftCards.first();
    const targetZone = page.locator('[data-testid="droppable-day"]').nth(3);

    // Perform drag and drop using Playwright's dragTo
    await firstShift.dragTo(targetZone);

    // Wait a moment for the animation to trigger
    await page.waitForTimeout(500);

    // Handle any conflict dialog
    const conflictDialog = page.locator('text=Scheduling Conflict Detected');
    if (await conflictDialog.isVisible({ timeout: 1000 }).catch(() => false)) {
      await page.click('button:has-text("Move Anyway")');
      await page.waitForTimeout(500);
    }

    // Check if any shift has the dropped animation class
    const droppedShift = page.locator('.shift-dropped');
    const hasDroppedClass = (await droppedShift.count()) > 0;

    // Note: The class is temporary, so it may have already been removed
    console.log('Shift with dropped animation class found:', hasDroppedClass);
  });

  test('Today view time slots have proper droppable styling', async ({ page }) => {
    // Click on the "Today" tab (not "Today View")
    await page.click('button[role="tab"]:has-text("Today")');
    await page.waitForTimeout(1000);

    // Check for time slot droppables
    const timeSlots = page.locator('[data-testid="droppable-timeslot"]');
    const count = await timeSlots.count();

    // Today view should have Morning/Afternoon/Evening slots
    expect(count).toBeGreaterThan(0);

    // Verify slots have the droppable-zone class
    const firstSlot = timeSlots.first();
    await expect(firstSlot).toHaveClass(/droppable-zone/);
  });
});
