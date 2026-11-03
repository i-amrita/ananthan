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

/** Focus-distance stops, text only. One per panel, in panel order. The ruler shows these
    numbers as its ticks; the section names live in the aria text only. */
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
 * The photography drawer masonry: the photos collection (placeholder frames today, the owner's
 * real frames later) plus the real scans in `public/photos/` that the hero panels used. The
 * scans are owner-supplied stills; neutral alt text, no claims.
 */
export async function getPhotoTeasers(): Promise<PhotoTeaser[]> {
  const collection = await getPhotos();
  const fromCollection: PhotoTeaser[] = collection.map((p) => ({
    id: p.id,
    src: p.data.image,
    alt: p.data.alt,
    width: p.data.width,
    height: p.data.height,
  }));
  return [...SCAN_PHOTOS, ...fromCollection];
}

/** Real owner-supplied scans already in `public/photos/`, reused for the drawer masonry. */
const SCAN_PHOTOS: PhotoTeaser[] = [
  {
    id: 'scan-2024-09-15',
    src: '/photos/2024-09-15-1.webp',
    alt: 'Colour photograph of a row of houses beside railway tracks under a cloudy sky.',
    width: 1000,
    height: 660,
  },
  {
    id: 'scan-2024-10-10',
    src: '/photos/2024-10-10-1.webp',
    alt: 'Black-and-white photograph of a bearded person sitting on a chair in a glass-walled lobby.',
    width: 1080,
    height: 720,
  },
  {
    id: 'scan-2024-10-16-1',
    src: '/photos/2024-10-16-1.webp',
    alt: 'Black-and-white photograph of a laboratory bench with a benchtop centrifuge and glassware by a window.',
    width: 1080,
    height: 720,
  },
  {
    id: 'scan-2024-10-16-3',
    src: '/photos/2024-10-16-3.webp',
    alt: 'Black-and-white photograph of a seated person holding an ear of corn.',
    width: 1080,
    height: 720,
  },
];

/** Counts for the research panel lead line. Facts only, straight from the collections. */
export async function getResearchCounts() {
  const [publications, talks, courses] = await Promise.all([
    getPublications(),
    getTalks(),
    getCourses(),
  ]);
  return { publications: publications.length, talks: talks.length, courses: courses.length };
}
