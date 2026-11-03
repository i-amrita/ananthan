/**
 * Build-time projection of the four landing panels. One ordered list drives the hero slider
 * markup, the ruler stops, the `?panel=` index and the drawer routes, so they cannot drift.
 * Teaser content for the drawers comes from the same collections the pages use, so teaser and
 * page cannot drift either — only the projection differs (drawer vs page).
 */
import { getCourses, getPhotos, getPublications, getTalks } from '@/lib/content';

/** The four panels, in the fixed order: Intro, Research, Photography, Life. */
export const PANELS = [
  { route: 'home' },
  { route: 'research' },
  { route: 'photography' },
  { route: 'life' },
] as const;

/** Slider route key: names the drawer (`?overlay=`) and the ruler label. */
export type PanelRoute = (typeof PANELS)[number]['route'];

/** Panel index for a route key. */
export const panelIndex = (route: PanelRoute) => PANELS.findIndex((p) => p.route === route);

/** Focus-distance stops, text only. One per panel, in panel order. */
export const FOCUS_STOPS = ['0.30', '0.50', '0.70', '1.00'] as const;

/** Drawer teaser: one research item as the drawer lists it. */
export interface ResearchTeaser {
  /** Title trimmed to ~80 chars with an ellipsis. */
  title: string;
  /** Full title, for the `title` attribute. */
  full: string;
  /** Venue (publications) or event (talks). */
  meta: string;
  href?: string;
}

/** Drawer teaser: one photo as the masonry shows it. */
export interface PhotoTeaser {
  id: string;
  src: string;
  alt: string;
  width: number;
  height: number;
}

/** Publications and talks feed the research drawer (the /research page keeps the fuller layout). */
export async function getResearchTeasers(): Promise<{
  publications: ResearchTeaser[];
  talks: ResearchTeaser[];
}> {
  const [publications, talks] = await Promise.all([getPublications(), getTalks()]);
  return {
    publications: publications.map((p) => ({
      title: trimTitle(p.data.title),
      full: p.data.title,
      meta: p.data.venue,
      href: p.data.href,
    })),
    talks: talks.map((t) => ({
      title: trimTitle(t.data.title),
      full: t.data.title,
      meta: t.data.event,
    })),
  };
}

/** Titles are trimmed at ~80 chars with an ellipsis; the full title travels in `full`. */
function trimTitle(title: string): string {
  return title.length <= 80 ? title : `${title.slice(0, 79).replace(/\s+\S*$/, '')}…`;
}

/**
 * The photography drawer masonry: the selected frames of the photos collection. The /photography
 * page lists the full set (non-draft); the drawer is the selection the owner marks `teaser`.
 * Placeholder frames and not-yet-described scans are only ever marked draft until the owner
 * supplies the real frames and alt text.
 */
export async function getPhotoTeasers(): Promise<PhotoTeaser[]> {
  const collection = await getPhotos();
  return collection
    .filter((p) => p.data.teaser)
    .map((p) => ({
      id: p.id,
      src: p.data.image,
      alt: p.data.alt,
      width: p.data.width,
      height: p.data.height,
    }));
}

/** Counts for the research panel lead line. Facts only, straight from the collections. */
export async function getResearchCounts() {
  const [publications, talks, courses] = await Promise.all([
    getPublications(),
    getTalks(),
    getCourses(),
  ]);
  return { publications: publications.length, talks: talks.length, courses: courses.length };
}
