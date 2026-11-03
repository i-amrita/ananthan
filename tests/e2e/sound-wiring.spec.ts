import { expect, type Page, test } from '@playwright/test';

/**
 * The sound wiring on the landing: the focus slider and the shutter are held until the sprite
 * is decoded, and both make sound afterwards.
 *
 * The gate has one source of truth, the `data-sound-ready` attribute on `<html>`. The CSS reads
 * it, so the hold is correct before hydration, and the DOM gate applies `inert` and
 * `aria-disabled` from the same attribute.
 *
 * The engine logs every requested slice on `window.sound.calls()`, so the specs assert which
 * sound was asked for without touching `AudioContext`, which the autoplay gate makes unreliable.
 */

/** The controls the gate holds. */
const HELD = ['[data-focus-track]', '[data-focus-ruler]', '[data-shutter]'] as const;

/** Wait for the gate to reach a terminal state. */
const gateSettled = (page: Page) =>
  page.waitForFunction(() => document.documentElement.dataset.soundReady !== undefined, {
    timeout: 15_000,
  });

/** The slices requested so far, oldest first. */
const calls = (page: Page) => page.evaluate(() => (window.sound?.calls() ?? []).map((c) => c.name));

/** Forget the calls so far. */
const resetCalls = (page: Page) => page.evaluate(() => window.sound?.resetCalls());

/** The gate state, as the DOM sees it. */
const gateState = (page: Page) => page.evaluate(() => document.documentElement.dataset.soundReady);

/** Delay the sprite so the gate is still loading when the page is asserted. */
async function delaySprite(page: Page, ms = 3000) {
  await page.route('**/audio/sprite.*', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, ms));
    await route.continue();
  });
}

test.describe('the gate holds the landing controls', () => {
  test.use({ viewport: { width: 375, height: 812 } });
  test('loading disables the slider and the shutter', async ({ page }) => {
    await delaySprite(page);
    await page.goto('/');
    // The gate is still loading: the attribute is not set yet.
    await expect(page.locator('html')).not.toHaveAttribute('data-sound-ready', /.+/);
    for (const sel of HELD) {
      await expect(page.locator(sel)).toHaveAttribute('inert', '');
      await expect(page.locator(sel)).toHaveAttribute('aria-disabled', 'true');
      await expect(page.locator(sel)).toHaveCSS('pointer-events', 'none');
    }
  });

  test('ready releases the slider and the shutter', async ({ page }) => {
    await page.goto('/');
    await gateSettled(page);
    expect(await gateState(page)).toBe('');
    for (const sel of HELD) {
      await expect(page.locator(sel)).not.toHaveAttribute('inert', /.+/);
      await expect(page.locator(sel)).not.toHaveAttribute('aria-disabled', /.+/);
      await expect(page.locator(sel)).toHaveCSS('pointer-events', 'auto');
    }
  });

  test('a failed sprite releases the slider and the shutter', async ({ page }) => {
    await page.route('**/audio/sprite.*', (route) => route.abort());
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-sound-ready', 'failed');
    for (const sel of HELD) {
      await expect(page.locator(sel)).not.toHaveAttribute('inert', /.+/);
      await expect(page.locator(sel)).not.toHaveAttribute('aria-disabled', /.+/);
      await expect(page.locator(sel)).toHaveCSS('pointer-events', 'auto');
    }
  });

  test('?mute=1 releases the controls without waiting for the sprite', async ({ page }) => {
    await delaySprite(page);
    await page.goto('/?mute=1');
    await expect(page.locator('html')).toHaveAttribute('data-sound-muted', '');
    // The sprite is still loading, but a muted site never waits for it.
    for (const sel of HELD) {
      await expect(page.locator(sel)).not.toHaveAttribute('inert', /.+/);
      await expect(page.locator(sel)).toHaveCSS('pointer-events', 'auto');
    }
  });

  test('the held controls are out of the tab order and unreachable', async ({ page }) => {
    await delaySprite(page);
    await page.goto('/');
    const shutter = page.locator('[data-shutter]');
    await expect(shutter).toHaveAttribute('inert', '');
    // `inert` removes the control from the tab order.
    await page.locator('body').press('Tab');
    await expect(shutter).not.toBeFocused();
  });
});

