import { expect, test } from '@playwright/test';

/**
 * The hero overlays are URL state: `?overlay=research|photography|life` opens a panel.
 * Below 640px the panel is a vaul bottom sheet, from 640px a docked right Radix dialog.
 * `panel` belongs to the slider script, so opening and closing a panel must never touch it.
 */

const PHONE = { width: 375, height: 812 };
const DESKTOP = { width: 1280, height: 800 };

test.use({ viewport: PHONE });

test('?overlay=research opens a bottom sheet on a phone', async ({ page }) => {
  await page.goto('/?overlay=research');
  const panel = page.locator('[data-overlay-panel]');
  await expect(panel).toBeVisible();
  await expect(panel).toHaveAttribute('data-overlay-variant', 'sheet');
  await expect(page.locator('[data-overlay-scrim]')).toBeVisible();
  await expect(page.locator('[data-overlay-read-more]')).toHaveAttribute('href', '/research');
});

test('?overlay=research opens a docked panel on a desktop', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto('/?overlay=research');
  const panel = page.locator('[data-overlay-panel]');
  await expect(panel).toBeVisible();
  await expect(panel).toHaveAttribute('data-overlay-variant', 'docked');
  await expect(page.locator('[data-overlay-scrim]')).toBeVisible();
});

test('the research drawer lists the topics, then the publications and talks', async ({ page }) => {
  await page.goto('/?overlay=research');
  const panel = page.locator('[data-overlay-panel]');
  await expect(panel).toBeVisible();
  // The topics section comes first and reuses the hero panel keys.
  const topics = panel.locator('[data-research-topics] li');
  await expect(panel.getByRole('heading', { name: 'Topics' })).toBeVisible();
  await expect(topics).toHaveCount(4);
  await expect(topics.first()).toContainText('protein language models');
  // Titles are trimmed to ~80 chars; the full title travels in the `title` attribute.
  const titles = await panel.locator('li a[title]').evaluateAll((els) =>
    els.map((e) => ({
      text: (e.textContent ?? '').trim(),
      full: e.getAttribute('title') ?? '',
    })),
  );
  expect(titles.length).toBeGreaterThan(3);
  for (const t of titles) {
    expect(t.text.length).toBeLessThanOrEqual(80);
    expect(t.full.length).toBeGreaterThanOrEqual(t.text.length);
  }
  expect(titles.some((t) => t.text.endsWith('…'))).toBe(true);
});

test('the research page shows the same topics as the drawer', async ({ page }) => {
  await page.goto('/research');
  const topics = page.locator('[data-research-topics] li');
  await expect(topics).toHaveCount(4);
  await expect(topics.first()).toContainText('protein language models');
});

test('the photography drawer shows the frames, the Instagram CTA and the page link', async ({
  page,
}) => {
  await page.goto('/?overlay=photography');
  const panel = page.locator('[data-overlay-panel]');
  await expect(panel).toBeVisible();
  expect(await panel.locator('[data-photo-tile]').count()).toBeGreaterThan(3);
  // Real photographs come before the marked placeholder frames.
  const tiles = panel.locator('[data-photo-masonry] li');
  const firstPlaceholder = await tiles.evaluateAll((els) =>
    els.findIndex((e) => e.hasAttribute('data-photo-placeholder')),
  );
  const firstPlaceholderMissing = firstPlaceholder === -1;
  if (!firstPlaceholderMissing) {
    for (let i = 0; i < firstPlaceholder; i++) {
      await expect(tiles.nth(i).locator('[data-photo-tile]')).toHaveAttribute(
        'src',
        /^(?!.*frame-).*/,
      );
    }
  }
  // Placeholders only appear while there are fewer than six real photos, and they stay marked.
  const placeholderCount = await panel.locator('[data-photo-placeholder]').count();
  if (placeholderCount > 0) {
    expect(await panel.locator('[data-photo-tile]').count()).toBeLessThan(10);
    await expect(panel.locator('[data-photo-placeholder]').first()).toContainText(/placeholder/i);
  }
  await expect(page.locator('[data-overlay-instagram]')).toHaveAttribute(
    'href',
    'https://www.instagram.com/filmi.nambi',
  );
  await expect(page.locator('[data-overlay-read-more]')).toHaveAttribute('href', '/photography');
});

