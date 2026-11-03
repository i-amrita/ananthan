import { expect, test } from '@playwright/test';

/**
 * Theme toggle motion (steer item 7). The toggle starts a circular View Transition reveal from the
 * button centre when the API is available and motion is allowed; the sun/moon glyph morphs between
 * states. Reduced motion skips both: the theme still flips, instantly.
 */

async function ready(page: import('@playwright/test').Page) {
  await page.waitForFunction(() => !document.querySelector('astro-island[ssr]'));
}

test.use({ viewport: { width: 1280, height: 800 }, colorScheme: 'light' });

test('the toggle starts a same-document view transition and morphs the icon', async ({ page }) => {
  await page.goto('/?theme=light');
  await ready(page);
  const supported = await page.evaluate(() => typeof document.startViewTransition === 'function');
  test.skip(!supported, 'View Transitions API not available in this browser');

  const toggle = page.getByRole('button', { name: 'Toggle theme' });
  await toggle.click();

  // Mid-transition the reveal style is active and main is inside the root snapshot.
  await expect(page.locator('html')).toHaveClass(/theme-transitioning/);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  // The icon morph is a real animation on the glyph wrapper. It is created with the Web
  // Animations API, so it has no `animationName`; its keyframes show what it animates.
  const morph = await page.evaluate(() => {
    const el = document.querySelector('[data-theme-icon]') as HTMLElement | null;
    const anims = el?.getAnimations() ?? [];
    return anims.flatMap((anim) =>
      (anim.effect instanceof KeyframeEffect ? anim.effect.getKeyframes() : []).map((frame) =>
        String(frame.transform ?? ''),
      ),
    );
  });
  expect(morph.some((transform) => transform.includes('rotate'))).toBe(true);

  // Finished: the class is removed, the URL carries the new theme.
  await expect(page.locator('html')).not.toHaveClass(/theme-transitioning/, { timeout: 2000 });
  await expect(page).toHaveURL(/theme=dark/);
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('reduced motion flips the theme with no reveal or morph', async ({ page }) => {
    await page.goto('/?theme=light');
    await ready(page);
    await page.getByRole('button', { name: 'Toggle theme' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('html')).not.toHaveClass(/theme-transitioning/);
    await expect(page).toHaveURL(/theme=dark/);
    const glyph = await page.evaluate(
      () => document.querySelector('[data-theme-icon]')?.getAnimations().length ?? -1,
    );
    expect(glyph).toBe(0);
  });
});
