import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';

import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import Icons from 'unplugin-icons/vite';

const MIME = { '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css' };

/** Dev only: serve the search index from `dist/` (written by `pnpm build`), since Pagefind has no dev index. */
const searchIndexInDev = {
  name: 'search-index-in-dev',
  configureServer(server) {
    const dist = join(server.config.root, 'dist');
    server.middlewares.use((req, res, next) => {
      const path = (req.url ?? '').split('?')[0] ?? '';
      if (!path.startsWith('/pagefind/') && path !== '/embeddings.json') return next();
      const file = normalize(join(dist, path));
      if (!file.startsWith(dist) || !existsSync(file) || !statSync(file).isFile()) return next();
      res.setHeader('Content-Type', MIME[extname(file)] ?? 'application/octet-stream');
      createReadStream(file).pipe(res);
    });
  },
};

/**
 * onnxruntime-web's 27 MB wasm is emitted into `_astro/` by Vite, which exceeds Cloudflare Pages' 25 MiB file limit.
 * transformers.js loads the runtime from jsDelivr by default, so the bundled copy is a dead fallback. Drop it.
 */
const dropOrtWasm = {
  name: 'drop-ort-wasm',
  generateBundle(_options, bundle) {
    for (const key of Object.keys(bundle)) if (/ort-wasm.*\.wasm$/.test(key)) delete bundle[key];
  },
};

export default defineConfig({
  site: 'https://ananthan.nambiar.my',
  output: 'static',
  integrations: [
    react({
      include: ['**/react/**', '**/components/ui/**'],
      // React Compiler (Oxc-based in @astrojs/react 7), opt-in per component with 'use memo'. Compiling everything
      // memoized Paraglide `m.*()` calls (zero args, so the compiler treats them as constants) and froze island text
      // in the first locale.
      compiler: { compilationMode: 'annotation' },
    }),
    mdx(),
    sitemap({ filter: (page) => !page.includes('/dev/') && !page.includes('/404') }),
  ],
  vite: {
    // Pre-bundle every island dependency up front. When nuqs and friends were discovered lazily, Vite re-optimized mid-session
    // and produced a second React copy ("Invalid hook call", islands never hydrate).
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-dom/client',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'nuqs',
        'nuqs/adapters/react',
        'sonner',
        'clsx',
        'tailwind-merge',
        'class-variance-authority',
        'radix-ui',
        'lucide-react',
      ],
    },
    resolve: { dedupe: ['react', 'react-dom'] },
    plugins: [
      tailwindcss(),
      // `~icons/ph/<name>` imports compile to React components at build time (also used, SSR-only, inside .astro files).
      Icons({ compiler: 'jsx', jsx: 'react' }),
      searchIndexInDev,
      dropOrtWasm,
      // Compiles src/i18n/messages/*.json into src/i18n/paraglide (gitignored) at dev start and build.
      // `custom-query` is defined in src/lib/i18n.ts and reads `?locale=`; falls back to `en`.
      paraglideVitePlugin({
        project: './project.inlang',
        outdir: './src/i18n/paraglide',
        strategy: ['custom-query', 'baseLocale'],
      }),
    ],
  },
});