test('the life drawer carries the same content as the life page', async ({ page }) => {
  await page.goto('/?overlay=life');
  const panel = page.locator('[data-overlay-panel]');
  await expect(panel).toBeVisible();
  await expect(panel.getByRole('heading', { name: 'Hobbies' })).toBeVisible();
  await expect(panel.getByRole('heading', { name: 'Bio' })).toBeVisible();
  await expect(panel.getByRole('heading', { name: 'Career' })).toBeVisible();
  await expect(panel.getByText('Rowing', { exact: true })).toBeVisible();
  await expect(page.locator('[data-overlay-read-more]')).toHaveAttribute('href', '/life');
  // Owner TODO entries render as muted drafts with a draft tag, never as plain copy.
  const drafts = panel.locator('[data-draft]');
  expect(await drafts.count()).toBeGreaterThan(0);
  await expect(drafts.first().locator('[data-draft-tag]')).toHaveText(/draft/i);
  await expect(drafts.first().locator('dd')).not.toContainText('TODO(');
});

test('the overlay marks the document and freezes the hero track', async ({ page }) => {
  await page.goto('/?overlay=research');
  await expect(page.locator('html')).toHaveAttribute('data-overlay-open', '');
  const track = page.locator('[data-focus-track]');
  await expect(track).toHaveAttribute('inert', '');
  // The sound gate holds the track too, so the gate has to settle before the drawer can give
  // it back: the track is only released once nothing holds it.
  await expect(page.locator('html')).toHaveAttribute('data-sound-ready', '');
  await page.keyboard.press('Escape');
  await expect(page.locator('html')).not.toHaveAttribute('data-overlay-open', '');
  await expect(track).not.toHaveAttribute('inert', '');
});

test('Escape closes the overlay', async ({ page }) => {
  await page.goto('/?overlay=research');
  await expect(page.locator('[data-overlay-panel]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-overlay-panel]')).toBeHidden();
  await expect(page).not.toHaveURL(/overlay=/);
});

test('the close button closes the overlay', async ({ page }) => {
  await page.goto('/?overlay=research');
  await page.locator('[data-overlay-close]').click();
  await expect(page.locator('[data-overlay-panel]')).toBeHidden();
  await expect(page).not.toHaveURL(/overlay=/);
});

test('a scrim click closes the overlay', async ({ page }) => {
  await page.goto('/?overlay=research');
  await page.locator('[data-overlay-scrim]').click({ position: { x: 10, y: 10 } });
  await expect(page.locator('[data-overlay-panel]')).toBeHidden();
  await expect(page).not.toHaveURL(/overlay=/);
});

test('browser Back closes an overlay that was opened in page', async ({ page }) => {
  await page.goto('/');
  // The listener only exists once the island is hydrated.
  await expect(page.locator('html')).toHaveAttribute('data-overlay-ready', '');
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('ananthan:open-overlay', { detail: 'research' }));
  });
  await expect(page.locator('[data-overlay-panel]')).toBeVisible();
  await expect(page).toHaveURL(/overlay=research/);
  await page.goBack();
  await expect(page.locator('[data-overlay-panel]')).toBeHidden();
  await expect(page).not.toHaveURL(/overlay=/);
});

test('closing the overlay never changes the panel param', async ({ page }) => {
  await page.goto('/?panel=2&overlay=research');
  await expect(page.locator('[data-overlay-panel]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-overlay-panel]')).toBeHidden();
  await expect(page).toHaveURL(/[?&]panel=2(?:&|$)/);
});

test('the other two overlays open with their own link', async ({ page }) => {
  await page.goto('/?overlay=life');
  await expect(page.locator('[data-overlay-panel]')).toBeVisible();
  await expect(page.locator('[data-overlay-read-more]')).toHaveAttribute('href', '/life');
  await page.goto('/?overlay=photography');
  await expect(page.locator('[data-overlay-panel]')).toBeVisible();
  await expect(page.locator('[data-overlay-read-more]')).toHaveAttribute('href', '/photography');
});

