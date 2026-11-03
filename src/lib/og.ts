/**
 * Build-time Open Graph cards (1200x630 PNG). Used by the static endpoints under `src/pages/og/`.
 * satori lays out an element tree to SVG, resvg rasterises it. Fonts are the self-hosted @fontsource woff files.
 * Nothing runs at request time: Astro calls these once per page during `astro build`.
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';

export const OG_SIZE = { width: 1200, height: 630 } as const;

const PAGE = '#f5f1e8';
const FG = '#2b2b2b';
const BRAND = '#b45f42';
const MUTED = '#5c574c';

export interface OgCard {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}

const fontFile = (pkg: string, file: string) =>
  readFile(join(process.cwd(), 'node_modules', '@fontsource', pkg, 'files', file));

let fonts: Promise<Parameters<typeof satori>[1]['fonts']> | null = null;
const loadFonts = () =>
  (fonts ??= Promise.all([
    fontFile('fraunces', 'fraunces-latin-600-normal.woff'),
    fontFile('fraunces', 'fraunces-latin-400-normal.woff'),
  ]).then(([display, mono]) => [
    { name: 'Fraunces', data: display, weight: 600 as const, style: 'normal' as const },
    { name: 'Fraunces', data: mono, weight: 400 as const, style: 'normal' as const },
  ]));

type Node = { type: string; props: Record<string, unknown> };
const el = (type: string, style: Record<string, unknown>, children?: unknown): Node => ({
  type,
  props: { style: { display: 'flex', ...style }, ...(children !== undefined && { children }) },
});

export async function renderOg({ eyebrow, title, subtitle }: OgCard): Promise<Uint8Array> {
  const tree = el(
    'div',
    {
      width: OG_SIZE.width,
      height: OG_SIZE.height,
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: 80,
      boxSizing: 'border-box',
      background: PAGE,
      borderBottom: `14px solid ${BRAND}`,
      fontFamily: 'Fraunces',
      color: FG,
    },
    [
      el(
        'div',
        { flexDirection: 'column', gap: 28 },
        [
          eyebrow
            ? el(
                'div',
                {
                  fontFamily: 'Fraunces',
                  fontSize: 28,
                  color: BRAND,
                  textTransform: 'uppercase',
                },
                eyebrow,
              )
            : null,
          el('div', { fontSize: title.length > 28 ? 68 : 88, lineHeight: 1.08 }, title),
          subtitle ? el('div', { fontSize: 34, color: MUTED, lineHeight: 1.3 }, subtitle) : null,
        ].filter(Boolean),
      ),
      el('div', { fontFamily: 'Fraunces', fontSize: 26, color: MUTED }, 'ananthan.nambiar.my'),
    ],
  );
  const svg = await satori(tree as never, { ...OG_SIZE, fonts: await loadFonts() });
  return new Resvg(svg, {
    font: { loadSystemFonts: false },
    fitTo: { mode: 'width', value: OG_SIZE.width },
  })
    .render()
    .asPng();
}

export const pngResponse = (png: Uint8Array) =>
  new Response(png as BodyInit, { headers: { 'Content-Type': 'image/png' } });
