import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"
import { cn } from "@/lib/utils"

/**
 * Thin wrapper over vaul. Only the parts the overlay shell needs: root, portal,
 * overlay (scrim), content, handle, and the title/description Radix wires to the dialog a11y role.
 */
function Drawer({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) {
  return <DrawerPrimitive.Root {...props} />
}

function DrawerPortal({ ...props }: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
  return <DrawerPrimitive.Portal {...props} />
}

function DrawerOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Overlay>) {
  return (
    <DrawerPrimitive.Overlay
      data-slot="drawer-overlay"
      className={cn("fixed inset-0 z-40 bg-black/45", className)}
      {...props}
    />
  )
}

function DrawerContent({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Content>) {
  return (
    <DrawerPrimitive.Content
      data-slot="drawer-content"
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 mt-24 flex max-h-[85dvh] flex-col rounded-t-key bg-surface text-fg outline-none",
        className
      )}
      {...props}
    />
  )
}

/** Drag handle. Decorative: the sheet closes by button, Escape, scrim or Back. */
function DrawerHandle({ className, ...props }: React.ComponentProps<typeof DrawerPrimitive.Handle>) {
  return (
    <DrawerPrimitive.Handle
      data-slot="drawer-handle"
      className={cn(
        // vaul injects its own handle CSS at runtime, so the theme colours need `!` to win.
        "mx-auto mt-3 h-1.5! w-12! shrink-0 rounded-full! bg-fg/25!",
        className
      )}
      {...props}
    />
  )
}

function DrawerTitle({ className, ...props }: React.ComponentProps<typeof DrawerPrimitive.Title>) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn("font-display text-2xl leading-tight", className)}
      {...props}
    />
  )
}

function DrawerDescription({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Description>) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerContent,
  DrawerHandle,
  DrawerTitle,
  DrawerDescription,
}
