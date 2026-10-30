import { FileText, Microscope, Presentation, Sparkles } from 'lucide-react';

import { m, useLocale } from '@/lib/i18n';
import type { SearchResult, SearchStatus, SearchType } from '@/lib/search';
import { cn } from '@/lib/utils';

const TYPE_ICON: Record<SearchType, typeof FileText> = {
  page: FileText,
  publication: Microscope,
  talk: Presentation,
};
const typeLabel = (type: SearchType) =>
  type === 'page'
    ? m.search_type_page()
    : type === 'publication'
      ? m.search_type_publication()
      : m.search_type_talk();

/** Header pill. Changes label once the model is warm; `key` re-triggers the entrance animation. */
export function SearchPill({
  status,
  keywordOnly = false,
}: {
  status: SearchStatus;
  keywordOnly?: boolean;
}) {
  useLocale();
  const label = keywordOnly
    ? m.search_pill_keyword()
    : status === 'hybrid'
      ? m.search_found()
      : status === 'warming'
        ? m.search_pill_warming()
        : m.search_pill_ai();
  return (
    <span
      key={label}
      data-search-pill
      data-status={status}
      className={cn(
        'inline-flex animate-pill-in items-center gap-1.5 rounded-key border px-2 py-0.5 font-key text-xs',
        status === 'hybrid' && !keywordOnly
          ? 'border-brand bg-brand-soft text-brand'
          : 'border-border bg-surface-muted text-muted-foreground',
      )}
      aria-live="polite"
    >
      {status === 'warming' && !keywordOnly ? (
        <span className="size-1.5 animate-pulse rounded-full bg-brand" aria-hidden />
      ) : (
        <Sparkles className="size-3" aria-hidden />
      )}
      {label}
    </span>
  );
}

export function ResultIcon({ type, className }: { type: SearchType; className?: string }) {
  const Icon = TYPE_ICON[type];
  return <Icon className={className} aria-hidden />;
}

export function ResultBody({ result }: { result: SearchResult }) {
  useLocale();
  return (
    <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
      <span className="flex items-center gap-2">
        <span className="truncate font-medium text-fg">{result.title}</span>
        <span className="rounded-key bg-surface-muted px-1.5 font-key text-[10px] uppercase text-muted-foreground">
          {typeLabel(result.type)}
        </span>
      </span>
      <span
        className="line-clamp-2 text-xs text-muted-foreground [&_mark]:rounded-sm [&_mark]:bg-brand-soft [&_mark]:text-brand"
        // Pagefind excerpts carry <mark>; semantic snippets are HTML-escaped in `semanticSearch`.
        dangerouslySetInnerHTML={{ __html: result.excerpt }}
      />
    </span>
  );
}

export function SearchEmpty({ query, indexAvailable }: { query: string; indexAvailable: boolean }) {
  useLocale();
  return (
    <p className="px-3 py-6 text-center text-sm text-muted-foreground">
      {!indexAvailable ? m.search_no_index() : m.search_empty({ query })}
    </p>
  );
}
