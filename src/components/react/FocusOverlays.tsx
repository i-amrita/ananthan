import { useQueryStates } from 'nuqs';
import { useEffect, useState } from 'react';

import { ActionOverlay } from '@/components/react/ActionOverlay';
import { Providers } from '@/components/react/Providers';
import { m } from '@/lib/i18n';
import { type Overlay, urlStateParsers } from '@/lib/url-state';

/** Stub copy for the three overlays. Real teaser content lands in a later piece. */
const STUBS = {
  research: {
    title: () => m.overlay_research_title(),
    description: () => m.overlay_research_description(),
    readMore: () => m.overlay_research_read_more(),
    href: '/research',
  },
  life: {
    title: () => m.overlay_life_title(),
    description: () => m.overlay_life_description(),
    readMore: () => m.overlay_life_read_more(),
    href: '/life',
  },
  photography: {
    title: () => m.overlay_photography_title(),
    description: () => m.overlay_photography_description(),
    readMore: () => m.overlay_photography_read_more(),
    href: '/photography',
  },
} as const satisfies Record<
  Overlay,
  { title: () => string; description: () => string; readMore: () => string; href: string }
>;

/** Event a non-React script (the slider) fires to open a panel. Detail is the overlay name. */
export const OPEN_OVERLAY_EVENT = 'ananthan:open-overlay';

function isOverlay(value: unknown): value is Overlay {
  return typeof value === 'string' && value in STUBS;
}

/**
 * Island root for the hero overlays. `overlay` is URL state, so a deep link opens the panel
 * directly and Back closes it. `panel` stays owned by the slider script and is never touched here.
 */
function Overlays() {
  const [{ overlay }, setState] = useQueryStates(urlStateParsers);
  const [mounted, setMounted] = useState(false);
  const active = isOverlay(overlay) ? overlay : null;

  // The island renders nothing until it is mounted, so the server HTML and the first client
  // render agree and no hydration mismatch is logged. `data-overlay-ready` on <html> is the
  // signal that the open-overlay listener is live.
  useEffect(() => {
    setMounted(true);
    document.documentElement.dataset.overlayReady = '';
    return () => {
      delete document.documentElement.dataset.overlayReady;
    };
  }, []);

  // Opening from in-page code pushes a history entry, so Back closes the panel again.
  useEffect(() => {
    const onOpen = (event: Event) => {
      const name = (event as CustomEvent<unknown>).detail;
      if (isOverlay(name)) void setState({ overlay: name });
    };
    window.addEventListener(OPEN_OVERLAY_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_OVERLAY_EVENT, onOpen);
  }, [setState]);

  // Closing replaces the entry, so Back after a close does not reopen the panel.
  const close = () => {
    void setState({ overlay: null }, { history: 'replace' });
  };

  // While a panel is open the hero track must not scroll or take focus.
  useEffect(() => {
    const root = document.documentElement;
    const track = document.querySelector<HTMLElement>('[data-focus-track]');
    const release = () => {
      delete root.dataset.overlayOpen;
      if (track) {
        track.removeAttribute('inert');
        track.style.removeProperty('overflow');
      }
    };
    if (active === null) {
      release();
      return;
    }
    root.dataset.overlayOpen = '';
    if (track) {
      track.setAttribute('inert', '');
      track.style.overflow = 'hidden';
    }
    return release;
  }, [active]);

  if (!mounted || active === null) return null;
  const stub = STUBS[active];

  return (
    <ActionOverlay
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
      title={stub.title()}
      description={stub.description()}
    >
      <a
        href={stub.href}
        data-overlay-read-more
        className="inline-flex min-h-11 items-center gap-2 rounded-key border border-border px-4 hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
      >
        {stub.readMore()}
        <span aria-hidden="true">→</span>
      </a>
    </ActionOverlay>
  );
}

/** The one overlay island, mounted once from `Base.astro`. */
export function FocusOverlaysIsland() {
  return (
    <Providers>
      <Overlays />
    </Providers>
  );
}
