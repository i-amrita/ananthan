/**
 * Build-time corpus for the semantic layer. `scripts/build-embeddings.ts` reads this file from `dist/`,
 * embeds every chunk, writes `dist/embeddings.json`, then deletes the corpus. It is not a public API.
 */
import { getSitePages } from '@/lib/content';

export interface CorpusChunk {
  url: string;
  title: string;
  type: 'page' | 'publication' | 'talk';
  text: string;
}

const MAX_CHARS = 900;

const typeOf = (section: string): CorpusChunk['type'] =>
  section === 'Research'
    ? 'publication'
    : section === 'Life' || section === 'Photography'
      ? 'talk'
      : 'page';

/** One head chunk (title + description) plus one chunk per `##` section, capped in length. */
function chunk(title: string, description: string, markdown: string) {
  const body = markdown.replace(/^# .*\n+/, '');
  const sections = body.split(/\n(?=## )/).map((s) => s.replace(/[#*_`>[\]]/g, '').trim());
  return [`${title}. ${description}`, ...sections.filter(Boolean)].map((t) =>
    t.replace(/\s+/g, ' ').slice(0, MAX_CHARS),
  );
}

export async function GET() {
  const pages = await getSitePages();
  const chunks: CorpusChunk[] = pages.flatMap((p) =>
    chunk(p.title, p.description, p.markdown).map((text) => ({
      url: p.path,
      title: p.title,
      type: typeOf(p.section),
      text,
    })),
  );
  return new Response(JSON.stringify(chunks), { headers: { 'Content-Type': 'application/json' } });
}
