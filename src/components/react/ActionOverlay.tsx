import { Dialog } from 'radix-ui';
import * as React from 'react';

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHandle,
  DrawerOverlay,
  DrawerPortal,
  DrawerTitle,
} from '@/components/ui/drawer';
import { m } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/** SSR-safe `matchMedia(min-width)` hook: false on the server and on the first client render, then synced. */
function useMinWidth(px: number): boolean {
  const [matches, setMatches] = React.useState(false);
  React.useEffect(() => {
    const query = window.matchMedia(`(min-width: ${px}px)`);
    setMatches(query.matches);
    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [px]);
  return matches;
}

interface ActionOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: React.ReactNode;
}

/**
 * Shared panel shell: a vaul bottom sheet below 640px, a docked right Radix dialog from 640px.
 * The visible heading and subhead are the Radix title and description, so the dialog role is
 * labelled without duplicating the text for screen readers. The close button sits at the top of
 * the panel, so it is reachable by thumb on a phone.
 */
export function ActionOverlay({
  open,
  onOpenChange,
  title,
  description,
  children,
}: ActionOverlayProps) {
  const docked = useMinWidth(640);
  const closeLabel = m.overlay_close();

  const header = (titleNode: React.ReactNode, descriptionNode: React.ReactNode) => (
    <header className="flex items-start justify-between gap-4 px-5 pt-4 pb-2 sm:px-7 sm:pt-6">
      <div className="min-w-0">
        {titleNode}
        {descriptionNode}
      </div>
      <button
        type="button"
        aria-label={closeLabel}
        data-overlay-close
        onClick={() => onOpenChange(false)}
        className={cn(
          'mt-0.5 grid size-9 shrink-0 place-items-center rounded-full',
          'border border-border bg-surface text-fg',
          'hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg',
        )}
      >
        <span aria-hidden="true" className="text-lg leading-none">
          ×
        </span>
      </button>
    </header>
  );

  if (docked) {
    return (
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/45" data-overlay-scrim />
          <Dialog.Content
            className="fixed inset-y-0 right-0 z-50 flex w-[26rem] max-w-[92vw] flex-col overflow-y-auto bg-surface text-fg shadow-lift outline-none"
            data-overlay-panel
            data-overlay-variant="docked"
          >
            {header(
              <Dialog.Title className="font-display text-2xl leading-tight">{title}</Dialog.Title>,
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                {description}
              </Dialog.Description>,
            )}
            <div className="px-5 pb-7 sm:px-7">{children}</div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerPortal>
        <DrawerOverlay data-overlay-scrim />
        <DrawerContent data-overlay-panel data-overlay-variant="sheet">
          <DrawerHandle />
          {header(
            <DrawerTitle className="font-display text-2xl leading-tight">{title}</DrawerTitle>,
            <DrawerDescription className="mt-1 text-sm text-muted-foreground">
              {description}
            </DrawerDescription>,
          )}
          <div className="px-5 pb-7">{children}</div>
        </DrawerContent>
      </DrawerPortal>
    </Drawer>
  );
}
