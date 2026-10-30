import { expect, test } from '@playwright/test';

/**
 * The hero overlays are URL state: `?overlay=research|life|photography` opens a panel.
 * Below 640px the panel is a vaul bottom sheet, from 640px a docked right Radix dialog.
 * `panel` belongs to the slider script, so opening and closing a panel must never touch it.
 */

const PHONE = { width: 375, height: 812 };
const DESKTOP = { width: 1280, height: 800 };

test.use({ viewport: PHONE });

test('?overlay=research opens a bottom sheet on a phone', async ({ page }) => {
  await page.goto('/?overlay=research');
  const panel = page.locator('[data-overlay-panel]');
  await expect(panel).toBeVisible();
  await expect(panel).toHaveAttribute('data-overlay-variant', 'sheet');
  await expect(page.locator('[data-overlay-scrim]')).toBeVisible();
  await expect(page.locator('[data-overlay-read-more]')).toHaveAttribute('href', '/research');
});

test('?overlay=research opens a docked panel on a desktop', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto('/?overlay=research');
  const panel = page.locator('[data-overlay-panel]');
  await expect(panel).toBeVisible();
  await expect(panel).toHaveAttribute('data-overlay-variant', 'docked');
  await expect(page.locator('[data-overlay-scrim]')).toBeVisible();
});

test('the overlay marks the document and freezes the hero track', async ({ page }) => {
  await page.goto('/?overlay=research');
  await expect(page.locator('html')).toHaveAttribute('data-overlay-open', '');
  const track = page.locator('[data-focus-track]');
  await expect(track).toHaveAttribute('inert', '');
  await page.keyboard.press('Escape');
  await expect(page.locator('html')).not.toHaveAttribute('data-overlay-open', '');
  await expect(track).not.toHaveAttribute('inert', '');
});

test('Escape closes the overlay', async ({ page }) => {
  await page.goto('/?overlay=research');
  await expect(page.locator('[data-overlay-panel]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-overlay-panel]')).toBeHidden();
  await expect(page).not.toHaveURL(/overlay=/);
});

test('the close button closes the overlay', async ({ page }) => {
  await page.goto('/?overlay=research');
  await page.locator('[data-overlay-close]').click();
  await expect(page.locator('[data-overlay-panel]')).toBeHidden();
  await expect(page).not.toHaveURL(/overlay=/);
});

test('a scrim click closes the overlay', async ({ page }) => {
  await page.goto('/?overlay=research');
  await page.locator('[data-overlay-scrim]').click({ position: { x: 10, y: 10 } });
  await expect(page.locator('[data-overlay-panel]')).toBeHidden();
  await expect(page).not.toHaveURL(/overlay=/);
});

test('browser Back closes an overlay that was opened in page', async ({ page }) => {
  await page.goto('/');
  // The listener only exists once the island is hydrated.
  await expect(page.locator('html')).toHaveAttribute('data-overlay-ready', '');
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('ananthan:open-overlay', { detail: 'research' }));
  });
  await expect(page.locator('[data-overlay-panel]')).toBeVisible();
  await expect(page).toHaveURL(/overlay=research/);
  await page.goBack();
  await expect(page.locator('[data-overlay-panel]')).toBeHidden();
  await expect(page).not.toHaveURL(/overlay=/);
});

test('closing the overlay never changes the panel param', async ({ page }) => {
  await page.goto('/?panel=2&overlay=research');
  await expect(page.locator('[data-overlay-panel]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-overlay-panel]')).toBeHidden();
  await expect(page).toHaveURL(/[?&]panel=2(?:&|$)/);
});

test('the other two overlays open with their own link', async ({ page }) => {
  await page.goto('/?overlay=life');
  await expect(page.locator('[data-overlay-panel]')).toBeVisible();
  await expect(page.locator('[data-overlay-read-more]')).toHaveAttribute('href', '/life');
  await page.goto('/?overlay=photography');
  await expect(page.locator('[data-overlay-panel]')).toBeVisible();
  await expect(page.locator('[data-overlay-read-more]')).toHaveAttribute('href', '/photography');
});

test('an unknown overlay value opens nothing', async ({ page }) => {
  await page.goto('/?overlay=nope');
  await expect(page.locator('[data-overlay-panel]')).toHaveCount(0);
});
