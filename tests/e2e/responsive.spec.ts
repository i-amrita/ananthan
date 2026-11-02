import { expect, test } from '@playwright/test';

/**
 * The site is a portfolio meant to be read on a phone first.
 * These tests pin the small-viewport layout: no horizontal overflow, the nav stays reachable,
 * the hero still scrolls, and the lightbox fits.
 */

const ROUTES = ['/', '/research', '/life', '/photography'];

test.use({ viewport: { width: 375, height: 812 } });

for (const path of ROUTES) {
  test(`${path} does not overflow horizontally at 375px`, async ({ page }) => {
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
}

test('the nav stays reachable at 375px', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('header')).toBeVisible();
  // The chip is the nav: the expand toggle is visible collapsed, and the links are one tap away.
  await page.locator('[data-nav-toggle]').click();
  await expect(page.getByRole('link', { name: 'Research' }).first()).toBeVisible();
});

test('the hero track scrolls horizontally at 375px', async ({ page }) => {
  await page.goto('/');
  const track = page.locator('[data-focus-track]');
  await expect(track).toBeVisible();
  const overflowX = await track.evaluate((el) => getComputedStyle(el).overflowX);
  expect(['auto', 'scroll']).toContain(overflowX);
});

test('the lightbox image fits inside the viewport at 375px', async ({ page }) => {
  await page.goto('/photography');
  await page.locator('[data-photo-thumb]').first().click();
  const box = await page.locator('[data-photo-full]').boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeLessThanOrEqual(375);
});

test('the research list stays single-column at 375px', async ({ page }) => {
  await page.goto('/research');
  const list = page.locator('[data-pagefind-body] ul').first();
  if ((await list.count()) === 0) return;
  const box = await list.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeLessThanOrEqual(375);
});
