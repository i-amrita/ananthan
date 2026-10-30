import { Search } from 'lucide-react';
import { useQueryStates } from 'nuqs';
import type { CSSProperties } from 'react';

import { Button } from '@/components/ui/button';
import { m, useLocale } from '@/lib/i18n';
import { urlStateParsers } from '@/lib/url-state';

import { ResultBody, ResultIcon, SearchEmpty, SearchPill } from './SearchParts';
import { useSearch } from './use-search';

/** Input, mode toggle, status pill and result links. Shared by the overlay and the `/search` page. */
export function SearchPanel({ autoFocus = false }: { autoFocus?: boolean }) {
  useLocale();
  const [{ q, mode }, setState] = useQueryStates(urlStateParsers);
  const keywordOnly = mode === 'keyword';
  const query = q ?? '';
  const { status, results, indexAvailable, ms } = useSearch(query, !keywordOnly);

  return (
    <div className="flex min-w-0 flex-col gap-3" data-search-panel data-status={status}>
      <form
        action="/search"
        method="get"
        role="search"
        className="flex flex-col gap-3"
        onSubmit={(e) => e.preventDefault()}
      >
        <div className="relative flex items-center gap-2 overflow-hidden rounded-card border border-border bg-surface px-3 focus-within:border-brand">
          <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <input
            name="q"
            type="text"
            value={query}
            autoFocus={autoFocus}
            autoComplete="off"
            placeholder={m.search_placeholder()}
            aria-label={m.nav_search()}
            onChange={(e) => void setState({ q: e.target.value || null })}
            className="h-11 w-full bg-transparent text-sm text-fg outline-none placeholder:text-muted-foreground"
          />
          {status === 'warming' && !keywordOnly && (
            <span className="progress-sweep" aria-hidden="true" />
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SearchPill status={status} keywordOnly={keywordOnly} />
          <div className="flex items-center gap-1">
            {ms !== null && status !== 'idle' && (
              <span className="mr-2 font-key text-xs text-muted-foreground">{ms} ms</span>
            )}
            <Button
              type="button"
              size="sm"
              variant={keywordOnly ? 'ghost' : 'secondary'}
              aria-pressed={!keywordOnly}
              onClick={() => void setState({ mode: 'ai' })}
            >
              {m.search_mode_ai()}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={keywordOnly ? 'secondary' : 'ghost'}
              aria-pressed={keywordOnly}
              onClick={() => void setState({ mode: 'keyword' })}
            >
              {m.search_mode_keyword()}
            </Button>
          </div>
        </div>
        {/* Enter submits via the input; the explicit control satisfies form audits and AT. */}
        <button type="submit" className="sr-only">
          Submit search
        </button>
      </form>
      {status === 'idle' ? (
        <p className="px-1 text-sm text-muted-foreground">{m.search_hint()}</p>
      ) : results.length === 0 ? (
        <SearchEmpty query={query} indexAvailable={indexAvailable} />
      ) : (
        <ul className="flex flex-col gap-1" data-search-results>
          {results.map((r, i) => (
            <li key={r.url} className="item-in" style={{ '--i': Math.min(i, 6) } as CSSProperties}>
              <a
                href={r.url}
                className="flex items-start gap-3 rounded-card px-3 py-2 hover:bg-surface-muted focus-visible:bg-surface-muted focus-visible:outline-none"
              >
                <ResultIcon
                  type={r.type}
                  className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                />
                <ResultBody result={r} />
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
