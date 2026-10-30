import { expect, test } from '@playwright/test';

import { expectNoSeriousA11y } from '../fixtures/axe';

const ROUTES = ['/', '/research', '/life', '/photography'];

test('home loads with a title and one h1', async ({ page }) => {
  const res = await page.goto('/');
  expect(res?.status()).toBe(200);
  await expect(page).toHaveTitle(/Ananthan/);
  await expect(page.locator('h1')).toHaveCount(1);
});

for (const path of ROUTES) {
  for (const theme of ['light', 'dark']) {
    test(`${path} has no critical or serious axe violations (${theme})`, async ({ page }) => {
      await page.goto(`${path}?theme=${theme}`);
      await expectNoSeriousA11y(page, `${path} ${theme}`);
    });
  }
}

test.describe('agent-facing endpoints', () => {
  test('/llms.txt is served as text', async ({ request }) => {
    const res = await request.get('/llms.txt');
    expect(res.status()).toBe(200);
    expect(await res.text()).toContain('Ananthan Nambiar');
  });

  for (const path of ['/index.md', '/research.md', '/life.md', '/photography.md']) {
    test(`${path} is served as markdown`, async ({ request }) => {
      const res = await request.get(path);
      expect(res.status()).toBe(200);
      expect(res.headers()['content-type']).toContain('text/markdown');
      expect((await res.text()).length).toBeGreaterThan(50);
    });
  }
});
