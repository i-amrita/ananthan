import { expect, test } from '@playwright/test';

/**
 * Motion is a garnish, not a requirement: `prefers-reduced-motion` freezes the ink draw-in
 * and the panel snap, and the page stays fully usable without it.
 */

test.use({ reducedMotion: 'reduce' });

test('the hero still renders and navigates with reduced motion', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-focus-panel]')).toHaveCount(4);
  await page.locator('[data-focus-track]').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('[data-focus-panel]').nth(1)).toHaveAttribute('data-focused', '');
});

test('the figure field does not animate strokes under reduced motion', async ({ page }) => {
  await page.goto('/research');
  const animated = await page.evaluate(() => {
    const els = [...document.querySelectorAll<SVGGeometryElement>('[data-stroke]')];
    return els.filter((el) => el.getAnimations().some((anim) => anim.playState === 'running'))
      .length;
  });
  expect(animated).toBe(0);
});

test('no element animates transform under reduced motion', async ({ page }) => {
  await page.goto('/');
  const animated = await page.evaluate(() => {
    const els = [...document.querySelectorAll<HTMLElement>('main *')];
    return els.filter((el) => {
      const name = getComputedStyle(el).animationName;
      return name && name !== 'none';
    }).length;
  });
  expect(animated).toBe(0);
});
