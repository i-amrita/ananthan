import House from '~icons/ph/house-light';

import { m, useLocale } from '@/lib/i18n';
import { cn } from '@/lib/utils';

import { LocaleSwitchButton, PILL_ITEM } from './LocaleSwitch';
import { Providers } from './Providers';
import { ThemeToggle } from './ThemeToggle';

/** Route links in the pill. Rendered as real links so they work without JavaScript. */
const ROUTES = [
  { href: '/research', key: 'nav_research' },
  { href: '/life', key: 'nav_life' },
  { href: '/photography', key: 'nav_photography' },
] as const;

function Divider() {
  return <span aria-hidden="true" className="mx-1 h-4 w-px bg-border" />;
}

function Pill({ pathname }: { pathname: string }) {
  useLocale();
  const home = pathname === '/';
  return (
    <>
      <div className="flex items-center gap-0.5">
        <a
          href="/"
          aria-label={m.nav_home()}
          aria-current={home ? 'page' : undefined}
          className={cn(PILL_ITEM, 'size-7')}
        >
          <House className="size-4" aria-hidden="true" />
          {home && (
            <span
              aria-hidden="true"
              className="absolute bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-brand"
            />
          )}
        </a>
        {ROUTES.map(({ href, key }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <a
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(PILL_ITEM, 'px-2 text-xs')}
            >
              {m[key]()}
            </a>
          );
        })}
      </div>
      <Divider />
      <div className="flex items-center gap-1">
        <LocaleSwitchButton variant="code" />
        <ThemeToggle />
      </div>
    </>
  );
}

/** Navbar pill: one island sharing the nuqs URL emitter. `pathname` comes from Astro so SSR and hydration agree. */
export function NavbarActions({ pathname }: { pathname: string }) {
  return (
    <Providers>
      <Pill pathname={pathname} />
    </Providers>
  );
}
