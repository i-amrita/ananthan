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
const NEEDLE = '#e0533d';

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

/** The focus ruler along the bottom edge: ticks every 20px, majors every 100px, a red needle at the centre. */
function rulerSvg(): string {
  const w = OG_SIZE.width;
  let ticks = '';
  for (let x = 0; x <= w; x += 20) {
    const major = x % 100 === 0;
    ticks += `<line x1="${x}" y1="52" x2="${x}" y2="${major ? 78 : 66}" stroke="${FG}" stroke-width="${major ? 2 : 1}" opacity="${major ? 0.7 : 0.4}"/>`;
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="120" viewBox="0 0 ${w} 120">` +
    `<line x1="0" y1="52" x2="${w}" y2="52" stroke="${FG}" stroke-width="2" opacity="0.7"/>${ticks}` +
    `<line x1="${w / 2}" y1="0" x2="${w / 2}" y2="120" stroke="${NEEDLE}" stroke-width="3"/>` +
    `<circle cx="${w / 2}" cy="52" r="7" fill="${FG}"/></svg>`
  );
}

const RULER_URI = `data:image/svg+xml;utf8,${encodeURIComponent(rulerSvg())}`;

export async function renderOg({ eyebrow, title, subtitle }: OgCard): Promise<Uint8Array> {
  const tree = el(
    'div',
    {
      width: OG_SIZE.width,
      height: OG_SIZE.height,
      flexDirection: 'column',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxSizing: 'border-box',
      paddingTop: 56,
      background: PAGE,
      fontFamily: 'Fraunces',
      color: FG,
    },
    [
      el('div', { fontSize: 26, color: MUTED, letterSpacing: 2 }, 'ananthan.nambiar.my'),
      el(
        'div',
        { flexDirection: 'column', alignItems: 'center', gap: 24, textAlign: 'center' },
        [
          eyebrow
            ? el(
                'div',
                { fontSize: 26, color: BRAND, textTransform: 'uppercase', letterSpacing: 4 },
                eyebrow,
              )
            : null,
          el('div', { fontSize: title.length > 28 ? 76 : 112, lineHeight: 1.05 }, title),
          subtitle
            ? el('div', { fontSize: 36, color: MUTED, lineHeight: 1.3, maxWidth: 900 }, subtitle)
            : null,
        ].filter(Boolean),
      ),
      {
        type: 'img',
        props: { src: RULER_URI, width: OG_SIZE.width, height: 120, style: { display: 'flex' } },
      },
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
