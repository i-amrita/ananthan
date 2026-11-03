/**
 * Shared look for the photography masonry (drawer and page): large rounded tiles of mixed heights
 * with three small dots under each, as in the owner's reference. The heights come from a fixed
 * width/height cycle so the layout is the same on every build, whatever the source photo's shape.
 */
const TILE_RATIOS = [0.8, 1.04, 1.04, 0.56, 0.61, 0.56] as const;

/** CSS `aspect-ratio` (width / height) for the tile at `index`. */
export function tileRatio(index: number): number {
  return TILE_RATIOS[index % TILE_RATIOS.length] ?? 1;
}

/** Tile corner radius and the shared image fit. */
export const TILE_IMG = 'block w-full rounded-3xl bg-surface-muted object-cover object-center';

/** The three dots under a tile. Decorative. */
export function TileDots() {
  return (
    <span aria-hidden="true" className="mt-2 mr-2 flex justify-end gap-1" data-photo-dots>
      <i className="size-1.5 rounded-full bg-muted-foreground/60" />
      <i className="size-1.5 rounded-full bg-muted-foreground/60" />
      <i className="size-1.5 rounded-full bg-muted-foreground/60" />
    </span>
  );
}
