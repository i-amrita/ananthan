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

/** nuqs parsers keyed by query param. Pass to `useQueryStates(urlStateParsers)`. */
export const urlStateParsers = {
  theme: parseAsStringLiteral(THEMES),
  locale: parseAsStringLiteral(LOCALES),
  q: parseAsString,
  mode: parseAsStringLiteral(['ai', 'keyword'] as const),
  /** Index of the focused hero panel, 0..3. Kept in the URL so a panel can be linked to. */
  panel: parseAsInteger,
} as const;

export type UrlStateKey = keyof typeof urlStateParsers;

/**
 * `push` creates a history entry (back button restores the previous state).
 * `replace` is for high-frequency or cosmetic state.
 */
export const historyFor: Record<UrlStateKey, 'push' | 'replace'> = {
  theme: 'replace',
  locale: 'replace',
  q: 'replace',
  mode: 'replace',
  panel: 'replace',
};

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
