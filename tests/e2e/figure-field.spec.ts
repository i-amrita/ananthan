/* oxlint-disable eslint/no-await-in-loop -- the test samples the scheduler over time on purpose */
import { expect, test } from '@playwright/test';

/**
 * The figure field is a pool of pre-placed Memphis figures; a tiny scheduler keeps a bounded number alive.
 * Reduced motion shows a static scattering with no scheduler.
 */

const aliveCount = (page: import('@playwright/test').Page) =>
  page.evaluate(
    () =>
      [...document.querySelectorAll<HTMLElement>('[data-figure]')].filter((el) =>
        el.getAnimations().some((a) => a.playState === 'running'),
      ).length,
  );

test.describe('live', () => {
  test.use({ reducedMotion: 'no-preference', viewport: { width: 375, height: 812 } });

  test('a bounded number of figures are alive and they change over time', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-figure-field]')).toHaveAttribute('data-live', '');
    const placed = await page.locator('[data-figure]:visible').count();
    expect(placed).toBeGreaterThan(6);
    const seen = new Set<string>();
    let max = 0;
    for (let i = 0; i < 8; i++) {
      await page.waitForTimeout(900);
      max = Math.max(max, await aliveCount(page));
      const ids = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>('[data-figure]')]
          .filter((el) => el.getAnimations().length > 0)
          .map((el) => el.dataset.motif ?? ''),
      );
      for (const id of ids) seen.add(id);
    }
    expect(max).toBeGreaterThan(0);
    expect(max).toBeLessThanOrEqual(6);
    expect(seen.size).toBeGreaterThan(2);
  });

  test('figures animate only opacity and transform (and the dash offset)', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);
    const props = await page.evaluate(() => {
      const out = new Set<string>();
      for (const el of document.querySelectorAll('[data-figure], [data-figure] *')) {
        for (const anim of el.getAnimations()) {
          for (const kf of (anim.effect as KeyframeEffect).getKeyframes()) {
            for (const k of Object.keys(kf)) {
              if (!['offset', 'easing', 'composite', 'computedOffset'].includes(k)) out.add(k);
            }
          }
        }
      }
      return [...out];
    });
    for (const p of props) expect(['opacity', 'transform', 'strokeDashoffset']).toContain(p);
  });
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce', viewport: { width: 375, height: 812 } });

  test('shows a static scattering with no scheduler', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-figure-field]')).not.toHaveAttribute('data-live', '');
    await page.waitForTimeout(800);
    expect(await aliveCount(page)).toBe(0);
    const opacities = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('[data-figure]')]
        .filter((el) => el.getClientRects().length > 0)
        .map((el) => Number(getComputedStyle(el).opacity)),
    );
    expect(opacities.length).toBeGreaterThan(4);
    for (const o of opacities) {
      expect(o).toBeGreaterThan(0.03);
      expect(o).toBeLessThan(0.4);
    }
  });
});

for (const [width, height] of [
  [375, 812],
  [768, 1024],
  [1280, 800],
] as const) {
  test.describe(`${width}x${height}`, () => {
    test.use({ reducedMotion: 'reduce', viewport: { width, height } });

    test('no figure overlaps the focused panel copy', async ({ page }) => {
      await page.goto('/');
      const hits = await page.evaluate(() => {
        const copy = [
          ...document.querySelectorAll<HTMLElement>(
            '[data-focus-panel][data-focused] :is(h1, h2, h3, p, a, button)',
          ),
        ]
          .map((el) => el.getBoundingClientRect())
          .filter((r) => r.width > 0 && r.height > 0);
        const figs = [...document.querySelectorAll<HTMLElement>('[data-figure]')].filter(
          (el) => el.getClientRects().length > 0,
        );
        return figs.filter((f) => {
          const r = f.getBoundingClientRect();
          return copy.some(
            (c) => r.left < c.right && r.right > c.left && r.top < c.bottom && r.bottom > c.top,
          );
        }).length;
      });
      expect(hits).toBe(0);
    });

    test('every panel keeps its figures out of the centred copy block', async ({ page }) => {
      await page.goto('/');
      // Walk all four stops: the keep-out zone is computed for the copy block wherever it
      // sits (centred between the navbar and the ruler since the round-2 steer), so every
      // panel, not just the first, must stay clear.
      for (let stop = 0; stop < 4; stop++) {
        await page.evaluate((n) => {
          const track = document.querySelector<HTMLElement>('[data-focus-track]')!;
          track.scrollTo({ left: track.clientWidth * n, behavior: 'instant' });
        }, stop);
        await page.waitForTimeout(700);
        const hits = await page.evaluate(() => {
          const copy = [
            ...document.querySelectorAll<HTMLElement>(
              '[data-focus-panel][data-focused] :is(h1, h2, p, a)',
            ),
          ]
            .map((el) => el.getBoundingClientRect())
            .filter((r) => r.width > 0 && r.height > 0);
          const figs = [...document.querySelectorAll<HTMLElement>('[data-figure]')].filter(
            (el) => el.getClientRects().length > 0,
          );
          return figs.filter((f) => {
            const r = f.getBoundingClientRect();
            return copy.some(
              (c) => r.left < c.right && r.right > c.left && r.top < c.bottom && r.bottom > c.top,
            );
          }).length;
        });
        expect(hits, `panel ${stop} copy must be free of figures`).toBe(0);
      }
    });
  });
}
