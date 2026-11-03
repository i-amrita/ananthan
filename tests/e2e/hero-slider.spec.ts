import { expect, test } from '@playwright/test';

/**
 * The home hero is a four-panel focus slider on a native scroll-snap track.
 * The panel order is Intro, Research, Photography, Life.
 * These tests cover the keyboard path, the ruler stops and the `?panel=` URL state,
 * because every visible state has to be reachable as a static URL.
 */

const PANEL_COUNT = 4;
const PANEL_ROUTES = ['home', 'research', 'photography', 'life'];

test('the hero renders one panel per focus area', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-focus-track]')).toBeVisible();
  await expect(page.locator('[data-focus-panel]')).toHaveCount(PANEL_COUNT);
});

test('the panels are Intro, Research, Photography and Life, in that order', async ({ page }) => {
  await page.goto('/');
  const routes = await page
    .locator('[data-focus-panel]')
    .evaluateAll((els) => els.map((e) => e.getAttribute('data-route')));
  expect(routes).toEqual(PANEL_ROUTES);
});

test('the landing carries no background photograph, scrim or viewfinder', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.focus-photo')).toHaveCount(0);
  await expect(page.locator('.focus-scrim')).toHaveCount(0);
  await expect(page.locator('.viewfinder')).toHaveCount(0);
  await expect(page.locator('.focus-vignette')).toHaveCount(0);
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

test('the intro panel has no CTA, the other three link into their route', async ({ page }) => {
  await page.goto('/');
  const hrefs = await page
    .locator('[data-focus-panel] .focus-cta')
    .evaluateAll((els) => els.map((e) => e.getAttribute('href')));
  expect(hrefs).toEqual(['/research', '/photography', '/life']);
});

test('the intro panel carries the social links as icon-only anchors', async ({ page }) => {
  await page.goto('/');
  const links = page.locator('[data-focus-panel]').first().locator('.focus-social');
  await expect(links).toHaveCount(3);
  const hrefs = await links.evaluateAll((els) => els.map((e) => e.getAttribute('href')));
  expect(hrefs).toEqual([
    'https://scholar.google.com/citations?user=cQZWTbMAAAAJ&hl=en&oi=ao',
    'https://orcid.org/0000-0002-9767-9456',
    'https://instagram.com/filmi.nambi',
  ]);
  // Icon-only: every link has an accessible name but no visible text.
  for (const name of await links.evaluateAll((els) =>
    els.map((e) => e.getAttribute('aria-label')),
  )) {
    expect(name).toBeTruthy();
  }
  expect(await links.first().innerText()).toBe('');
});

test('the slider still exposes the links without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('[data-focus-panel] .focus-cta')).toHaveCount(PANEL_COUNT - 1);
  await expect(page.locator('[data-focus-panel]').first().locator('.focus-social')).toHaveCount(3);
  await context.close();
});

test('the content is sharp on a stop and blurred between stops', async ({ page }) => {
  await page.goto('/?panel=1');
  const blurOf = (index: number) =>
    page.evaluate((i) => {
      const el = document.querySelectorAll<HTMLElement>('[data-focus-content]')[i];
      return el ? getComputedStyle(el).filter : '';
    }, index);
  // On a stop the focused panel has no blur at all.
  await expect.poll(() => blurOf(1)).toBe('blur(0px)');
  // Drag half way between stop 0 and stop 1: both contents blur.
  await page.mouse.move(900, 400);
  await page.mouse.down();
  await page.mouse.move(620, 400, { steps: 8 });
  await page.waitForTimeout(300);
  const mid = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('[data-focus-content]')].map((el) =>
      el.style.getPropertyValue('--focus-blur'),
    ),
  );
  expect(Number.parseFloat(mid[0] ?? '0')).toBeGreaterThan(0);
  expect(Number.parseFloat(mid[1] ?? '0')).toBeGreaterThan(0);
  await page.mouse.up();
});

test('the navbar, the ruler and the shutter stay outside the blurred layer', async ({ page }) => {
  await page.goto('/');
  const outside = await page.evaluate(() => {
    const contents = [...document.querySelectorAll<HTMLElement>('[data-focus-content]')];
    const inside = (el: Element | null) => el !== null && contents.some((c) => c.contains(el));
    return {
      nav: inside(document.querySelector('[data-site-nav]')),
      ruler: inside(document.querySelector('[data-focus-ruler]')),
      shutter: inside(document.querySelector('[data-shutter]')),
    };
  });
  expect(outside).toEqual({ nav: false, ruler: false, shutter: false });
});

test('the ruler shows distance ticks and the focus readout, no section names', async ({ page }) => {
  await page.goto('/');
  // Round-2b correction: section names and stop numbers are dropped; the distance ticks,
  // the needle and the live readout stay.
  const nums = await page
    .locator('[data-stop] .ruler-num')
    .evaluateAll((els) => els.map((e) => e.textContent?.trim()));
  expect(nums).toEqual(['0.30', '0.50', '0.70', '1.00']);
  await expect(page.locator('.ruler-label')).toHaveCount(0);
  await expect(page.locator('[data-focus-ruler] .ruler-readout')).toContainText('0.30');
  // The needle is painted.
  await expect(page.locator('.ruler-needle')).toBeVisible();
  // Section names remain only in the aria/live text.
  const labels = await page
    .locator('[data-stop]')
    .evaluateAll((els) => els.map((e) => e.getAttribute('data-label')));
  expect(labels).toEqual(['Intro', 'Research', 'Photography', 'Life']);
  await page.locator('[data-focus-track]').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('[data-focus-live]')).toHaveText('Research');
  // The readout tracks the focus distance.
  await expect(page.locator('[data-focus-value]')).toHaveText('0.50');
});

test('the panels carry no visible panel index', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.focus-index')).toHaveCount(0);
  const copy = await page.locator('[data-focus-panel]').allInnerTexts();
  for (const text of copy) expect(text).not.toMatch(/\d\d\s*\/\s*0?4/);
});
