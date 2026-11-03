import { useQueryStates } from 'nuqs';
import { useEffect } from 'react';

import { t, useLocale, type MessageKey } from '@/lib/i18n';
import { urlStateParsers } from '@/lib/url-state';

import { Providers } from './Providers';

/**
 * Static Astro copy ships as English HTML marked `data-i18n="key"` (or `data-i18n-aria="key"`).
 * This swaps it to the active locale and keeps `<html lang>` in sync. Mounted once per page from `Base.astro`.
 */
function StaticCopy() {
  const { locale } = useLocale();
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = 'ltr';
    for (const el of document.querySelectorAll<HTMLElement>('[data-i18n]')) {
      el.textContent = t(el.dataset['i18n'] as MessageKey);
    }
    for (const el of document.querySelectorAll<HTMLElement>('[data-i18n-label]')) {
      el.dataset['label'] = t(el.dataset['i18nLabel'] as MessageKey);
    }
    for (const el of document.querySelectorAll<HTMLElement>('[data-i18n-title]')) {
      el.title = t(el.dataset['i18nTitle'] as MessageKey);
    }
    for (const el of document.querySelectorAll<HTMLElement>('[data-i18n-aria]')) {
      el.setAttribute('aria-label', t(el.dataset['i18nAria'] as MessageKey));
    }
  }, [locale]);
  return null;
}

/** Keeps the `?locale=` param in sync so a locale is a shareable URL state, not just an in-memory choice. */
function LocaleParam() {
  const [{ locale }, setState] = useQueryStates(urlStateParsers);
  useEffect(() => {
    if (locale !== null) return;
    const saved = (() => {
      try {
        return localStorage.getItem('locale');
      } catch {
        return null;
      }
    })();
    if (saved && saved !== 'en') void setState({ locale: saved as never }, { history: 'replace' });
  }, [locale, setState]);
  return null;
}

/** The one island for static-copy locale swaps. No visible output. */
export function StaticCopyIsland() {
  return (
    <Providers>
      <StaticCopy />
      <LocaleParam />
    </Providers>
  );
}
