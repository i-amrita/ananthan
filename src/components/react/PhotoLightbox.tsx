import { useQueryStates } from 'nuqs';
import { useCallback, useEffect, useRef, useState } from 'react';

import { TILE_IMG, TileDots, tileRatio } from '@/components/react/photo-masonry';
import { m, useLocale } from '@/lib/i18n';
import { urlStateParsers } from '@/lib/url-state';

import { Providers } from './Providers';

export interface PhotoItem {
  id: string;
  caption: string;
  alt: string;
  image: string;
  width: number;
  height: number;
  camera?: string;
}

/** Which CTA the grid ends with. The page links the Instagram; the drawer supplies its own. */
export function PhotoLightbox({
  photos,
  instagram,
}: {
  photos: PhotoItem[];
  instagram?: string | undefined;
}) {
  return (
    <Providers>
      <Lightbox photos={photos} instagram={instagram} />
    </Providers>
  );
}

/**
 * Inner component: `useLocale` needs the nuqs adapter above it, so it lives one level down.
 * Masonry grid plus a native `<dialog>` lightbox. No library: the dialog handles focus trapping
 * and the Escape key on its own. Arrow keys move between frames. The open frame is URL state
 * (`?photo=<id>`), so a lightbox view is linkable and Back closes it.
 */
function Lightbox({ photos, instagram }: { photos: PhotoItem[]; instagram?: string | undefined }) {
  useLocale();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);
  const [{ photo }, setState] = useQueryStates({
    photo: urlStateParsers.photo,
  });

  const open = useCallback(
    (i: number) => {
      setIndex(i);
      const dialog = dialogRef.current;
      if (!dialog) return;
      if (!dialog.open) dialog.showModal();
      void setState({ photo: photos[i]?.id ?? null });
    },
    [photos, setState],
  );

  const close = useCallback(() => {
    dialogRef.current?.close();
    void setState({ photo: null });
  }, [setState]);

  // A `?photo=<id>` deep link opens the dialog on that frame after hydration.
  useEffect(() => {
    if (!photo || dialogRef.current?.open) return;
    const i = photos.findIndex((p) => p.id === photo);
    if (i < 0) return;
    setIndex(i);
    dialogRef.current?.showModal();
  }, [photo, photos]);

  const step = useCallback(
    (delta: number) => {
      if (photos.length === 0) return;
      const next = (index + delta + photos.length) % photos.length;
      setIndex(next);
      void setState({ photo: photos[next]?.id ?? null });
    },
    [index, photos, setState],
  );

  // Back button / a manual URL edit closes the dialog (or opens it, see the effect above).
  useEffect(() => {
    if (photo || !dialogRef.current?.open) return;
    dialogRef.current?.close();
  }, [photo]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onKey = (e: KeyboardEvent) => {
      if (!dialog.open) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        step(1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        step(-1);
      }
    };
    dialog.addEventListener('keydown', onKey);
    return () => dialog.removeEventListener('keydown', onKey);
  }, [step]);

  const current = photos[index];

  return (
    <>
      <ul
        className="columns-2 gap-4 sm:columns-3 [&>li]:mb-5 [&>li]:break-inside-avoid"
        data-photo-grid
      >
        {photos.map((p, i) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => open(i)}
              aria-label={`${m.photography_open()}: ${p.caption || p.alt}`}
              className="group block w-full cursor-zoom-in overflow-hidden rounded-3xl text-left transition-transform duration-300 ease-(--ease-spring) hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              data-photo-thumb
              data-photo-id={p.id}
            >
              <img
                src={p.image}
                alt={p.alt}
                width={p.width}
                height={p.height}
                loading={i < 2 ? 'eager' : 'lazy'}
                decoding="async"
                style={{ aspectRatio: tileRatio(i) }}
                className={TILE_IMG}
              />
            </button>
            <TileDots />
          </li>
        ))}
      </ul>

      {instagram && (
        <a
          href={instagram}
          rel="noopener noreferrer"
          target="_blank"
          data-photo-instagram
          className="inline-flex min-h-11 w-fit items-center gap-2 self-start rounded-key bg-brand px-4 text-sm text-brand-fg transition-[background-color,transform] duration-300 ease-(--ease-spring) hover:bg-brand-hover active:scale-95 motion-reduce:transition-colors motion-reduce:active:scale-100"
        >
          {m.overlay_photography_instagram()}
          <span aria-hidden="true">→</span>
        </a>
      )}

      <dialog
        ref={dialogRef}
        aria-label={m.photography_lightbox_label()}
        data-photo-dialog
        className="m-auto max-h-dvh w-[min(96vw,1100px)] max-w-none border-0 bg-transparent p-0 backdrop:bg-black/80"
      >
        {current && (
          <div className="flex flex-col gap-3">
            <img
              src={current.image}
              alt={current.alt}
              width={current.width}
              height={current.height}
              data-photo-full
              className="max-h-[78dvh] w-full rounded-card object-contain"
            />
            <div className="flex items-center justify-between gap-4 text-sm text-white">
              <span data-photo-caption>{current.caption}</span>
              <span className="shrink-0 font-mono text-xs" data-photo-counter>
                {m.photography_counter({ index: index + 1, total: photos.length })}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label={m.photography_prev()}
                className="min-h-11 rounded-key bg-white/10 px-4 text-white transition-colors duration-300 ease-(--ease-spring) hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                ←
              </button>
              <button
                type="button"
                onClick={close}
                aria-label={m.action_close()}
                className="min-h-11 rounded-key bg-white/10 px-4 text-white transition-colors duration-300 ease-(--ease-spring) hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                {m.action_close()}
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label={m.photography_next()}
                className="min-h-11 rounded-key bg-white/10 px-4 text-white transition-colors duration-300 ease-(--ease-spring) hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                →
              </button>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
