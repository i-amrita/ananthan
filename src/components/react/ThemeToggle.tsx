import type { MouseEvent } from 'react';
import CircleHalf from '~icons/ph/circle-half-light';

import { m, useLocale } from '@/lib/i18n';
import type { Theme } from '@/lib/url-state';
import { cn } from '@/lib/utils';

import { PILL_ITEM } from './LocaleSwitch';

const VT_STYLE_ID = 'theme-vt-style';

/** Disables the default cross-fade so only the clip-path reveal is visible (borrowed from illo.fyi). */
function ensureViewTransitionStyle() {
  if (document.getElementById(VT_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = VT_STYLE_ID;
  style.textContent =
    'html.theme-transitioning::view-transition-old(root),html.theme-transitioning::view-transition-new(root){animation:none;mix-blend-mode:normal}';
  document.head.append(style);
}

/** Runs `flip` inside a circular View Transition reveal from `origin`; plain flip when unsupported or reduced motion. */
function revealFrom(origin: HTMLElement, flip: () => void) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!document.startViewTransition || reduced) {
    flip();
    return;
  }
  const root = document.documentElement;
  const box = origin.getBoundingClientRect();
  const x = box.left + box.width / 2;
  const y = box.top + box.height / 2;
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  ensureViewTransitionStyle();
  root.classList.add('theme-transitioning');
  const done = () => root.classList.remove('theme-transitioning');
  try {
    const transition = document.startViewTransition(flip);
    transition.ready
      .then(() =>
        root.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          {
            duration: 550,
            easing: 'cubic-bezier(.32,.72,0,1)',
            pseudoElement: '::view-transition-new(root)',
          },
        ),
      )
      .catch(() => undefined);
    transition.finished.then(done, done);
  } catch {
    done();
    flip();
  }
}

const nextTheme = (): Theme =>
  document.documentElement.dataset.theme === 'dark'
    ? 'light'
    : document.documentElement.dataset.theme === 'light'
      ? 'dark'
      : matchMedia('(prefers-color-scheme: dark)').matches
        ? 'light'
        : 'dark';

/** Half-filled circle icon: toggles `?theme=` with a circular reveal. */
export function ThemeToggle() {
  useLocale();
  return (
    <button
      type="button"
      aria-label={m.action_theme()}
      onClick={(e: MouseEvent<HTMLButtonElement>) => {
        const next = nextTheme();
        revealFrom(e.currentTarget, () => {
          const root = document.documentElement;
          root.dataset.theme = next;
          const url = new URL(location.href);
          url.searchParams.set('theme', next);
          history.replaceState(history.state, '', url);
        });
      }}
      className={cn(PILL_ITEM, 'size-11')}
    >
      <CircleHalf className="size-5" aria-hidden="true" />
    </button>
  );
}
