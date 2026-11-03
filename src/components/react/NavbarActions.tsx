import { useQueryStates } from 'nuqs';
import { useEffect, useRef, useState } from 'react';
import CaretLeft from '~icons/ph/caret-left-light';
import CaretRight from '~icons/ph/caret-right-light';
import House from '~icons/ph/house-light';

import { m, useLocale } from '@/lib/i18n';
import { urlStateParsers } from '@/lib/url-state';
import { cn } from '@/lib/utils';

import { LocaleSwitchButton, PILL_ITEM } from './LocaleSwitch';
import { Providers } from './Providers';
import { ThemeToggle } from './ThemeToggle';

/** Route links in the chip. Rendered as real links so they work without JavaScript. */
const ROUTES = [
  { href: '/research', key: 'nav_research' },
  { href: '/life', key: 'nav_life' },
  { href: '/photography', key: 'nav_photography' },
] as const;

const LINK = cn(PILL_ITEM, 'h-11 min-w-11 px-2.5 text-xs');

/**
 * The 3-icon chip. DOM order is locale, theme, expand, links, so Tab visits the icons first and the
 * links last; the links group is moved to the visual left with `order-first`. Where the links cannot share a row with the icons (375px), they wrap onto a first row and the icon group stays atomic. Visual state is CSS on
 * `html[data-nav-open]` / `html:not([data-nav-ready])` (see global.css), so SSR, the pre-paint script
 * and hydration never disagree. React only mirrors the nuqs `nav` state onto `data-nav-open`.
 */
function Chip({ pathname }: { pathname: string }) {
  useLocale();
  const [{ nav, overlay }, setUrl] = useQueryStates({
    nav: urlStateParsers.nav,
    overlay: urlStateParsers.overlay,
  });
  const [mounted, setMounted] = useState(false);
  const expandRef = useRef<HTMLButtonElement>(null);
  const expanded = nav === 'open';

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.navReady = '';
    if (expanded) root.dataset.navOpen = '';
    else delete root.dataset.navOpen;
  }, [expanded]);

  // Opening a panel collapses the chip first. Replace, so Back does not reopen a stale chip.
  useEffect(() => {
    if (overlay !== null && expanded) void setUrl({ nav: null }, { history: 'replace' });
  }, [overlay, expanded, setUrl]);

  // Escape collapses and hands focus back to the expand button.
  useEffect(() => {
    if (!expanded) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      void setUrl({ nav: null }, { history: 'replace' });
      expandRef.current?.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [expanded, setUrl]);

  // `mounted` keeps the attributes below equal to the server render on the hydration pass.
  const open = mounted && expanded;
  const Lead = open ? CaretRight : CaretLeft;
  const Trail = open ? CaretLeft : CaretRight;
  const home = pathname === '/';

  return (
    <>
      <div className="flex shrink-0 items-center">
        <LocaleSwitchButton variant="code" />
        <ThemeToggle />
        <button
          ref={expandRef}
          type="button"
          aria-expanded={open}
          aria-controls="site-nav-links"
          aria-label={open ? m.nav_collapse() : m.nav_expand()}
          data-nav-toggle
          onClick={() => void setUrl({ nav: expanded ? null : 'open' })}
          className={cn(PILL_ITEM, 'size-11')}
        >
          <Lead className="-mr-1 size-4" aria-hidden="true" />
          <Trail className="-ml-1 size-4" aria-hidden="true" />
        </button>
      </div>
      <div id="site-nav-links" data-nav-links className="order-first flex items-center">
        <a
          href="/"
          aria-label={m.nav_home()}
          aria-current={home ? 'page' : undefined}
          className={cn(PILL_ITEM, 'size-11')}
        >
          <House className="size-5" aria-hidden="true" />
        </a>
        {ROUTES.map(({ href, key }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <a key={href} href={href} aria-current={active ? 'page' : undefined} className={LINK}>
              {m[key]()}
              {active && (
                <span
                  aria-hidden="true"
                  className="absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full bg-brand"
                />
              )}
            </a>
          );
        })}
      </div>
    </>
  );
}

/** Navbar chip: one island sharing the nuqs URL emitter. `pathname` comes from Astro so SSR and hydration agree. */
export function NavbarActions({ pathname }: { pathname: string }) {
  return (
    <Providers>
      <Chip pathname={pathname} />
    </Providers>
  );
}
