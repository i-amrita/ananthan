import { useEffect, useId, useState } from 'react';
import Languages from '~icons/ph/translate-light';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { LOCALE_NAMES, LOCALES, m, useLocale } from '@/lib/i18n';
import { cn } from '@/lib/utils';

import { Providers } from './Providers';

/** Shared look for navbar pill items: 28px visible, 44px hit area via `::after`, hairline focus ring. */
export const PILL_ITEM =
  'relative inline-flex items-center justify-center rounded-full text-muted-foreground outline-none transition-[color,background-color,transform] duration-300 ease-(--ease-spring) active:scale-90 motion-reduce:transition-colors motion-reduce:active:scale-100 after:absolute after:-inset-2 after:content-[""] hover:bg-fg/5 hover:text-fg focus-visible:ring-2 focus-visible:ring-brand aria-[current=page]:text-fg data-[state=open]:text-brand';

/** Fired when a locale popover opens; the others listen and close, so only one is open at a time. */
const LOCALE_POPOVER_EVENT = 'ananthan:locale-popover';

/** Controlled open state for a locale popover that yields to any other locale popover. */
export function useExclusiveOpen() {
  const id = useId();
  const [open, setOpenState] = useState(false);
  const setOpen = (next: boolean) => {
    setOpenState(next);
    if (next) window.dispatchEvent(new CustomEvent(LOCALE_POPOVER_EVENT, { detail: id }));
  };
  useEffect(() => {
    const onOther = (e: Event) => {
      if ((e as CustomEvent<string>).detail !== id) setOpenState(false);
    };
    window.addEventListener(LOCALE_POPOVER_EVENT, onOther);
    return () => window.removeEventListener(LOCALE_POPOVER_EVENT, onOther);
  }, [id]);
  return [open, setOpen] as const;
}

/** Bare button, for use inside an existing `<Providers>` tree. `code` renders the current locale code for the navbar pill. */
export function LocaleSwitchButton({ variant = 'icon' }: { variant?: 'icon' | 'code' }) {
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useExclusiveOpen();
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {variant === 'code' ? (
          <button
            type="button"
            aria-label={`${locale.toUpperCase()} ${m.locale_switch_label()}`}
            className={cn(PILL_ITEM, 'h-7 px-2 font-mono text-xs uppercase')}
          >
            {locale}
          </button>
        ) : (
          <Button variant="ghost" size="icon" aria-label={m.locale_switch_label()}>
            <Languages className="size-4" aria-hidden="true" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-48 border-0 p-1 shadow-lg ring-0">
        <ul role="listbox" aria-label={m.locale_switch_label()} className="flex flex-col">
          {LOCALES.map((code) => (
            <li key={code} role="option" aria-selected={code === locale}>
              <button
                type="button"
                lang={code}
                onClick={() => {
                  void setLocale(code);
                  setOpen(false);
                }}
                className={cn(
                  'w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground',
                  code === locale && 'bg-accent font-medium text-accent-foreground',
                )}
              >
                {LOCALE_NAMES[code]}
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

/** Self-contained island: mount with `client:load`. */
export default function LocaleSwitch() {
  return (
    <Providers>
      <LocaleSwitchButton />
    </Providers>
  );
}
