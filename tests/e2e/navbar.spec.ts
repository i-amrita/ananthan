import { expect, test } from '@playwright/test';

/** The nav chip: three icons (locale, theme, expand). Expanding reveals the route links inline; `?nav=open` is the URL state. */

test.use({ viewport: { width: 375, height: 812 } });

const links = (page: import('@playwright/test').Page) => page.locator('[data-nav-links]');
const toggle = (page: import('@playwright/test').Page) => page.locator('[data-nav-toggle]');

async function ready(page: import('@playwright/test').Page) {
  await page.waitForFunction(() => !document.querySelector('astro-island[ssr]'));
}

test('the chip is collapsed by default and expands inline', async ({ page }) => {
  await page.goto('/');
  await ready(page);
  await expect(links(page)).toBeHidden();
  await expect(toggle(page)).toHaveAttribute('aria-expanded', 'false');
  await toggle(page).click();
  await expect(links(page)).toBeVisible();
  await expect(toggle(page)).toHaveAttribute('aria-expanded', 'true');
  await expect(page).toHaveURL(/nav=open/);
  await expect(links(page).getByRole('link', { name: 'Research' })).toBeVisible();
  await toggle(page).click();
  await expect(links(page)).toBeHidden();
  await expect(page).not.toHaveURL(/nav=open/);
});

test('Escape collapses the chip and returns focus to the expand button', async ({ page }) => {
  await page.goto('/?nav=open');
  await ready(page);
  await links(page).getByRole('link', { name: 'Life' }).focus();
  await page.keyboard.press('Escape');
  await expect(links(page)).toBeHidden();
  await expect(toggle(page)).toBeFocused();
});

test('?nav=open deep link loads expanded with the active route marked', async ({ page }) => {
  await page.goto('/research?nav=open');
  await ready(page);
  await expect(links(page)).toBeVisible();
  await expect(page.locator('[data-nav-links] a[aria-current="page"]')).toHaveText('Research');
});

test('tab order is locale, theme, expand, then the links', async ({ page }) => {
  await page.goto('/?nav=open');
  await ready(page);
  const nav = page.locator('[data-site-nav]');
  await nav.getByRole('button').first().focus();
  const seen: string[] = [];
  for (let i = 0; i < 6; i++) {
    seen.push(
      await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        return el?.hasAttribute('data-nav-toggle') ? 'toggle' : (el?.tagName.toLowerCase() ?? '');
      }),
    );
    await page.keyboard.press('Tab');
  }
  // locale button, theme button, expand toggle, then the four links (home, research, ...).
  expect(seen).toEqual(['button', 'button', 'toggle', 'a', 'a', 'a']);
});

test('collapsed links are not focusable', async ({ page }) => {
  await page.goto('/');
  await ready(page);
  const focusable = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('[data-nav-links] a')].map((a) => {
      a.focus();
      return document.activeElement === a;
    }),
  );
  expect(focusable.every((f) => !f)).toBe(true);
});

test('opening an overlay collapses the chip', async ({ page }) => {
  await page.goto('/?nav=open&overlay=research');
  await ready(page);
  await expect(page.locator('[data-overlay-panel]')).toBeVisible();
  await expect(page).not.toHaveURL(/nav=open/);
  await expect(links(page)).toBeHidden();
});

test('every chip control is at least 44px and nothing overflows at 375px', async ({ page }) => {
  await page.goto('/?nav=open');
  await ready(page);
  const sizes = await page.locator('[data-site-nav] a, [data-site-nav] button').evaluateAll((els) =>
    els.map((el) => {
      const r = el.getBoundingClientRect();
      return Math.min(r.width, r.height);
    }),
  );
  for (const s of sizes) expect(s).toBeGreaterThanOrEqual(44);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  const fixed = await page
    .locator('[data-site-nav]')
    .evaluate((el) => getComputedStyle(el).position);
  expect(fixed).toBe('fixed');
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('the route links are rendered expanded', async ({ page }) => {
    await page.goto('/');
    await expect(links(page).getByRole('link', { name: 'Research' })).toBeVisible();
    await expect(links(page).getByRole('link', { name: 'Photography' })).toBeVisible();
  });
});
