import { expect, test } from '@playwright/test';

/** The shutter button is a second locale control: fixed bottom-right, same `?locale=` value as the nav chip. */

test.use({ viewport: { width: 375, height: 812 }, reducedMotion: 'reduce' });

const hydrated = (page: import('@playwright/test').Page) =>
  page.waitForFunction(() => !document.querySelector('astro-island[ssr]'));

test('the shutter sits bottom-right with a 44px+ target', async ({ page }) => {
  await page.goto('/research');
  await hydrated(page);
  const box = await page.locator('[data-shutter]').boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeGreaterThanOrEqual(44);
  expect(box!.height).toBeGreaterThanOrEqual(44);
  expect(box!.x + box!.width).toBeGreaterThan(375 - 24);
  expect(box!.y + box!.height).toBeGreaterThan(812 - 24);
});

test('it opens the locale popover and reflects aria-expanded', async ({ page }) => {
  await page.goto('/research');
  await hydrated(page);
  const shutter = page.locator('[data-shutter]');
  await expect(shutter).toHaveAttribute('aria-expanded', 'false');
  await shutter.click();
  await expect(shutter).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('option', { name: 'Deutsch' })).toBeVisible();
});

test('picking a locale updates the URL and html lang', async ({ page }) => {
  await page.goto('/research?theme=dark');
  await hydrated(page);
  await page.locator('[data-shutter]').click();
  await page.getByRole('option', { name: 'Deutsch' }).click();
  await expect(page).toHaveURL(/locale=de/);
  await expect(page).toHaveURL(/theme=dark/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
});

test('only one locale popover is open at a time', async ({ page }) => {
  await page.goto('/research');
  await hydrated(page);
  await page.locator('[data-shutter]').click();
  await expect(page.getByRole('listbox')).toHaveCount(1);
  // Keyboard open on the nav chip: no pointerdown, so only the shared event can close the shutter's popover.
  await page.getByRole('button', { name: 'EN Choose language' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-shutter]')).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('listbox')).toHaveCount(1);
});

test('it is dimmed and inert while a panel is open', async ({ page }) => {
  await page.goto('/?overlay=research');
  await expect(page.locator('html')).toHaveAttribute('data-overlay-open', '');
  const shutter = page.locator('[data-shutter]');
  await expect(shutter).toHaveCSS('pointer-events', 'none');
  await expect(shutter).toHaveCSS('opacity', '0.3');
});
