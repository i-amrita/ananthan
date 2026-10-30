import { useCallback, useEffect, useRef, useState } from 'react';

import { m, useLocale } from '@/lib/i18n';

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

/**
 * Photo grid plus a native `<dialog>` lightbox. No library: the dialog handles focus trapping and
 * the Escape key on its own. Arrow keys move between frames.
 */
export function PhotoLightbox({ photos }: { photos: PhotoItem[] }) {
  return (
    <Providers>
      <Lightbox photos={photos} />
    </Providers>
  );
}

/** Inner component: `useLocale` needs the nuqs adapter above it, so it lives one level down. */
function Lightbox({ photos }: { photos: PhotoItem[] }) {
  useLocale();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);

  const open = useCallback((i: number) => {
    setIndex(i);
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
  }, []);

  const close = useCallback(() => {
    dialogRef.current?.close();
  }, []);

  const step = useCallback(
    (delta: number) => {
      if (photos.length === 0) return;
      setIndex((i) => (i + delta + photos.length) % photos.length);
    },
    [photos.length],
  );

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

  const photo = photos[index];

  return (
    <>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3" data-photo-grid>
        {photos.map((p, i) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => open(i)}
              aria-label={`${m.photography_open()}: ${p.caption}`}
              className="group block w-full cursor-zoom-in overflow-hidden rounded-card border border-border bg-surface-muted text-left transition-[transform,border-color] duration-300 ease-(--ease-spring) hover:-translate-y-0.5 hover:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              data-photo-thumb
              data-photo-id={p.id}
            >
              <img
                src={p.image}
                alt={p.alt}
                width={p.width}
                height={p.height}
                loading="lazy"
                decoding="async"
                className="block h-full w-full object-cover"
              />
              <span className="block px-2 py-1.5 text-xs text-muted-foreground">{p.caption}</span>
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        aria-label={m.photography_lightbox_label()}
        data-photo-dialog
        className="m-auto max-h-dvh w-[min(96vw,1100px)] max-w-none border-0 bg-transparent p-0 backdrop:bg-black/80"
      >
        {photo && (
          <div className="flex flex-col gap-3">
            <img
              src={photo.image}
              alt={photo.alt}
              width={photo.width}
              height={photo.height}
              data-photo-full
              className="max-h-[78dvh] w-full rounded-card object-contain"
            />
            <div className="flex items-center justify-between gap-4 text-sm text-white">
              <span data-photo-caption>{photo.caption}</span>
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
