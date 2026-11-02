import { expect, test } from '@playwright/test';

/**
 * The sound preload gate: `html[data-sound-ready]` flips once the sprite is decoded (or has
 * failed), and `?mute=1` silences the site. The gate is the contract the landing uses to hold
 * the shutter and the focus slider until sounds exist.
 */

/** Wait for the gate to reach a terminal state. */
const gateSettled = (page: import('@playwright/test').Page) =>
  page.waitForFunction(() => document.documentElement.dataset.soundReady !== undefined, {
    timeout: 10_000,
  });

/** Collect the `sound:ready` statuses fired on the page. */
const soundReadyKey = 'soundReadyStatuses';

/** Count the buffer sources the engine starts while a slice is triggered. The AudioContext is
 * created lazily on the first gesture, so the pointer event unlocks it before the play call. */
const countStarts = (target: import('@playwright/test').Page) =>
  target.evaluate(async () => {
    let starts = 0;
    const Ctor = window.AudioContext;
    window.AudioContext = class extends Ctor {
      createBufferSource() {
        starts += 1;
        return super.createBufferSource();
      }
    };
    window.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 50));
    window.sound?.play('shutter-fire');
    await new Promise((resolve) => setTimeout(resolve, 200));
    return starts;
  });

test('the gate flips to ready once the sprite is decoded', async ({ page }) => {
  await page.goto('/');
  await gateSettled(page);
  await expect(page.locator('html')).toHaveAttribute('data-sound-ready', '');
});

test('the gate fires one sound:ready event with the status', async ({ page }) => {
  await page.addInitScript((key) => {
    const store: string[] = [];
    window.localStorage.setItem(key, '');
    window.addEventListener('sound:ready', (event) => {
      const detail = (event as CustomEvent<{ status: string }>).detail;
      store.push(detail.status);
      window.localStorage.setItem(key, store.join(','));
    });
  }, soundReadyKey);
  await page.goto('/');
  await gateSettled(page);
  const statuses = await page.evaluate(
    (key) => localStorage.getItem(key)?.split(',').filter(Boolean),
    soundReadyKey,
  );
  expect(statuses).toEqual(['ready']);
  await page.evaluate((key) => localStorage.removeItem(key), soundReadyKey);
});

test('?mute=1 marks the document muted', async ({ page }) => {
  await page.goto('/?mute=1');
  await gateSettled(page);
  await expect(page.locator('html')).toHaveAttribute('data-sound-muted', '');
});

test('without ?mute=1 and no stored preference the document is not muted', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.removeItem('sound-muted'));
  await page.reload();
  await gateSettled(page);
  await expect(page.locator('html')).not.toHaveAttribute('data-sound-muted', /.+/);
});

test('?mute=1 suppresses playback, the unmuted page plays', async ({ page }) => {
  await page.goto('/?mute=1');
  await gateSettled(page);
  expect(await countStarts(page)).toBe(0);

  await page.goto('/');
  await page.evaluate(() => localStorage.removeItem('sound-muted'));
  await gateSettled(page);
  expect(await countStarts(page)).toBe(1);
});

test('the gate flips to failed when the sprite cannot be fetched, and the page stays usable', async ({
  page,
}) => {
  await page.route('**/audio/sprite.*', (route) => route.abort());
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-sound-ready', 'failed');
  // The site is not blocked by a missing sprite.
  await expect(page.locator('h1')).toHaveCount(1);
});

test('the stored mute preference survives a reload', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('sound-muted', '1'));
  await page.reload();
  await gateSettled(page);
  await expect(page.locator('html')).toHaveAttribute('data-sound-muted', '');
  await page.evaluate(() => localStorage.removeItem('sound-muted'));
});

test('window.sound exposes the gate and the mute state', async ({ page }) => {
  await page.goto('/');
  await gateSettled(page);
  const api = await page.evaluate(() => ({
    status: window.sound?.getStatus(),
    decoded: window.sound?.isDecoded(),
    muted: window.sound?.isMuted(),
    mutedByUrl: window.sound?.mutedByUrl(),
  }));
  expect(api).toEqual({ status: 'ready', decoded: true, muted: false, mutedByUrl: false });
});

test('the sprite manifest carries exactly the four licensed slices', async ({ page }) => {
  await page.goto('/');
  await gateSettled(page);
  const names = await page.evaluate(() => window.sound?.names() ?? []);
  expect(names).toEqual(['slider-detent', 'slider-settle', 'shutter-fire', 'shutter-release']);
  // The dropped slices must not linger in the runtime API: the owner removed them.
  for (const gone of ['locale-commit', 'panel-open', 'panel-close']) {
    expect(names).not.toContain(gone);
    expect(await page.evaluate((n) => window.sound?.has(n) ?? null, gone)).toBe(false);
  }
  for (const name of names) {
    expect(await page.evaluate((n) => window.sound?.has(n) ?? null, name)).toBe(true);
  }
});

test('the sprite is served with a cache-busting hash and stays under budget', async ({ page }) => {
  await page.goto('/');
  await gateSettled(page);
  const { url, bytes } = await page.evaluate(async () => {
    const u = window.sound?.spriteUrl() ?? '';
    const res = await fetch(u);
    return { url: u, bytes: (await res.arrayBuffer()).byteLength };
  });
  expect(url).toMatch(/\/audio\/sprite\.(mp3|ogg)\?v=[0-9a-f]{8}/);
  // 150 KB budget from .agents/docs/sound.md.
  expect(bytes).toBeLessThan(150 * 1024);
});
