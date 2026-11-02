import { expect, test } from '@playwright/test';

/**
 * Motion is a garnish, not a requirement: `prefers-reduced-motion` freezes the ink draw-in,
 * the panel snap, and the focus blur, and the page stays fully usable without it.
 */

test.use({ reducedMotion: 'reduce' });

test('the hero still renders and navigates with reduced motion', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-focus-panel]')).toHaveCount(4);
  await page.locator('[data-focus-track]').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('[data-focus-panel]').nth(1)).toHaveAttribute('data-focused', '');
});

test('the panel content never blurs under reduced motion', async ({ page }) => {
  await page.goto('/');
  // A real drag past the midpoint: with motion the content would blur.
  await page.mouse.move(900, 400);
  await page.mouse.down();
  await page.mouse.move(500, 400, { steps: 8 });
  await page.waitForTimeout(300);
  const state = await page.evaluate(() => {
    const contents = [...document.querySelectorAll<HTMLElement>('[data-focus-content]')];
    return {
      inlineBlur: contents.map((c) => c.style.getPropertyValue('--focus-blur')),
      computed: contents.map((c) => getComputedStyle(c).filter),
    };
  });
  await page.mouse.up();
  for (const value of state.computed) expect(value).toBe('none');
  // Even where the script wrote a value, the reduced-motion CSS keeps it off.
  expect(state.computed.length).toBe(4);
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
