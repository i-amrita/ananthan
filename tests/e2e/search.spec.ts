import { expect, test } from '@playwright/test';

test('pagefind index is built', async ({ request }) => {
  const res = await request.get('/pagefind/pagefind.js');
  expect(res.status()).toBe(200);
});

test('/search?q=protein lists results in keyword mode', async ({ page }) => {
  await page.goto('/search?q=protein&mode=keyword');
  await expect(page.getByRole('textbox').first()).toHaveValue('protein');
  await expect(page.locator('[data-search-results] li').first()).toBeVisible();
});

test('the search page toggles between AI and keyword mode via ?mode=', async ({ page }) => {
  await page.goto('/search?q=protein');
  const ai = page.getByRole('button', { name: 'AI', exact: true });
  const keyword = page.getByRole('button', { name: 'Keyword', exact: true });
  await expect(ai).toHaveAttribute('aria-pressed', 'true');
  await keyword.click();
  await expect(page).toHaveURL(/mode=keyword/);
  await expect(keyword).toHaveAttribute('aria-pressed', 'true');
  await ai.click();
  await expect(page).toHaveURL(/mode=ai/);
});

test('an empty query shows the hint, not results', async ({ page }) => {
  await page.goto('/search');
  await expect(page.locator('[data-search-results]')).toHaveCount(0);
});
