import { useEffect, useRef, useState, type MouseEvent } from 'react';
import MoonStars from '~icons/ph/moon-stars-light';
import Sun from '~icons/ph/sun-light';

import { m, useLocale } from '@/lib/i18n';
import type { Theme } from '@/lib/url-state';
import { cn } from '@/lib/utils';

import { PILL_ITEM } from './LocaleSwitch';

const VT_STYLE_ID = 'theme-vt-style';

/** Duration of the circular reveal, in ms. Matches the spec in `.agents/screens/motion-transitions.md`. */
const REVEAL_MS = 500;
/** Duration of the sun/moon morph. */
const MORPH_MS = 400;

/** Disables the default cross-fade so only the clip-path reveal is visible (borrowed from illo.fyi). */
function ensureViewTransitionStyle() {
  if (document.getElementById(VT_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = VT_STYLE_ID;
  style.textContent =
    'html.theme-transitioning::view-transition-old(root),html.theme-transitioning::view-transition-new(root){animation:none;mix-blend-mode:normal}' +
    // The page-transition keyframes are scoped to cross-document navigations; a same-document
    // theme flip must not crossfade or settle `main`. Dropping the name puts the content back
    // into the root snapshots, so the circular reveal covers the whole page.
    'html.theme-transitioning main{view-transition-name:none}';
  document.head.append(style);
}

/**
 * Runs `flip` inside a circular View Transition reveal from `origin`; plain flip when unsupported
 * or reduced motion. The reveal is a clip-path circle that grows from the centre of the toggle to
 * the far corner of the viewport, so the new theme opens like an aperture over the old one.
 */
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
            duration: REVEAL_MS,
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

/** Reads the theme the page is actually showing, so the icon matches the paper on screen. */
function currentTheme(): Theme {
  const set = document.documentElement.dataset.theme;
  if (set === 'dark' || set === 'light') return set;
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Sun/moon toggle: `?theme=` stays the source of truth, the icon morphs between the two states and
 * the new theme is revealed through a circular View Transition from the button's centre. The icon
 * morph runs outside the View Transition, so it stays visible while the aperture opens.
 */
export function ThemeToggle() {
  useLocale();
  const [theme, setTheme] = useState<Theme | null>(null);
  const morphRef = useRef<HTMLSpanElement>(null);

  // The server does not know the OS theme, so the icon is rendered neutral until the client reads it.
  useEffect(() => setTheme(currentTheme()), []);

  const morph = (next: Theme) => {
    const el = morphRef.current;
    if (!el) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTheme(next);
      return;
    }
    el.getAnimations().forEach((anim) => anim.cancel());
    el.animate(
      [
        { transform: 'rotate(0deg) scale(1)', opacity: 1 },
        { transform: 'rotate(90deg) scale(0.4)', opacity: 0 },
      ],
      { duration: MORPH_MS / 2, easing: 'cubic-bezier(.32,.72,0,1)', fill: 'forwards' },
    );
    // Swap the glyph at the midpoint of the morph, while it is out of sight.
    window.setTimeout(() => {
      setTheme(next);
      el.getAnimations().forEach((anim) => anim.cancel());
      el.animate(
        [
          { transform: 'rotate(-90deg) scale(0.4)', opacity: 0 },
          { transform: 'rotate(0deg) scale(1)', opacity: 1 },
        ],
        { duration: MORPH_MS / 2, easing: 'cubic-bezier(.32,.72,0,1)', fill: 'forwards' },
      );
    }, MORPH_MS / 2);
  };

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
        morph(next);
      }}
      className={cn(PILL_ITEM, 'size-11')}
    >
      <span
        ref={morphRef}
        className="grid size-5 place-items-center"
        aria-hidden="true"
        data-theme-icon
      >
        {theme === 'dark' ? <MoonStars className="size-5" /> : <Sun className="size-5" />}
      </span>
    </button>
  );
}
