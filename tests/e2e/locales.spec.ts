import { expect, test } from '@playwright/test';

test('invalid locale falls back to english', async ({ page }) => {
  const res = await page.goto('/?locale=xx');
  expect(res?.status()).toBe(200);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('/?locale=es sets html lang and translates the nav', async ({ page }) => {
  await page.goto('/?locale=es&nav=open');
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  await expect(page.getByRole('link', { name: 'Investigación' })).toBeVisible();
});

test('/?locale=ml translates the nav and sets lang', async ({ page }) => {
  await page.goto('/?locale=ml&nav=open');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ml');
  await expect(page.getByRole('link', { name: 'ജീവിതം' })).toBeVisible();
});

test('/?locale=hi translates the research route headings', async ({ page }) => {
  await page.goto('/research?locale=hi');
  await expect(page.locator('html')).toHaveAttribute('lang', 'hi');
  await expect(page.getByRole('heading', { name: 'प्रकाशनें' })).toBeVisible();
});

test('the locale switch keeps the other URL params', async ({ page }) => {
  await page.goto('/?theme=dark');
  await page.waitForFunction(() => !document.querySelector('astro-island[ssr]'));
  await page.getByRole('navigation').getByRole('button', { name: 'EN Choose language' }).click();
  await page.getByRole('option', { name: 'Español' }).click();
  await expect(page).toHaveURL(/locale=es/);
  await expect(page).toHaveURL(/theme=dark/);
});

test('a chosen locale is persisted and restored on the next visit', async ({ page }) => {
  await page.goto('/?locale=es&nav=open');
  await page.waitForFunction(() => !document.querySelector('astro-island[ssr]'));
  await expect.poll(() => page.evaluate(() => localStorage.getItem('locale'))).toBe('es');
  await page.goto('/');
  await expect(page).toHaveURL(/locale=es/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  // An explicit param wins over the stored choice.
  await page.goto('/?locale=ms');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ms');
});
