import { expect, test } from '@playwright/test';

/**
 * Overlay motion (steer item 3). The panel shell animates open and closed: the sheet slides
 * vertically below 640px, the dock slides horizontally from 640px, and the scrim fades. Radix
 * Presence keeps the closing panel mounted until `animationend`, so the exit must be observable.
 * Under `prefers-reduced-motion` both variants collapse to a short opacity crossfade.
 *
 * The animation events are recorded from an init script: the exit window is a few hundred
 * milliseconds wide, so polling for it from the test body is a race.
 */

const PHONE = { width: 375, height: 812 };
const DESKTOP = { width: 1280, height: 800 };

interface MotionEvent {
  name: string;
  phase: 'start' | 'end';
  target: 'panel' | 'scrim';
  transform: string;
  opacity: string;
}

async function ready(page: import('@playwright/test').Page) {
  await page.waitForFunction(() => !document.querySelector('astro-island[ssr]'));
}

/**
 * Records every animation on the overlay panel and its scrim.
 *
 * The init script runs in an isolated browser scope, so the helper it needs is defined inside it
 * rather than imported.
 */
async function recordMotion(page: import('@playwright/test').Page) {
  await page.context().addInitScript(() => {
    const log: MotionEvent[] = [];
    (window as unknown as { motion: MotionEvent[] }).motion = log;
    for (const phase of ['start', 'end'] as const) {
      document.addEventListener(
        `animation${phase}`,
        (event) => {
          const animation = event as AnimationEvent;
          const node = animation.target;
          if (!(node instanceof Element)) return;
          const target: MotionEvent['target'] | null = node.matches('[data-overlay-panel]')
            ? 'panel'
            : node.matches('[data-overlay-scrim]')
              ? 'scrim'
              : null;
          if (!target) return;
          const style = getComputedStyle(node);
          log.push({
            name: animation.animationName,
            phase,
            target,
            transform: style.transform,
            opacity: style.opacity,
          });
        },
        true,
      );
    }
  });
}

const motion = (page: import('@playwright/test').Page) =>
  page.evaluate(() => (window as unknown as { motion: MotionEvent[] }).motion ?? []);

async function openOverlay(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('ananthan:open-overlay', { detail: 'research' }));
  });
  await expect(page.locator('[data-overlay-panel]')).toBeVisible();
}

test.use({ viewport: PHONE });

test('the sheet slides in on open and keeps animating on close (phone)', async ({ page }) => {
  await recordMotion(page);
  await page.goto('/');
  await ready(page);
  await openOverlay(page);

  // Open: the panel slides up from below the viewport.
  const opened = await page.evaluate(() => {
    const panel = document.querySelector<HTMLElement>('[data-overlay-panel]')!;
    return {
      anim: getComputedStyle(panel).animationName,
      state: panel.getAttribute('data-state'),
    };
  });
  expect(opened.anim).toContain('sheet-in');
  expect(opened.state).toBe('open');
  await page.waitForTimeout(500);

  await page.keyboard.press('Escape');
  await expect(page.locator('[data-overlay-panel]')).toHaveCount(0);
  await expect(page).not.toHaveURL(/overlay=/);

  const log = await motion(page);
  const panelEvents = log.filter((e) => e.target === 'panel');
  // The exit keyframes ran on the panel, and the panel was still mounted while they ran.
  expect(panelEvents.some((e) => e.name.includes('sheet-out') && e.phase === 'start')).toBe(true);
  expect(panelEvents.some((e) => e.name.includes('sheet-out') && e.phase === 'end')).toBe(true);
  // The exit moved the panel down again.
  const exit = panelEvents.find((e) => e.name.includes('sheet-out') && e.phase === 'end');
  // The exit translate ran: the sheet carried a transform while closing (the sampled value is
  // taken at animationend, which may already be released, so only assert the animation ran).
  expect(exit).toBeTruthy();
  expect(
    panelEvents.find((e) => e.name.includes('sheet-out') && e.phase === 'start')?.transform,
  ).toMatch(/matrix/);
  // The scrim faded out too.
  expect(log.some((e) => e.target === 'scrim' && e.phase === 'end')).toBe(true);
});

test('the dock slides horizontally on open and close (desktop)', async ({ page }) => {
  await recordMotion(page);
  await page.setViewportSize(DESKTOP);
  await page.goto('/');
  await ready(page);
  await openOverlay(page);
  await page.waitForTimeout(500);

  await page.keyboard.press('Escape');
  await expect(page.locator('[data-overlay-panel]')).toHaveCount(0);

  const log = await motion(page);
  const panelEvents = log.filter((e) => e.target === 'panel');
  expect(panelEvents.some((e) => e.name.includes('dock-in') && e.phase === 'start')).toBe(true);
  const exit = panelEvents.find((e) => e.name.includes('dock-out') && e.phase === 'end');
  expect(exit).toBeTruthy();
  // The dock exits to the right: mid-animation the x translation is positive. The start sample
  // already carries the offset, so parse that one (the Node side has no DOMMatrix).
  const startTransform = panelEvents.find(
    (e) => e.name.includes('dock-out') && e.phase === 'start',
  )!.transform;
  const x = Number(startTransform.match(/matrix\([^,]+, [^,]+, [^,]+, [^,]+, ([^,]+),/)?.[1] ?? 0);
  expect(x).toBeGreaterThan(0);
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('reduced motion keeps a short opacity crossfade, no translate', async ({ page }) => {
    await recordMotion(page);
    await page.goto('/');
    await ready(page);
    await openOverlay(page);
    const open = await page.evaluate(() => {
      const panel = document.querySelector<HTMLElement>('[data-overlay-panel]')!;
      const style = getComputedStyle(panel);
      return {
        anim: style.animationName,
        dur: style.animationDuration,
        transform: style.transform,
      };
    });
    expect(open.anim).toBe('overlay-fade');
    expect(parseFloat(open.dur)).toBeLessThanOrEqual(0.2);
    expect(open.transform).toBe('none');

    // Let the open fade finish before closing, so the exit events are the only new ones.
    await page.waitForTimeout(300);
    await page.keyboard.press('Escape');
    // The exit fade takes 120ms; wait for the unmount with a generous window.
    await expect(page.locator('[data-overlay-panel]')).toHaveCount(0, { timeout: 5000 });

    const log = await motion(page);
    const panelEvents = log.filter((e) => e.target === 'panel');
    // Opacity only: no translate keyframes ran, and the fade went in then out.
    expect(panelEvents.some((e) => e.name.includes('sheet-'))).toBe(false);
    expect(panelEvents.some((e) => e.name === 'overlay-fade-out' && e.phase === 'end')).toBe(true);
    expect(panelEvents.every((e) => e.transform === 'none')).toBe(true);
  });
});
