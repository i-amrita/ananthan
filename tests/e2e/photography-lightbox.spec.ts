import { expect, test } from '@playwright/test';

/** The photography grid opens a native `<dialog>` lightbox. No library, so the dialog owns focus and Escape. */

test('the grid renders every photo', async ({ page }) => {
  await page.goto('/photography');
  await expect(page.locator('[data-photo-grid]')).toBeVisible();
  expect(await page.locator('[data-photo-thumb]').count()).toBeGreaterThan(0);
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