test('an unknown overlay value opens nothing', async ({ page }) => {
  await page.goto('/?overlay=nope');
  await expect(page.locator('[data-overlay-panel]')).toHaveCount(0);
});

/**
 * P7 deep links: the full state triple — slider panel, drawer, drawer scroll offset — must
 * restore exactly from `?panel=&overlay=&scroll=`. The scroll restore is the racy part: the
 * panel content (especially the photography masonry) has to be laid out with real image
 * dimensions before the offset exists to scroll to, so the restore retries until the content is
 * tall enough. `scroll` is `replace` state, so Back and Forward move through the history of
 * panel/overlay without stacking scroll entries.
 */
test.describe('deep links restore panel, overlay and scroll', () => {
  for (const overlay of ['research', 'photography', 'life'] as const) {
    // The life and photography drawers are shorter than 400px on a phone, so each overlay asks
    // for an offset inside its own scroll range.
    // Each overlay asks for an offset inside its own scroll range on a phone.
    const scroll = overlay === 'research' ? 400 : overlay === 'photography' ? 60 : 150;
    test(`?overlay=${overlay}&panel=1&scroll=${scroll} restores all three`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto(`/?panel=1&overlay=${overlay}&scroll=${scroll}`);
      const panel = page.locator('[data-overlay-panel]');
      await expect(panel).toBeVisible();
      // The slider must have carried the focus to panel 1.
      await expect(page.locator('[data-focus-panel="1"]')).toHaveAttribute('data-focused', '');
      // The drawer body scrolled to the requested offset (within a small rounding tolerance).
      await expect
        .poll(
          async () =>
            page.evaluate(() =>
              Math.round(document.querySelector('[data-overlay-body]')?.scrollTop ?? -1),
            ),
          { timeout: 5000 },
        )
        .toBeGreaterThanOrEqual(scroll - 20);
      // And the scroll param survives in the URL.
      await expect(page).toHaveURL(new RegExp(`overlay=${overlay}&scroll=${scroll}`));
    });
  }

  test('scrolling the drawer writes the offset with replace, so it stacks no history entry', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-overlay-ready', '');
    // Open the drawer in page: this pushes a history entry.
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('ananthan:open-overlay', { detail: 'research' }));
    });
    await expect(page.locator('[data-overlay-panel]')).toBeVisible();
    // Scroll the drawer body; the island writes the offset with `history: replace`.
    await page.evaluate(() => {
      const el = document.querySelector<HTMLElement>('[data-overlay-body]');
      el!.scrollTop = 400;
    });
    await expect(page).toHaveURL(/overlay=research&scroll=\d+/);
    // Back returns to the entry before the drawer was opened: no overlay.
    await page.goBack();
    await expect(page).not.toHaveURL(/overlay=/);
    await expect(page.locator('[data-overlay-panel]')).toBeHidden();
    // Forward reopens it, with the scroll offset intact.
    await page.goForward();
    await expect(page.locator('[data-overlay-panel]')).toBeVisible();
    await expect(page).toHaveURL(/overlay=research&scroll=\d+/);
  });

  test('Back and Forward restore the deep link', async ({ page }) => {
    await page.goto('/');
    await page.goto('/?panel=1&overlay=research&scroll=400');
    await expect(page.locator('[data-overlay-panel]')).toBeVisible();
    await expect
      .poll(
        async () =>
          page.evaluate(() =>
            Math.round(document.querySelector('[data-overlay-body]')?.scrollTop ?? -1),
          ),
        { timeout: 5000 },
      )
      .toBeGreaterThanOrEqual(380);
    await page.goBack();
    await expect(page).not.toHaveURL(/overlay=/);
    await expect(page.locator('[data-overlay-panel]')).toHaveCount(0);
    await page.goForward();
    await expect(page.locator('[data-overlay-panel]')).toBeVisible();
    await expect
      .poll(
        async () =>
          page.evaluate(() =>
            Math.round(document.querySelector('[data-overlay-body]')?.scrollTop ?? -1),
          ),
        { timeout: 5000 },
      )
      .toBeGreaterThanOrEqual(380);
  });
});
