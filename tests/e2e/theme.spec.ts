import { expect, test } from '@playwright/test';

test('?theme=dark sets data-theme', async ({ page }) => {
  await page.goto('/?theme=dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('?theme=light sets data-theme', async ({ page }) => {
  await page.goto('/?theme=light');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('no param leaves data-theme unset', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).not.toHaveAttribute('data-theme', /.+/);
});

test('invalid theme value is ignored', async ({ page }) => {
  await page.goto('/?theme=blue');
  await expect(page.locator('html')).not.toHaveAttribute('data-theme', /.+/);
});

test('the theme toggle writes theme to the URL', async ({ page }) => {
  await page.goto('/?theme=light');
  await page.waitForFunction(() => !document.querySelector('astro-island[ssr]'));
  await page.getByRole('button', { name: 'Toggle theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page).toHaveURL(/theme=dark/);
});
