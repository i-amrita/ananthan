import { useQueryStates } from 'nuqs';
import { useEffect, useState } from 'react';

import { ActionOverlay } from '@/components/react/ActionOverlay';
import { Providers } from '@/components/react/Providers';
import { m } from '@/lib/i18n';
import type { PhotoTeaser, ResearchTeaser } from '@/lib/panels';
import { type Overlay, urlStateParsers } from '@/lib/url-state';

/** Drawer content, projected at build time from the same collections the pages use. */
export interface OverlayData {
  research: {
    publications: ResearchTeaser[];
    talks: ResearchTeaser[];
  };
  photography: {
    photos: PhotoTeaser[];
    /** The owner's Instagram, as given by the owner. */
    instagram: string;
  };
  life: {
    hobbies: { key: string; title: string; body: string }[];
    bio: string;
    career: string;
  };
}

/** Event a non-React script (the slider) fires to open a panel. Detail is the overlay name. */
export const OPEN_OVERLAY_EVENT = 'ananthan:open-overlay';

function isOverlay(value: unknown): value is Overlay {
  return typeof value === 'string' && value in OVERLAY_TITLES;
}

/** The drawer title per overlay. */
const OVERLAY_TITLES = {
  research: () => m.overlay_research_title(),
  life: () => m.overlay_life_title(),
  photography: () => m.overlay_photography_title(),
} as const satisfies Record<Overlay, () => string>;

const OVERLAY_DESCRIPTIONS = {
  research: () => m.overlay_research_description(),
  life: () => m.overlay_life_description(),
  photography: () => m.overlay_photography_description(),
} as const satisfies Record<Overlay, () => string>;

const OVERLAY_READ_MORE = {
  research: () => m.overlay_research_read_more(),
  life: () => m.overlay_life_read_more(),
  photography: () => m.overlay_photography_read_more(),
} as const satisfies Record<Overlay, () => string>;

/** The page each drawer links out to. */
const OVERLAY_HREF = {
  research: '/research',
  life: '/life',
  photography: '/photography',
} as const satisfies Record<Overlay, string>;

const LINK =
  'inline-flex min-h-11 w-fit items-center gap-2 rounded-key border border-border px-4 hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg';

/** The "See More" link sits above the body so it is reachable without scrolling (mobile-first). */
function ReadMore({ overlay, label }: { overlay: Overlay; label?: string }) {
  return (
    <a href={OVERLAY_HREF[overlay]} data-overlay-read-more className={LINK}>
      {label ?? OVERLAY_READ_MORE[overlay]()}
      <span aria-hidden="true">→</span>
    </a>
  );
}

/** One research row: the trimmed title, the full title in `title`, and the venue or event. */
function researchRow(item: ResearchTeaser) {
  return (
    <li key={`${item.meta}-${item.title}`} className="flex flex-col gap-0.5">
      {item.href ? (
        <a
          href={item.href}
          title={item.full}
          className="font-display text-base leading-snug text-fg underline decoration-border underline-offset-4 transition-colors duration-300 ease-(--ease-spring) hover:text-brand hover:decoration-brand"
        >
          {item.title}
        </a>
      ) : (
        <span title={item.full} className="font-display text-base leading-snug text-fg">
          {item.title}
        </span>
      )}
      <span className="text-xs text-muted-foreground">{item.meta}</span>
    </li>
  );
}

/** Research drawer: publications and talks, titles trimmed with the full title in `title`. */
function ResearchDrawer({ data }: { data: OverlayData['research'] }) {
  return (
    <div className="flex flex-col gap-6">
      <ReadMore overlay="research" />
      {data.publications.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="font-key text-xs tracking-wide text-muted-foreground uppercase">
            {m.overlay_research_publications()}
          </h3>
          <ul className="flex flex-col gap-3">{data.publications.map(researchRow)}</ul>
        </section>
      )}
      {data.talks.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="font-key text-xs tracking-wide text-muted-foreground uppercase">
            {m.overlay_research_talks()}
          </h3>
          <ul className="flex flex-col gap-3">{data.talks.map(researchRow)}</ul>
        </section>
      )}
      {data.publications.length === 0 && data.talks.length === 0 && (
        <p className="text-sm text-muted-foreground">{m.overlay_research_empty()}</p>
      )}
    </div>
  );
}

