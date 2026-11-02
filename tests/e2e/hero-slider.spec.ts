import { expect, test } from '@playwright/test';

/**
 * The home hero is a four-panel focus slider on a native scroll-snap track.
 * These tests cover the keyboard path, the dot buttons and the `?panel=` URL state,
 * because every visible state has to be reachable as a static URL.
 */

const PANEL_COUNT = 4;

test('the hero renders one panel per focus area', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-focus-track]')).toBeVisible();
  await expect(page.locator('[data-focus-panel]')).toHaveCount(PANEL_COUNT);
  await expect(page.locator('[data-focus-panel] .focus-photo img')).toHaveCount(PANEL_COUNT);
});

test('the first panel is focused on load and carries no panel param', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-focus-panel][data-focused]')).toHaveCount(1);
  await expect(page.locator('[data-focus-panel]').first()).toHaveAttribute('data-focused', '');
  await expect(page).not.toHaveURL(/panel=/);
});

test('ArrowRight moves the focus to the next panel', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-focus-track]').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('[data-focus-panel]').nth(1)).toHaveAttribute('data-focused', '');
  await expect(page).toHaveURL(/panel=1/);
});

test('ArrowLeft returns to the previous panel and drops the param at the first one', async ({
  page,
}) => {
  await page.goto('/');
  await page.locator('[data-focus-track]').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page).toHaveURL(/panel=1/);
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('[data-focus-panel]').first()).toHaveAttribute('data-focused', '');
  await expect(page).not.toHaveURL(/panel=/);
});

test('End jumps to the last panel and Home back to the first', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-focus-track]').focus();
  await page.keyboard.press('End');
  await expect(page.locator('[data-focus-panel]').nth(PANEL_COUNT - 1)).toHaveAttribute(
    'data-focused',
    '',
  );
  await expect(page).toHaveURL(new RegExp(`[?&]panel=${PANEL_COUNT - 1}(?:&|$)`));
  await page.keyboard.press('Home');
  await expect(page.locator('[data-focus-panel]').first()).toHaveAttribute('data-focused', '');
  await expect(page).not.toHaveURL(/panel=/);
});

test('the progress bar fills to (focused + 1) / 4', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-focus-progress-fill]')).toHaveCSS('--progress', '0.25');
  await page.locator('[data-focus-track]').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('[data-focus-progress-fill]')).toHaveCSS('--progress', '0.5');
  await expect(page).toHaveURL(/panel=1/);
});

test('?panel= restores that panel on load', async ({ page }) => {
  await page.goto('/?panel=2');
  await expect(page.locator('[data-focus-panel]').nth(2)).toHaveAttribute('data-focused', '');
  await expect(page.locator('[data-focus-progress-fill]')).toHaveCSS('--progress', '0.75');
});

test('?panel=9 is clamped to the last panel', async ({ page }) => {
  await page.goto('/?panel=9');
  await expect(page.locator('[data-focus-panel]').nth(PANEL_COUNT - 1)).toHaveAttribute(
    'data-focused',
    '',
  );
});

test('each panel links into its route', async ({ page }) => {
  await page.goto('/');
  const hrefs = await page
    .locator('[data-focus-panel] .focus-cta')
    .evaluateAll((els) => els.map((e) => e.getAttribute('href')));
  expect(hrefs).toEqual(['/life', '/research', '/life', '/photography']);
});

test('the slider still exposes the links without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('[data-focus-panel] .focus-cta')).toHaveCount(PANEL_COUNT);
  await context.close();
});
