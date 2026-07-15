import { test, expect } from '@playwright/test';

test.describe('Theme System E2E', () => {
  test('should toggle between light and dark modes successfully', async ({ page }) => {
    // Navigate to the root (which includes the ThemeToggle component in the navigation)
    await page.goto('/');

    // Wait for the HTML tag which holds the data-theme attribute
    const htmlElement = page.locator('html');

    // Check initial state (should be dark by default)
    await expect(htmlElement).toHaveAttribute('data-theme', 'dark', { timeout: 10000 });

    // Click the theme toggle button
    // We target it via aria-label since it's the standard accessible way we should be using
    const themeToggleBtn = page.getByRole('button', { name: /switch to/i }).first();
    await themeToggleBtn.click();

    // Verify it switched to light
    await expect(htmlElement).toHaveAttribute('data-theme', 'light', { timeout: 5000 });

    // Verify a CSS variable correctly evaluates in light mode
    const bgColor = await htmlElement.evaluate((el) => {
      return window.getComputedStyle(el).getPropertyValue('--bg-deep').trim();
    });
    // In light mode, --bg-deep should be #f8f9fc
    expect(bgColor).toBe('#f8f9fc');

    // Click again to switch back to dark
    await themeToggleBtn.click();
    await expect(htmlElement).toHaveAttribute('data-theme', 'dark', { timeout: 5000 });
  });
});