/** Photography drawer: a masonry of the frames, the Instagram CTA and the page link. */
function PhotographyDrawer({ data }: { data: OverlayData['photography'] }) {
  return (
    <div className="flex flex-col gap-5">
      <ReadMore overlay="photography" label={m.overlay_photography_page()} />
      <ul className="columns-2 gap-3 sm:columns-3" data-photo-masonry>
        {data.photos.map((p) => (
          <li key={p.id} className="mb-3 break-inside-avoid">
            <img
              src={p.src}
              alt={p.alt}
              width={p.width}
              height={p.height}
              loading="lazy"
              decoding="async"
              className="block w-full rounded-card border border-border bg-surface-muted"
              data-photo-tile
            />
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-3">
        <a
          href={data.instagram}
          rel="noopener noreferrer"
          target="_blank"
          data-overlay-instagram
          className="inline-flex min-h-11 items-center gap-2 rounded-key bg-brand px-4 text-sm text-brand-fg transition-[background-color,transform] duration-300 ease-(--ease-spring) hover:bg-brand-hover active:scale-95 motion-reduce:transition-colors motion-reduce:active:scale-100"
        >
          {m.overlay_photography_instagram()}
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </div>
  );
}

/** Life drawer: the same content as the /life page. */
function LifeDrawer({ data }: { data: OverlayData['life'] }) {
  return (
    <div className="flex flex-col gap-6">
      <ReadMore overlay="life" />
      <section className="flex flex-col gap-3">
        <h3 className="font-key text-xs tracking-wide text-muted-foreground uppercase">
          {m.overlay_life_hobbies_heading()}
        </h3>
        <dl className="flex flex-col gap-3">
          {data.hobbies.map((h) => (
            <div key={h.key} className="flex flex-col gap-0.5">
              <dt className="font-display text-lg">{h.title}</dt>
              <dd className="text-sm leading-relaxed text-muted-foreground">{h.body}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="flex flex-col gap-2">
        <h3 className="font-key text-xs tracking-wide text-muted-foreground uppercase">
          {m.overlay_life_bio_heading()}
        </h3>
        <p className="text-sm leading-relaxed">{data.bio}</p>
      </section>
      <section className="flex flex-col gap-2">
        <h3 className="font-key text-xs tracking-wide text-muted-foreground uppercase">
          {m.overlay_life_career_heading()}
        </h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{data.career}</p>
      </section>
    </div>
  );
}

/**
 * Island root for the hero overlays. `overlay` is URL state, so a deep link opens the panel
 * directly and Back closes it. `panel` stays owned by the slider script and is never touched here.
 *
 * The URL is cleared the moment the close starts, but the island keeps rendering the shell until
 * the exit animation finishes (`onExitComplete`), so the slide/fade out actually plays instead of
 * vanishing with the unmount.
 */
function Overlays({ data }: { data: OverlayData }) {
  const [{ overlay }, setState] = useQueryStates(urlStateParsers);
  const [mounted, setMounted] = useState(false);
  // The last non-null overlay; the shell renders it while the exit animation plays.
  const [rendered, setRendered] = useState<Overlay | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const active = isOverlay(overlay) ? overlay : null;

  // Track the last overlay so the shell can keep its copy on screen during the exit animation.
  useEffect(() => {
    if (active !== null) setRendered(active);
  }, [active]);

  // The open prop flips after the URL, so Radix starts the exit animation on this state.
  useEffect(() => {
    setShowPanel(active !== null);
  }, [active]);

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

  // Once the exit animation has run the stub copy can be dropped.
  const exitComplete = () => {
    setRendered(null);
    setShowPanel(false);
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

  if (!mounted || rendered === null) return null;

  return (
    <ActionOverlay
      open={showPanel}
      onOpenChange={(open) => {
        if (!open) close();
      }}
      onExitComplete={exitComplete}
      title={OVERLAY_TITLES[rendered]()}
      description={OVERLAY_DESCRIPTIONS[rendered]()}
    >
      {rendered === 'research' && <ResearchDrawer data={data.research} />}
      {rendered === 'photography' && <PhotographyDrawer data={data.photography} />}
      {rendered === 'life' && <LifeDrawer data={data.life} />}
    </ActionOverlay>
  );
}

/** The one overlay island, mounted once from `Base.astro`. */
export function FocusOverlaysIsland({ data }: { data: OverlayData }) {
  return (
    <Providers>
      <Overlays data={data} />
    </Providers>
  );
}
