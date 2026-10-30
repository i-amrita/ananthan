import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { defineCollection } from 'astro:content';

/** Where a figure is drawn: the home hero or one of the content routes. */
const route = z.enum(['home', 'research', 'life', 'photography']);

/** Publications. Each is a card that links out to the paper; there is no detail page. */
const publications = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/publications' }),
  schema: z.object({
    title: z.string(),
    /** Journal or conference, e.g. `Structure`. */
    venue: z.string(),
    date: z.coerce.date(),
    /** One or two sentences on what the paper did. */
    summary: z.string().max(280),
    /** DOI, publisher page or preprint link. */
    href: z.url(),
    /** Author list as printed on the paper. */
    authors: z.string().optional(),
    /** `paper`, `preprint`, `book` or `editorial`. */
    kind: z.enum(['paper', 'preprint', 'book', 'editorial']).default('paper'),
    draft: z.boolean().default(false),
  }),
});

/** Conference talks, posters and invited sessions. */
const talks = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/talks' }),
  schema: z.object({
    title: z.string(),
    /** Conference or workshop name. */
    event: z.string(),
    date: z.coerce.date(),
    summary: z.string().max(280),
    /** `talk`, `poster` or `invited`. */
    kind: z.enum(['talk', 'poster', 'invited']).default('talk'),
    location: z.string().optional(),
    href: z.url().optional(),
    draft: z.boolean().default(false),
  }),
});

/** Courses and workshops he taught. */
const courses = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/courses' }),
  schema: z.object({
    title: z.string(),
    institution: z.string(),
    date: z.coerce.date(),
    summary: z.string().max(280),
    /** `course`, `workshop` or `tutorial`. */
    kind: z.enum(['course', 'workshop', 'tutorial']).default('course'),
    href: z.url().optional(),
    draft: z.boolean().default(false),
  }),
});

/**
 * Ink-brush background figures. One YAML file per figure: adding a figure is a content drop, never a code change.
 * `paths` are SVG path data drawn inside the `size` viewBox.
 */
const figures = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/figures' }),
  schema: z.object({
    /** Motif name, used as the figure id and its `data-motif` hook. */
    motif: z.string(),
    /** Human label for the figure. */
    label: z.string(),
    route,
    /** Ink weight, 0..1. Multiplies the stroke opacity. */
    weight: z.number().min(0).max(1).default(0.8),
    /** SVG path data, drawn inside the `size` viewBox. */
    paths: z.array(z.string()).min(1),
    /** viewBox width and height. */
    size: z.tuple([z.number(), z.number()]),
    /** Placement as a percentage of the field box. */
    position: z.object({ x: z.number(), y: z.number() }),
    /** Seconds before the draw-in starts. */
    delay: z.number().default(0),
    /** Render order inside the field. */
    order: z.number().int().default(0),
    draft: z.boolean().default(false),
  }),
});

/** Photographs. The image lives in `public/photos/`; `alt` is required. */
const photos = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/photos' }),
  schema: z.object({
    caption: z.string(),
    /** Required. Describe the frame, never the mood. */
    alt: z.string().min(1),
    /** Path under `public/`, e.g. `/photos/frame-01.jpg`. */
    image: z.string().startsWith('/'),
    /** Width and height in pixels, for the lightbox layout. */
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    /** Camera and film, when known. */
    camera: z.string().optional(),
    order: z.number().int().default(0),
    draft: z.boolean().default(false),
  }),
});

export const collections = { publications, talks, courses, figures, photos };
