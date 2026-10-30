/**
 * Hybrid search, fully in the browser: Pagefind (keyword) + MiniLM embeddings (semantic), merged with RRF (k = 60).
 * Keyword search never waits on the model. The model loads lazily on the first query via `warmModel()`.
 * Contract + build steps: `.agents/docs/search.md`.
 */

export type SearchType = 'page' | 'publication' | 'talk';
export type SearchStatus = 'idle' | 'keyword' | 'warming' | 'hybrid';

export interface SearchResult {
  url: string;
  title: string;
  type: SearchType;
  excerpt: string;
  /** Which layers returned this page. */
  sources: ('keyword' | 'semantic')[];
}

export const RRF_K = 60;
const MODEL = 'Xenova/all-MiniLM-L6-v2';
/** Cosine floor for a semantic hit. Below this the chunk is noise, not a match. */
const MIN_SIMILARITY = 0.28;
const MAX_RESULTS = 8;

interface PagefindApi {
  debouncedSearch: (
    q: string,
    opts?: object,
    wait?: number,
  ) => Promise<{ results: { data: () => Promise<PagefindData> }[] } | null>;
}
interface PagefindData {
  url: string;
  excerpt: string;
  meta: { title?: string; type?: string };
}
interface EmbeddingItem {
  url: string;
  title: string;
  type: SearchType;
  s: string;
  v: number[];
}

export const normalizeUrl = (url: string) => {
  // No lookbehind: Safari <16.4 fails the whole chunk at parse time.
  const clean = url.replace(/[?#].*$/, '').replace(/(\/index)?\.html$/, '');
  return (clean.length > 1 ? clean.replace(/\/$/, '') : clean) || '/';
};

let pagefind: Promise<PagefindApi | null> | undefined;
/** Resolves `null` when no index exists (dev server before `pnpm build`). */
export function loadPagefind(): Promise<PagefindApi | null> {
  const url: string = '/pagefind/pagefind.js';
  pagefind ??= import(/* @vite-ignore */ url).then(
    (m) => m as PagefindApi,
    () => null,
  );
  return pagefind;
}

export async function keywordSearch(query: string): Promise<SearchResult[] | null> {
  const pf = await loadPagefind();
  if (!pf) return null;
  const res = await pf.debouncedSearch(query, {}, 60);
  if (!res) return null;
  const data = await Promise.all(res.results.slice(0, MAX_RESULTS).map((r) => r.data()));
  return data.map((d) => ({
    url: normalizeUrl(d.url),
    title: d.meta.title ?? d.url,
    type: (d.meta.type as SearchType | undefined) ?? 'page',
    excerpt: d.excerpt,
    sources: ['keyword'],
  }));
}

// ---------------------------------------------------------------- semantic layer

interface Model {
  embed: (text: string) => Promise<Float32Array>;
  items: EmbeddingItem[];
}

let model: Promise<Model> | undefined;
let modelState: 'cold' | 'warming' | 'warm' | 'failed' = 'cold';
const listeners = new Set<() => void>();
const setModelState = (s: typeof modelState) => {
  modelState = s;
  listeners.forEach((l) => l());
};

export const subscribeModel = (l: () => void) => {
  listeners.add(l);
  return () => void listeners.delete(l);
};
export const getModelState = () => modelState;

/** Starts the download once. Never throws: failure leaves keyword search in place. */
export function warmModel(): Promise<Model | null> {
  if (!model) {
    setModelState('warming');
    model = (async () => {
      const [{ env, pipeline }, corpus] = await Promise.all([
        import('@huggingface/transformers'),
        fetch('/embeddings.json').then((r) => {
          if (!r.ok) throw new Error('embeddings.json missing');
          return r.json() as Promise<{ items: EmbeddingItem[] }>;
        }),
      ]);
      env.allowLocalModels = false;
      const extractor = await pipeline('feature-extraction', MODEL, {
        dtype: 'q8',
        device: 'wasm',
      });
      const embed = async (text: string) => {
        const out = await extractor(text, { pooling: 'mean', normalize: true });
        return out.data as Float32Array;
      };
      await embed('warmup');
      return { embed, items: corpus.items };
    })();
    model.then(
      () => setModelState('warm'),
      () => setModelState('failed'),
    );
  }
  return model.catch(() => null);
}

/** Best chunk per page, ranked by cosine similarity. */
export async function semanticSearch(query: string): Promise<SearchResult[]> {
  const m = await warmModel();
  if (!m) return [];
  const q = await m.embed(query);
  const best = new Map<string, { score: number; item: EmbeddingItem }>();
  for (const item of m.items) {
    let dot = 0;
    for (let i = 0; i < q.length; i++) dot += (q[i] ?? 0) * (item.v[i] ?? 0);
    const score = dot / 127;
    const cur = best.get(item.url);
    if (!cur || score > cur.score) best.set(item.url, { score, item });
  }
  return [...best.values()]
    .filter((b) => b.score >= MIN_SIMILARITY)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RESULTS)
    .map(({ item }) => ({
      url: normalizeUrl(item.url),
      title: item.title,
      type: item.type,
      excerpt: item.s.replace(/&/g, '&amp;').replace(/</g, '&lt;'),
      sources: ['semantic'],
    }));
}

/** Reciprocal rank fusion: score(page) = sum over lists of 1 / (k + rank). Ranks are 1-based. */
export function rrf(lists: SearchResult[][], k = RRF_K): SearchResult[] {
  const merged = new Map<string, { score: number; result: SearchResult }>();
  for (const list of lists) {
    list.forEach((r, i) => {
      const add = 1 / (k + i + 1);
      const cur = merged.get(r.url);
      if (!cur) merged.set(r.url, { score: add, result: { ...r, sources: [...r.sources] } });
      else {
        cur.score += add;
        for (const s of r.sources) if (!cur.result.sources.includes(s)) cur.result.sources.push(s);
        // Prefer Pagefind's highlighted excerpt over the plain semantic snippet.
        if (r.sources.includes('keyword')) cur.result.excerpt = r.excerpt;
      }
    });
  }
  return [...merged.values()].sort((a, b) => b.score - a.score).map((m) => m.result);
}
