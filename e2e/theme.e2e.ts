import { test, expect } from '@playwright/test';

test.describe('Theme System E2E', () => {
  test('should toggle between light and dark modes successfully', async ({ page }) => {
    await page.goto('/');

    const htmlElement = page.locator('html');
    await expect(htmlElement).toHaveAttribute('data-theme', 'dark', { timeout: 10000 });

    const themeToggleBtn = page.getByRole('button', { name: /switch to/i }).first();
    await themeToggleBtn.click();

    await expect(htmlElement).toHaveAttribute('data-theme', 'light', { timeout: 5000 });

    const bgColor = await htmlElement.evaluate((el) => {
      return window.getComputedStyle(el).getPropertyValue('--bg-deep').trim();
    });
    expect(bgColor).toBe('#f8f9fc');

    await themeToggleBtn.click();
    await expect(htmlElement).toHaveAttribute('data-theme', 'dark', { timeout: 5000 });
  });
});
