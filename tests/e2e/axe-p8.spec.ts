import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * P8 a11y gate: the drawer deep links (`/?overlay=`) and the QR page join the route axe sweep.
 * The panels are portalled Radix dialogs, so axe only sees them when they are open — hence the
 * deep-link URLs rather than plain routes. The keyboard-only tour is covered by the overlay,
 * navbar and shutter specs; this file keeps the automated gate.
 */

const URLS = [
  '/',
  '/?overlay=research',
  '/?overlay=photography',
  '/?overlay=life',
  '/research',
  '/life',
  '/photography',
  '/qr',
];

async function expectNoSerious(page: Page, label: string) {
  // Let the entrance animations settle (the shared axe fixture logic, inlined to keep this file
  // self-contained): mid-fade contrast is measured against a partially blended background.
  // The figure-field scheduler deliberately runs endless decorative spawns on the landing, so
  // those never reach finished/idle — exclude them from the settle wait and let axe blur-tolerate
  // them instead (they sit behind the content and are excluded from a11y checks by aria-hidden).
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .filter(
        (a) =>
          a.effect?.getComputedTiming().iterations !== Infinity &&
          !(a.effect as KeyframeEffect | null)?.target?.closest?.('[data-figure-field]'),
      )
      .every((a) => a.playState === 'finished' || a.playState === 'idle'),
  );
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const blocking = violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
  const summary = blocking.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} node(s)`);
  expect(blocking, `axe ${label}\n${summary.join('\n')}`).toEqual([]);
}

for (const path of URLS) {
  for (const theme of ['light', 'dark']) {
    test(`axe: ${path} (${theme})`, async ({ page }) => {
      await page.goto(`${path}${path.includes('?') ? '&' : '?'}theme=${theme}`);
      await expectNoSerious(page, `${path} ${theme}`);
    });
  }
}
