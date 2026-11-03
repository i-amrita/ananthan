import { useQueryStates } from 'nuqs';
import { useEffect, useRef, useState } from 'react';

import { ActionOverlay } from '@/components/react/ActionOverlay';
import { Providers } from '@/components/react/Providers';
import { m } from '@/lib/i18n';
import type { PhotoTeaser, ResearchTeaser, ResearchTopic } from '@/lib/panels';
import { type Overlay, urlStateParsers } from '@/lib/url-state';

/** Drawer content, projected at build time from the same collections the pages use. */
export interface OverlayData {
  research: {
    topics: ResearchTopic[];
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

/**
 * A body string that is still an owner TODO. The `TODO(owner): ` marker is stripped, so the
 * placeholder reads as a muted draft note with a draft tag, never as finished copy.
 */
function draftBody(body: string): { draft: boolean; text: string } {
  const match = /^TODO\([^)]*\):\s*(.*)$/s.exec(body);
  return match?.[1] !== undefined ? { draft: true, text: match[1] } : { draft: false, text: body };
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

/** Research drawer: the topics, then publications and talks, titles trimmed with the full title in `title`. */
function ResearchDrawer({ data }: { data: OverlayData['research'] }) {
  return (
    <div className="flex flex-col gap-6">
      <ReadMore overlay="research" />
      {data.topics.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="font-key text-xs tracking-wide text-muted-foreground uppercase">
            {m.hero_research_topics_heading()}
          </h3>
          <ul className="flex flex-col gap-2" data-research-topics>
            {data.topics.map((t) => (
              <li key={t.key} className="text-sm leading-relaxed text-fg">
                {t.text}
              </li>
            ))}
          </ul>
        </section>
      )}
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
          <li
            key={p.id}
            className="mb-3 break-inside-avoid"
            {...(p.placeholder ? { 'data-photo-placeholder': '' } : {})}
          >
            <img
              src={p.src}
              alt={p.alt}
              width={p.width}
              height={p.height}
              loading="lazy"
              decoding="async"
              className="block h-auto w-full rounded-card border border-border bg-surface-muted object-cover"
              data-photo-tile
            />
            {p.placeholder && (
              <span className="mt-1 block text-xs tracking-wide text-muted-foreground uppercase">
                {m.overlay_photography_placeholder()}
              </span>
            )}
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
          {data.hobbies.map((h) => {
            const { draft, text } = draftBody(h.body);
            return (
              <div
                key={h.key}
                className="flex flex-col gap-0.5"
                {...(draft ? { 'data-draft': '' } : {})}
              >
                <dt className="font-display text-lg">{h.title}</dt>
                <dd
                  className={`text-sm leading-relaxed ${draft ? 'text-muted-foreground italic' : 'text-muted-foreground'}`}
                >
                  {draft && (
                    <span
                      data-draft-tag
                      className="mr-2 inline-block rounded-full border border-border px-2 py-0.5 align-middle text-[10px] tracking-wide text-muted-foreground uppercase not-italic"
                    >
                      {m.overlay_draft_tag()}
                    </span>
                  )}
                  {text}
                </dd>
              </div>
            );
          })}
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
  const [{ overlay, scroll }, setState] = useQueryStates(urlStateParsers);
  const [mounted, setMounted] = useState(false);
  // The last non-null overlay; the shell renders it while the exit animation plays.
  const [rendered, setRendered] = useState<Overlay | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const active = isOverlay(overlay) ? overlay : null;
  // The offset the URL asks for. `scroll` is replace state, so it never creates its own history
  // entry and Back/Forward re-run the restore through the overlay/panel entries around it.
  const wantScroll = active === null ? null : (scroll ?? 0);
  /** Pending scroll restore: the offset the URL asked for, in px. */
  const pendingScroll = useRef<number | null>(null);
  pendingScroll.current = wantScroll;

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

  // While a panel is open the hero track must not scroll or take focus. The hold is marked on
  // the track, so the sound gate (which shares the `inert` attribute) knows the freeze is not
  // its own and leaves it alone.
  useEffect(() => {
    const root = document.documentElement;
    const track = document.querySelector<HTMLElement>('[data-focus-track]');
    const release = () => {
      delete root.dataset.overlayOpen;
      if (track) {
        track.removeAttribute('data-overlay-held');
        // The sound gate puts `inert` back if it is still holding the track.
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
      track.setAttribute('data-overlay-held', '');
      track.setAttribute('inert', '');
      track.style.overflow = 'hidden';
    }
    return release;
  }, [active]);

  if (!mounted || rendered === null) return null;

  return (
    <RestoreScroll target={pendingScroll} active={active !== null} setState={setState}>
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
    </RestoreScroll>
  );
}

/**
 * P7 scroll persistence. The panel element is the scroll container (`overflow-y-auto` on the
 * dock, the sheet body on mobile), so the offset is read from and written to it.
 *
 * Restore is the race: at mount the drawer has been laid out by the browser but the images
 * inside it (the photography masonry) have no intrinsic height yet, so the requested offset may
 * be beyond the current scroll range. The restore retries on each `load`/`resize` until the
 * panel is scrollable to the target or the budget runs out. Writing happens throttled and with
 * `history: replace`, so Back does not step through every scroll pixel.
 */
function RestoreScroll({
  target,
  active,
  setState,
  children,
}: {
  target: React.RefObject<number | null>;
  active: boolean;
  setState: ReturnType<typeof useQueryStates<typeof urlStateParsers>>[1];
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!active) return;
    const body = () => document.querySelector<HTMLElement>('[data-overlay-body]');
    let tries = 0;
    let timer = 0;
    let el: HTMLElement | null = null;
    /** Throttle handle for writing the drawer scroll offset back to the URL. */
    let write = 0;

    const want = target.current;
    if (want && want > 0) {
      // The drawer body is portalled and mounts a tick after the URL flips, and the content
      // inside it (the photography masonry) has no intrinsic height until the images load, so
      // the requested offset may be past the end of the scroll range. Retry until the body is
      // long enough (or the budget runs out) and then apply the offset.
      const apply = () => {
        el = body();
        if (!el) return false;
        const max = el.scrollHeight - el.clientHeight;
        if (max < want && tries++ < 60) return false;
        el.scrollTop = want;
        // Keep applying while images load: the masonry grows and the clamped offset can fall
        // behind the requested one for a few frames.
        if (tries++ < 60) timer = window.setTimeout(apply, 120);
        return true;
      };
      if (!apply()) {
        const retry = () => {
          if (apply()) return;
          timer = window.setTimeout(retry, 100);
        };
        timer = window.setTimeout(retry, 100);
        window.addEventListener('load', retry, { once: true });
        return () => {
          window.clearTimeout(timer);
          window.removeEventListener('load', retry);
        };
      }
    }
    // A deep-link restore and the write-back listener must not fight: the listener only attaches
    // after the restore settles (or when there is nothing to restore).
    const onScroll = () => {
      if (write) return;
      write = window.setTimeout(() => {
        write = 0;
        const top = Math.round(el?.scrollTop ?? 0);
        void setState({ scroll: top > 4 ? top : null }, { history: 'replace' });
      }, 250);
    };
    const attach = () => {
      if (!el) el = body();
      if (!el) {
        if (tries++ < 60) timer = window.setTimeout(attach, 50);
        return;
      }
      el.addEventListener('scroll', onScroll, { passive: true });
    };
    attach();
    return () => {
      el?.removeEventListener('scroll', onScroll);
      window.clearTimeout(timer);
      window.clearTimeout(write);
    };
    // `active` is the gate: the effect reruns when the drawer opens or closes.
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- target/setState are stable refs/setters
  }, [active]);

  return <>{children}</>;
}

/** The one overlay island, mounted once from `Base.astro`. */
export function FocusOverlaysIsland({ data }: { data: OverlayData }) {
  return (
    <Providers>
      <Overlays data={data} />
    </Providers>
  );
}
