import { expect, test } from '@playwright/test';

/**
 * The shutter is a pure flip control: a tap advances to the next locale in the LOCALES list and
 * wraps around. It shows no locale of its own — the code lives on the nav chip — and it opens no
 * popover.
 */

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

test('a tap flips to the next locale with no popover', async ({ page }) => {
  await page.goto('/research');
  await hydrated(page);
  await page.locator('[data-shutter]').click();
  await expect(page).toHaveURL(/locale=ms/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'ms');
  // No popover, ever.
  await expect(page.getByRole('listbox')).toHaveCount(0);
});

test('flips wrap around after the last locale', async ({ page }) => {
  await page.goto('/research?locale=ml');
  await hydrated(page);
  await page.locator('[data-shutter]').click();
  await expect(page).toHaveURL((url) => !url.searchParams.has('locale'));
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('the shutter shows no locale code and names the action', async ({ page }) => {
  await page.goto('/research');
  await hydrated(page);
  const shutter = page.locator('[data-shutter]');
  await expect(shutter).toHaveAttribute('aria-label', 'Next language');
  await expect(shutter).not.toHaveAttribute('aria-expanded');
  await expect(shutter).not.toContainText('EN');
  // The code lives on the nav chip instead.
  await expect(
    page.getByRole('navigation').getByRole('button', { name: 'EN Choose language' }),
  ).toContainText('en');
});

test('the chip follows a shutter flip immediately', async ({ page }) => {
  await page.goto('/research');
  await hydrated(page);
  const chip = page
    .getByRole('navigation')
    .getByRole('button', { name: /Elegir idioma|Choose language/ });
  await page.locator('[data-shutter]').click();
  await expect(page).toHaveURL(/locale=ms/);
  await expect(chip).toHaveAttribute('aria-label', 'MS Pilih bahasa');
  await expect(chip).toContainText('ms');
});

test('the new language is announced politely after a flip', async ({ page }) => {
  await page.goto('/research');
  await hydrated(page);
  await page.locator('[data-shutter]').click();
  const live = page.locator('[data-shutter-live]');
  await expect(live).toContainText('Bahasa Melayu');
});

test('it is dimmed and inert while a panel is open', async ({ page }) => {
  await page.goto('/?overlay=research');
  await expect(page.locator('html')).toHaveAttribute('data-overlay-open', '');
  const shutter = page.locator('[data-shutter]');
  await expect(shutter).toHaveCSS('pointer-events', 'none');
  await expect(shutter).toHaveCSS('opacity', '0.3');
});
