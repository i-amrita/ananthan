/**
 * Single source of truth for URL-encoded UI state. Every visible state must be reachable as a URL.
 * Islands bind these parsers with `nuqs`; Astro routes read the same keys from `Astro.url.searchParams`.
 * Contract + history semantics: `.agents/docs/url-state.md`.
 */
import { parseAsInteger, parseAsString, parseAsStringLiteral } from 'nuqs';

export const LOCALES = ['en', 'ms', 'hi', 'de', 'ml'] as const;
export const THEMES = ['light', 'dark'] as const;

export type Locale = (typeof LOCALES)[number];
export type Theme = (typeof THEMES)[number];

/** Overlay panels opened over the hero slider. */
export const OVERLAYS = ['research', 'life', 'photography'] as const;
export type Overlay = (typeof OVERLAYS)[number];

/** Every URL state key. The parser map below must have exactly these keys. */
export type UrlStateKey =
  | 'theme'
  | 'locale'
  | 'q'
  | 'mode'
  | 'panel'
  | 'overlay'
  | 'scroll'
  | 'nav';

/**
 * `push` creates a history entry (back button restores the previous state).
 * `replace` is for high-frequency or cosmetic state.
 * The parsers below read this map, so the two cannot drift.
 */
export const historyFor: Record<UrlStateKey, 'push' | 'replace'> = {
  theme: 'replace',
  locale: 'replace',
  q: 'replace',
  mode: 'replace',
  panel: 'replace',
  overlay: 'push',
  scroll: 'replace',
  nav: 'push',
};

/** nuqs parsers keyed by query param. Pass to `useQueryStates(urlStateParsers)`. */
export const urlStateParsers = {
  theme: parseAsStringLiteral(THEMES),
  locale: parseAsStringLiteral(LOCALES),
  q: parseAsString,
  mode: parseAsStringLiteral(['ai', 'keyword'] as const),
  /** Index of the focused hero panel, 0..3. Kept in the URL so a panel can be linked to. */
  panel: parseAsInteger,
  /** Open hero panel drawer. Push, so Back closes it. Owned by nuqs, not the slider script. */
  overlay: parseAsStringLiteral(OVERLAYS).withOptions({ history: historyFor.overlay }),
  /** Panel scroll position, throttled. Restored on open. */
  scroll: parseAsInteger.withOptions({ history: historyFor.scroll }),
  /** Expanded nav chip state. Only value is `open`. */
  nav: parseAsStringLiteral(['open'] as const).withOptions({ history: historyFor.nav }),
} as const satisfies Record<UrlStateKey, unknown>;

/** Build a static, shareable URL for a state. `href('/', { panel: 2 })` -> `/?panel=2`. */
export function href(
  path: string,
  state: Partial<Record<UrlStateKey, string | number | null | undefined>> = {},
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(state)) {
    if (value !== null && value !== undefined && value !== '') params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}
