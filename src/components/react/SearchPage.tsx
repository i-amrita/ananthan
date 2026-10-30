import { Providers } from './Providers';
import { SearchPanel } from './SearchPanel';

/** Inline search for the `/search` route. Same panel as the overlay. */
export function SearchPage() {
  return (
    <Providers>
      <SearchPanel autoFocus />
    </Providers>
  );
}
