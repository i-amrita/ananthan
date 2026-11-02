import { expect, type Page, test } from '@playwright/test';

/**
 * Slider activation: a tap on the focused panel opens its drawer, a tap on a neighbour only
 * focuses it, Enter opens the focused panel, and a drag release never opens anything.
 * The Intro panel has no drawer: activating it advances to panel 1.
 */

test.use({ viewport: { width: 1280, height: 800 } });

const focused = (page: Page, n: number) =>
  expect(page.locator('[data-focus-panel]').nth(n)).toHaveAttribute('data-focused', '');

/** A fast horizontal drag, so the release counts as a flick (never a tap). */
async function flick(page: Page, dir: 'next' | 'prev') {
  const from = dir === 'next' ? 900 : 300;
  const to = dir === 'next' ? 300 : 900;
  await page.mouse.move(from, 400);
  await page.mouse.down();
  await page.mouse.move((from + to) / 2, 400, { steps: 3 });
  await page.mouse.move(to, 400, { steps: 3 });
  await page.mouse.up();
}

async function ready(page: Page, url: string) {
  await page.goto(url);
  await expect(page.locator('html')).toHaveAttribute('data-overlay-ready', '');
}

test('flick to panel 2, tap to open, panel survives open and close', async ({ page }) => {
  await ready(page, '/');
  await flick(page, 'next');
  await focused(page, 1);
  await flick(page, 'next');
  await focused(page, 2);
  await expect(page).toHaveURL(/panel=2/);
  await expect(page.locator('html')).not.toHaveAttribute('data-overlay-open', '');

  await page.mouse.click(640, 300);
  await expect(page.locator('[data-overlay-panel]')).toBeVisible();
  await expect(page).toHaveURL(/overlay=photography/);
  await expect(page).toHaveURL(/panel=2/);

  await page.keyboard.press('Escape');
  await expect(page.locator('[data-overlay-panel]')).toHaveCount(0);
  await expect(page).toHaveURL(/panel=2/);
  await expect(page).not.toHaveURL(/overlay=/);
});

test('a tap on a non-focused panel only focuses it', async ({ page }) => {
  await ready(page, '/?panel=1');
  await focused(page, 1);
  // The right 80px of the viewport shows nothing of panel 2 at full-bleed, so tap the panel via the DOM point.
  await page.evaluate(() => {
    const t = document.querySelector<HTMLElement>('[data-focus-track]')!;
    t.style.scrollSnapType = 'none';
    t.scrollLeft = t.clientWidth * 1.3;
  });
  await page.mouse.click(1100, 300);
  await focused(page, 2);
  await expect(page.locator('[data-overlay-panel]')).toHaveCount(0);
  await expect(page).not.toHaveURL(/overlay=/);
});

test('Enter on the track opens the focused panel', async ({ page }) => {
  await ready(page, '/?panel=1');
  await focused(page, 1);
  await page.locator('[data-focus-track]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-overlay-panel]')).toBeVisible();
  await expect(page).toHaveURL(/overlay=research/);
  await expect(page).toHaveURL(/panel=1/);
});

test('releasing a drag never opens an overlay', async ({ page }) => {
  await ready(page, '/?panel=1');
  await flick(page, 'next');
  await focused(page, 2);
  // A slow drag that ends where it started is not a tap either.
  await page.mouse.move(600, 400);
  await page.mouse.down();
  await page.mouse.move(520, 400, { steps: 5 });
  await page.mouse.move(600, 400, { steps: 5 });
  await page.mouse.up();
  await expect(page.locator('[data-overlay-panel]')).toHaveCount(0);
  await expect(page).not.toHaveURL(/overlay=/);
});

test('tapping the intro advances to panel 1', async ({ page }) => {
  await ready(page, '/');
  await focused(page, 0);
  // The top area of the intro panel, clear of the social links and the tagline.
  await page.mouse.click(640, 200);
  await focused(page, 1);
  await expect(page).toHaveURL(/panel=1/);
  await expect(page.locator('[data-overlay-panel]')).toHaveCount(0);
});

test('tapping a social link never opens a drawer', async ({ page }) => {
  await ready(page, '/');
  await page.locator('[data-focus-panel]').first().locator('.focus-social').first().click();
  await expect(page.locator('[data-overlay-panel]')).toHaveCount(0);
  await expect(page).not.toHaveURL(/overlay=/);
  // The click lands on the real link target (off-site), so the page URL stays on the hero.
  await expect(page).not.toHaveURL(/panel=/);
});

test('the live region announces the focused panel and the readout follows', async ({ page }) => {
  await ready(page, '/');
  const live = page.locator('[data-focus-live]');
  const value = page.locator('[data-focus-value]');
  await expect(live).toHaveAttribute('aria-live', 'polite');
  await expect(live).toHaveText('Intro');
  await expect(value).toHaveText('0.30');
  await page.locator('[data-focus-track]').focus();
  await page.keyboard.press('ArrowRight');
  await expect(live).toHaveText('Research');
  await expect(value).toHaveText('0.50');
  await page.keyboard.press('End');
  await expect(live).toHaveText('Life');
  await expect(value).toHaveText('1.00');
});

test('tapping a ruler stop jumps to that panel', async ({ page }) => {
  await ready(page, '/');
  await page.locator('[data-stop="2"]').click();
  await focused(page, 2);
  await expect(page.locator('[data-focus-value]')).toHaveText('0.70');
});
