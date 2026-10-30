/**
 * Single content source for HTML pages, `.md` companions, `llms.txt` and `llms-full.txt`.
 * Everything agent-facing is derived from these helpers; never hand-write markdown copies.
 */
import { getCollection, type CollectionEntry } from 'astro:content';

export const SITE_URL = 'https://annambiar.github.io';
export const SITE_NAME = 'Ananthan Nambiar';
export const SITE_SUMMARY =
  'Ananthan Nambiar: computational biologist working on machine learning for biological systems, and a film photographer, dancer, rower, cook and environmentalist.';

export type PublicationEntry = CollectionEntry<'publications'>;
export type TalkEntry = CollectionEntry<'talks'>;
export type CourseEntry = CollectionEntry<'courses'>;
export type FigureEntry = CollectionEntry<'figures'>;
export type PhotoEntry = CollectionEntry<'photos'>;

export const abs = (path: string) => new URL(path, SITE_URL).href;

/** Non-draft publications, newest first. */
export async function getPublications(): Promise<PublicationEntry[]> {
  const all = await getCollection('publications', (p) => !p.data.draft);
  return all.toSorted((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

/** Non-draft talks, newest first. */
export async function getTalks(): Promise<TalkEntry[]> {
  const all = await getCollection('talks', (t) => !t.data.draft);
  return all.toSorted((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

/** Non-draft courses, newest first. */
export async function getCourses(): Promise<CourseEntry[]> {
  const all = await getCollection('courses', (c) => !c.data.draft);
  return all.toSorted((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

/** Non-draft photos, in the order the owner placed them. */
export async function getPhotos(): Promise<PhotoEntry[]> {
  const all = await getCollection('photos', (p) => !p.data.draft);
  return all.toSorted((a, b) => a.data.order - b.data.order);
}

/** Figures for one route (`home`, `research`, `life`, `photography`). */
export async function getFigures(route: string): Promise<FigureEntry[]> {
  const all = await getCollection('figures', (f) => !f.data.draft && f.data.route === route);
  return all.toSorted((a, b) => a.data.order - b.data.order);
}

export const formatDate = (d: Date) => d.toISOString().slice(0, 10);

export const markdownResponse = (body: string) =>
  new Response(`${body}\n`, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });

const bullets = (items: string[]) => items.map((i) => `- ${i}`).join('\n');

/** One publication as a markdown list entry. Stable anchor: `/research#<id>`. */
export function publicationMarkdown(p: PublicationEntry): string {
  const d = p.data;
  const meta = [
    `Venue: ${d.venue}`,
    `Date: ${formatDate(d.date)}`,
    ...(d.authors ? [`Authors: ${d.authors}`] : []),
    ...(d.kind ? [`Kind: ${d.kind}`] : []),
    d.href,
  ];
  return [`### ${d.title}`, d.summary, bullets(meta)].filter(Boolean).join('\n\n');
}

export function talkMarkdown(t: TalkEntry): string {
  const d = t.data;
  const meta = [
    `Event: ${d.event}`,
    `Date: ${formatDate(d.date)}`,
    ...(d.kind ? [`Kind: ${d.kind}`] : []),
    ...(d.location ? [`Location: ${d.location}`] : []),
    ...(d.href ? [d.href] : []),
  ];
  return [`### ${d.title}`, d.summary, bullets(meta)].filter(Boolean).join('\n\n');
}

export function courseMarkdown(c: CourseEntry): string {
  const d = c.data;
  const meta = [
    `Institution: ${d.institution}`,
    `Date: ${formatDate(d.date)}`,
    ...(d.kind ? [`Kind: ${d.kind}`] : []),
    ...(d.href ? [d.href] : []),
  ];
  return [`### ${d.title}`, d.summary, bullets(meta)].filter(Boolean).join('\n\n');
}

export function photoMarkdown(p: PhotoEntry): string {
  const d = p.data;
  const meta = [`Image: ${d.image}`, `Alt: ${d.alt}`, ...(d.camera ? [`Camera: ${d.camera}`] : [])];
  return [`### ${d.caption}`, bullets(meta)].filter(Boolean).join('\n\n');
}

/** The `/research` companion: publications, then talks, then courses. */
const section = (heading: string, items: string[], empty: string) =>
  [`## ${heading}`, items.length ? items.join('\n\n') : empty].join('\n\n');

export async function researchMarkdown(): Promise<string> {
  const [publications, talks, courses] = await Promise.all([
    getPublications(),
    getTalks(),
    getCourses(),
  ]);
  return [
    '# Research',
    section(
      'Publications',
      publications.map((p) => publicationMarkdown(p)),
      'No publications yet.',
    ),
    section(
      'Talks',
      talks.map((t) => talkMarkdown(t)),
      'No talks yet.',
    ),
    section(
      'Courses',
      courses.map((c) => courseMarkdown(c)),
      'No courses yet.',
    ),
  ].join('\n\n');
}

/** The `/life` companion. */
export async function lifeMarkdown(): Promise<string> {
  return [
    '# Life',
    'Ananthan Nambiar is a computational biologist. Outside the lab he is a film photographer, a dancer, a rower, a cook and an environmentalist.',
    '## Hobbies',
    bullets([
      'Photography: film, mostly street and travel. The portfolio lives at https://nambiar4.myportfolio.com.',
      'Dance.',
      'Rowing.',
      'Cooking.',
      'Environmentalism.',
    ]),
  ].join('\n\n');
}

/** The `/photography` companion. */
export async function photographyMarkdown(): Promise<string> {
  const photos = await getPhotos();
  return [
    '# Photography',
    'A few frames from the camera. The full portfolio, and the copyright for every photo here, lives at https://nambiar4.myportfolio.com.',
    section(
      'Frames',
      photos.map((p) => photoMarkdown(p)),
      'No photos yet.',
    ),
  ].join('\n\n');
}

/** The `/` companion: who he is and where each route leads. */
export async function homeMarkdown(): Promise<string> {
  return [
    '# Ananthan Nambiar',
    SITE_SUMMARY,
    '## Routes',
    bullets([
      `- [Research](${abs('/research')}): publications, talks and courses.`,
      `- [Life](${abs('/life')}): the hobbies outside the lab.`,
      `- [Photography](${abs('/photography')}): a few frames, plus the full portfolio.`,
    ]),
  ].join('\n\n');
}

export interface SitePage {
  title: string;
  description: string;
  /** Canonical HTML path, e.g. `/research`. */
  path: string;
  /** Markdown companion path, e.g. `/research.md`. */
  mdPath: string;
  section: 'Pages' | 'Research' | 'Life' | 'Photography';
  markdown: string;
}

/** Every page on the site in llms order. Feeds `llms.txt` and `llms-full.txt`. */
export async function getSitePages(): Promise<SitePage[]> {
  const [research, life, photography, home] = await Promise.all([
    researchMarkdown(),
    lifeMarkdown(),
    photographyMarkdown(),
    homeMarkdown(),
  ]);
  return [
    {
      title: 'Home',
      description: SITE_SUMMARY,
      path: '/',
      mdPath: '/index.md',
      section: 'Pages',
      markdown: home,
    },
    {
      title: 'Research',
      description: 'Publications, talks and courses on machine learning for computational biology.',
      path: '/research',
      mdPath: '/research.md',
      section: 'Research',
      markdown: research,
    },
    {
      title: 'Life',
      description: 'Photography, dance, rowing, cooking and environmentalism.',
      path: '/life',
      mdPath: '/life.md',
      section: 'Life',
      markdown: life,
    },
    {
      title: 'Photography',
      description: 'A few frames from the camera, and the full portfolio.',
      path: '/photography',
      mdPath: '/photography.md',
      section: 'Photography',
      markdown: photography,
    },
  ];
}
