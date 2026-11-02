import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

/** Fails on critical or serious axe violations. Lower impacts are returned for logging only. */
export async function expectNoSeriousA11y(page: Page, context?: string) {
  // Entrance animations (.rise, item-in) fade rows in with stagger; measuring contrast mid-fade
  // reports partial-opacity blends, so wait for every CSS animation to settle first. The figure field is
  // aria-hidden decoration that animates forever by design, so it is excluded from the wait.
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
      .filter(
        (a) =>
          !((a.effect as KeyframeEffect | null)?.target as Element | null)?.closest(
            '[data-figure-field]',
          ),
      )
      .every((a) => a.playState === 'finished' || a.playState === 'idle'),
  );
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const blocking = violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
  const summary = blocking.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} node(s)`);
  expect(blocking, `axe ${context ?? page.url()}\n${summary.join('\n')}`).toEqual([]);
  return violations;
}