test.describe('the slider makes sound', () => {
  // The narrow viewport makes one wheel notch cross a whole stop, so the specs do not depend
  // on the platform wheel delta.
  test.use({ viewport: { width: 375, height: 812 } });
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await gateSettled(page);
    await resetCalls(page);
  });

  test('a keyboard crossing ticks and then settles', async ({ page }) => {
    await page.locator('[data-focus-track]').focus();
    await page.keyboard.press('ArrowRight');
    await expect
      .poll(() => calls(page), { timeout: 5000 })
      .toEqual(['slider-detent', 'slider-settle']);
  });

  test('the detent always comes before the settle', async ({ page }) => {
    await page.locator('[data-focus-track]').focus();
    await page.keyboard.press('ArrowRight');
    // Let the first crossing land before asking for the second, so the second crossing is not
    // swallowed by the rate limit: two gestures, two landings.
    await expect
      .poll(() => calls(page), { timeout: 5000 })
      .toEqual(['slider-detent', 'slider-settle']);
    await resetCalls(page);
    await page.keyboard.press('ArrowRight');
    await expect
      .poll(() => calls(page), { timeout: 5000 })
      .toEqual(['slider-detent', 'slider-settle']);
  });

  test('a wheel crossing ticks and settles', async ({ page }) => {
    const box = await page.locator('[data-focus-track]').boundingBox();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    // More than one viewport width, so the scroll-snap track has to cross a stop.
    await page.mouse.wheel(900, 0);
    await expect
      .poll(() => calls(page), { timeout: 5000 })
      .toEqual(['slider-detent', 'slider-settle']);
  });

  test('a drag across stops ticks once per crossing', async ({ page }) => {
    const box = await page.locator('[data-focus-track]').boundingBox();
    await page.mouse.move(box!.x + box!.width * 0.9, box!.y + box!.height / 2);
    await page.mouse.down();
    for (let i = 0; i < 10; i++) {
      await page.mouse.move(box!.x + box!.width * (0.9 - i * 0.07), box!.y + box!.height / 2);
      await page.waitForTimeout(30);
    }
    await page.mouse.up();
    await expect.poll(() => calls(page), { timeout: 5000 }).toContain('slider-detent');
    const detents = (await calls(page)).filter((c) => c === 'slider-detent');
    // A drag over two stops crosses two boundaries: two ticks, not one per frame.
    expect(detents.length).toBeLessThanOrEqual(3);
    expect(detents.length).toBeGreaterThanOrEqual(1);
  });

  test('a tap on a ruler stop ticks and settles', async ({ page }) => {
    await page.locator('[data-stop="2"]').click();
    await expect.poll(() => calls(page), { timeout: 5000 }).toContain('slider-detent');
    await expect.poll(() => calls(page), { timeout: 5000 }).toContain('slider-settle');
  });

  test('the initial load and the URL restore are silent', async ({ page }) => {
    await page.goto('/');
    await gateSettled(page);
    await page.waitForTimeout(500);
    expect(await calls(page)).toEqual([]);

    await page.goto('/?panel=2');
    await gateSettled(page);
    await page.waitForTimeout(800);
    expect(await calls(page)).toEqual([]);
  });
});

test.describe('the shutter makes sound', () => {
  test.use({ viewport: { width: 375, height: 812 } });
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await gateSettled(page);
    await resetCalls(page);
  });

  test('the press fires and the release lands', async ({ page }) => {
    await page.locator('[data-shutter]').click();
    await expect.poll(() => calls(page), { timeout: 5000 }).toContain('shutter-fire');
    await expect.poll(() => calls(page), { timeout: 5000 }).toContain('shutter-release');
  });

  test('the locale commit releases the shutter', async ({ page }) => {
    await page.locator('[data-shutter]').click();
    await page.getByRole('option', { name: 'Español' }).click();
    await expect.poll(() => calls(page), { timeout: 5000 }).toContain('shutter-release');
    await expect(page).toHaveURL(/locale=es/);
  });

  test('a muted site stays silent', async ({ page }) => {
    await page.goto('/?mute=1');
    await gateSettled(page);
    await resetCalls(page);
    // The call log records the requests; the engine drops a muted play before it reaches the
    // context. Counting the buffer sources is what proves the silence.
    const starts = await page.evaluate(async () => {
      const Ctor = window.AudioContext;
      let count = 0;
      window.AudioContext = class extends Ctor {
        createBufferSource() {
          count += 1;
          return super.createBufferSource();
        }
      };
      window.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 50));
      window.sound?.play('shutter-fire');
      await new Promise((resolve) => setTimeout(resolve, 200));
      return count;
    });
    expect(starts).toBe(0);
    // The controls still work: a muted site is silent, not broken.
    await page.locator('[data-shutter]').click();
    await expect(page.locator('[role="listbox"]')).toBeVisible();
  });
});
