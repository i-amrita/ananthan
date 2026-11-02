/**
 * Typed i18n helper for islands. Messages live in `src/i18n/messages/en.json` (source) and are compiled by Paraglide.
 * The active locale is URL state (`?locale=ms|hi|es|ml|en`, default `en`). Contract: `.agents/docs/i18n.md`.
 */
import { useQueryState } from 'nuqs';
import { useCallback, useEffect } from 'react';

import * as paraglideMessages from '@/i18n/paraglide/messages.js';
import {
  defineCustomClientStrategy,
  locales as paraglideLocales,
} from '@/i18n/paraglide/runtime.js';

import { type Locale, LOCALES, urlStateParsers } from './url-state';

export { LOCALES, type Locale };

/** Native names for the switcher. */
export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  ms: 'Bahasa Melayu',
  hi: 'हिन्दी',
  es: 'Español',
  ml: 'മലയാളം',
};

export type MessageKey = keyof typeof paraglideMessages.m;

function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/** Locale last committed by `useLocale` (the URL write is throttled, so it can lag behind React state). */
let active: Locale | null = null;

function fromUrl(): Locale | undefined {
  if (typeof window === 'undefined') return undefined;
  const value = new URLSearchParams(window.location.search).get('locale');
  return isLocale(value) ? value : undefined;
}

defineCustomClientStrategy('custom-query', {
  getLocale: () => active ?? fromUrl(),
  setLocale: (locale) => {
    if (isLocale(locale)) active = locale;
  },
});

/** Resolve a message by key. Prefer `m.key()` for static keys; use `t` for dynamic keys (e.g. action ids). */
export function t(key: MessageKey, params?: Record<string, string | number>): string {
  const fn = paraglideMessages.m[key] as (params?: unknown) => string;
  return fn(params);
}

export const m = paraglideMessages.m;

/**
 * Bind to `?locale=`. Re-renders the island on change; `m.*` / `t()` called during render then resolve in the new locale.
 * Returns `en` when the param is absent.
 */
export function useLocale() {
  const [raw, setRaw] = useQueryState('locale', urlStateParsers.locale);
  const locale: Locale = raw ?? 'en';
  active = locale;
  // Persist the choice; `Base.astro` restores it on the next visit when the URL has no `?locale=`.
  useEffect(() => {
    try {
      localStorage.setItem('locale', locale);
    } catch {}
  }, [locale]);
  const setLocale = useCallback(
    (next: Locale) => {
      active = next;
      return setRaw(next === 'en' ? null : next, { history: 'replace' });
    },
    [setRaw],
  );
  return { locale, setLocale, locales: paraglideLocales as readonly Locale[] };
}
