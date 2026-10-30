import type { APIRoute } from 'astro';

import { abs, getSitePages, SITE_NAME, SITE_SUMMARY } from '@/lib/content';

const SECTIONS = ['Pages', 'Research', 'Life', 'Photography'] as const;

export const GET: APIRoute = async () => {
  const pages = await getSitePages();
  const out = [`# ${SITE_NAME}`, `> ${SITE_SUMMARY}`];
  for (const section of SECTIONS) {
    const items = pages.filter((p) => p.section === section);
    if (!items.length) continue;
    out.push(
      `## ${section}`,
      items.map((p) => `- [${p.title}](${abs(p.mdPath)}): ${p.description}`).join('\n'),
    );
  }
  out.push(
    '## Optional',
    `- [Full content](${abs('/llms-full.txt')}): every page as one markdown document`,
  );
  return new Response(`${out.join('\n\n')}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
