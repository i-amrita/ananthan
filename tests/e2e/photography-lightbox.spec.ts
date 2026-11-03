import { expect, test } from '@playwright/test';

/** The photography grid opens a native `<dialog>` lightbox. No library, so the dialog owns focus and Escape. */

test('the grid renders every photo', async ({ page }) => {
  await page.goto('/photography');
  await expect(page.locator('[data-photo-grid]')).toBeVisible();
  expect(await page.locator('[data-photo-thumb]').count()).toBeGreaterThan(0);
});

test('each card renders the viewfinder corner marks', async ({ page }) => {
  await page.goto('/photography');
  const thumbs = page.locator('[data-photo-thumb]');
  const count = await thumbs.count();
  for (let i = 0; i < count; i++) {
    const frame = thumbs.nth(i).locator('.photo-frame');
    await expect(frame).toBeVisible();
    await expect(frame.locator('.pf-c')).toHaveCount(4);
  }
});

test('hovering a card raises the corner marks opacity', async ({ page }) => {
  await page.goto('/photography');
  const thumb = page.locator('[data-photo-thumb]').first();
  const mark = thumb.locator('.pf-c').first();
  const before = await mark.evaluate((el) => getComputedStyle(el).opacity);
  await thumb.hover();
  await page.waitForTimeout(400);
  const after = await mark.evaluate((el) => getComputedStyle(el).opacity);
  expect(Number(after)).toBeGreaterThan(Number(before));
});

test('clicking a thumbnail opens the dialog with that photo', async ({ page }) => {
  await page.goto('/photography');
  await page.locator('[data-photo-thumb]').first().click();
  await expect(page.locator('[data-photo-dialog]')).toBeVisible();
  await expect(page.locator('[data-photo-full]')).toBeVisible();
  await expect(page.locator('[data-photo-counter]')).toContainText('1 of');
});

test('the next and previous buttons move between frames', async ({ page }) => {
  await page.goto('/photography');
  await page.locator('[data-photo-thumb]').first().click();
  await expect(page.locator('[data-photo-counter]')).toContainText('1 of');
  await page.getByRole('button', { name: 'Next photo' }).click();
  await expect(page.locator('[data-photo-counter]')).toContainText('2 of');
  await page.getByRole('button', { name: 'Previous photo' }).click();
  await expect(page.locator('[data-photo-counter]')).toContainText('1 of');
});

test('arrow keys move between frames', async ({ page }) => {
  await page.goto('/photography');
  await page.locator('[data-photo-thumb]').first().click();
  await page.locator('[data-photo-dialog]').press('ArrowRight');
  await expect(page.locator('[data-photo-counter]')).toContainText('2 of');
  await page.locator('[data-photo-dialog]').press('ArrowLeft');
  await expect(page.locator('[data-photo-counter]')).toContainText('1 of');
});

test('the close button closes the dialog', async ({ page }) => {
  await page.goto('/photography');
  await page.locator('[data-photo-thumb]').first().click();
  await expect(page.locator('[data-photo-dialog]')).toBeVisible();
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(page.locator('[data-photo-dialog]')).toBeHidden();
});

test('Escape closes the dialog', async ({ page }) => {
  await page.goto('/photography');
  await page.locator('[data-photo-thumb]').first().click();
  await expect(page.locator('[data-photo-dialog]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-photo-dialog]')).toBeHidden();
});

test('the counter reads "index of total"', async ({ page }) => {
  await page.goto('/photography');
  const total = await page.locator('[data-photo-thumb]').count();
  await page.locator('[data-photo-thumb]').first().click();
  await expect(page.locator('[data-photo-counter]')).toHaveText(`1 of ${total}`);
});
