import { expect, test } from '@playwright/test';

/**
 * Page transitions (steer item 9). Navigation is one minimal cross-document view transition: the
 * old page fades out, the new one fades in and settles upward; the nav chip and the shutter keep
 * their own layers so they never flash. Reduced motion navigates instantly. `?panel=` stays owned
 * by the slider and must survive the transition untouched.
 */

const PHONE = { width: 375, height: 812 };

test.use({ viewport: PHONE });

async function ready(page: import('@playwright/test').Page) {
  await page.waitForFunction(() => !document.querySelector('astro-island[ssr]'));
}

/** Records the view-transition keyframes of the next navigation, from the first paint of it. */
async function collectTransition(page: import('@playwright/test').Page) {
  await page.context().addInitScript(() => {
    // The array lives on `sessionStorage`, so it survives the navigation that swaps the document.
    const KEY = '__vt_log';
    const read = () => {
      try {
        return JSON.parse(sessionStorage.getItem(KEY) ?? '[]') as string[];
      } catch {
        return [];
      }
    };
    const write = (log: string[]) => {
      try {
        sessionStorage.setItem(KEY, JSON.stringify(log));
      } catch {
        /* storage is optional */
      }
    };
    write([]);
    window.addEventListener('pagereveal', (event) => {
      const vt = (event as PageRevealEvent).viewTransition;
      const log = read();
      log.push(`viewTransition:${Boolean(vt)}`);
      write(log);
      if (!vt) return;
      // Polling `document.getAnimations()` alone misses animations that finish between ticks, so
      // `animationstart` is the primary capture and the poll only backstops it.
      const record = (name: string) => {
        if (!name.startsWith('vt-')) return;
        const current = read();
        if (!current.includes(name)) {
          current.push(name);
          write(current);
        }
      };
      document.addEventListener('animationstart', (animationEvent) => {
        record((animationEvent as AnimationEvent).animationName);
      });
      const grab = () => {
        for (const anim of document.getAnimations()) {
          if (anim instanceof CSSAnimation) record(anim.animationName);
        }
      };
      grab();
      const timer = window.setInterval(grab, 16);
      window.setTimeout(() => window.clearInterval(timer), 1200);
    });
  });
}

const transitionLog = (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    try {
      return JSON.parse(sessionStorage.getItem('__vt_log') ?? '[]') as string[];
    } catch {
      return [];
    }
  });

test('navigation is a cross-document view transition with the named layers', async ({ page }) => {
  await collectTransition(page);
  await page.goto('/');
  await ready(page);
  await page.evaluate(() => location.assign('/research'));
  await page.waitForURL('**/research');
  await page.waitForTimeout(1200);

  const log = await transitionLog(page);
  expect(log).toContain('viewTransition:true');
  // The crossfade and the settle run on the named layers.
  expect(log.join(' ')).toContain('vt-in');
  expect(log.join(' ')).toContain('vt-in-main');
  expect(log.join(' ')).toContain('vt-out');
});

test('the nav chip and the shutter keep their own layers', async ({ page }) => {
  await collectTransition(page);
  await page.goto('/');
  await ready(page);
  await page.evaluate(() => location.assign('/research'));
  await page.waitForURL('**/research');
  await page.waitForTimeout(700);
  const names = await page.evaluate(() => {
    const header = document.querySelector('header[data-site-nav]');
    const shutter = document.querySelector('[data-shutter]');
    const main = document.querySelector('main');
    return {
      header: header ? getComputedStyle(header).viewTransitionName : null,
      shutter: shutter ? getComputedStyle(shutter).viewTransitionName : null,
      main: main ? getComputedStyle(main).viewTransitionName : null,
    };
  });
  expect(names.header).toBe('site-nav');
  expect(names.shutter).toBe('shutter');
  expect(names.main).toBe('page-main');
});

test('the settled page and deep-linked panel state survive the transition', async ({ page }) => {
  await page.goto('/?panel=2');
  await ready(page);
  await expect(page.locator('[data-focus-panel]').nth(2)).toHaveAttribute('data-focused', '');
  // The nav chip links to the route pages; the slider owns `?panel=` and must not lose it.
  await page.evaluate(() => location.assign('/research'));
  await page.waitForURL('**/research');
  await expect(page).toHaveURL(/\/research/);
  // The hero slider is back on the home route with the deep-linked panel still focused.
  await page.goBack();
  await expect(page).toHaveURL(/panel=2/);
  await expect(page.locator('[data-focus-panel]').nth(2)).toHaveAttribute('data-focused', '');
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('reduced motion navigates with no view transition', async ({ page }) => {
    await collectTransition(page);
    await page.goto('/');
    await ready(page);
    await page.evaluate(() => location.assign('/research'));
    await page.waitForURL('**/research');
    await page.waitForTimeout(500);
    const log = await transitionLog(page);
    expect(log).toContain('viewTransition:false');
    expect(log.join(' ')).not.toContain('vt-in');
  });
});
