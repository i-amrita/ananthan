/**
 * The DOM half of the sound gate.
 *
 * The gate has exactly one source of truth: the `data-sound-ready` attribute on `<html>` (with
 * `data-sound-muted` beside it). The CSS reads those attributes, so the hold is correct before
 * hydration and never flashes. This module reads the same attributes and applies the parts CSS
 * cannot express: `inert` (out of the tab order, no pointer events) and `aria-disabled`.
 *
 * Why this is deliberately not React: React owns the shutter button's props, and React drops an
 * `inert` attribute it does not render. A re-render would then silently re-enable a control the
 * gate is holding, and a React flush that lags the attribute would leave the button inert for
 * the life of the page. The gate owns the attributes; React only reads the state.
 *
 * Contract: `.agents/docs/sound.md`.
 */

/** The controls the landing holds until the sprite is decoded. */
const HELD_SELECTOR = '[data-focus-track], [data-focus-ruler], [data-shutter]';

/** `loading` while the sprite is pending, `ready` once decoded, `failed` when it never will be. */
export type GateState = 'loading' | 'ready' | 'failed';

/**
 * The gate state, read from the `<html>` attribute. The attribute is the contract with the CSS,
 * so reading it back can never disagree with what the user sees.
 */
export function readGateState(): GateState {
  if (typeof document === 'undefined') return 'loading';
  const value = document.documentElement.dataset.soundReady;
  if (value === 'failed') return 'failed';
  if (value === '') return 'ready';
  return 'loading';
}

/** True when the site is silent: the URL asked for it, or the user chose it. */
export function readMuted(): boolean {
  if (typeof document === 'undefined') return false;
  return document.documentElement.hasAttribute('data-sound-muted');
}

/**
 * True when the held controls must work.
 *
 * The site has to work without sound, so a failed sprite releases the controls exactly like a
 * decoded one, and a muted site never waits for the sprite at all.
 */
export function gateLive(): boolean {
  return readGateState() !== 'loading' || readMuted();
}

/** Subscribers to the gate state. React islands re-render from these. */
const listeners = new Set<() => void>();

/** The state as of the last notification, so a change is announced exactly once. */
let lastState: GateState | null = null;
let lastMuted = false;

/**
 * Subscribe to the gate state. Returns the unsubscribe function.
 */
export function subscribeGate(cb: () => void): () => void {
  listeners.add(cb);
  return () => void listeners.delete(cb);
}

/** Announce a change of the gate state to the React islands. */
function notify(): void {
  const state = readGateState();
  const muted = readMuted();
  if (state === lastState && muted === lastMuted) return;
  lastState = state;
  lastMuted = muted;
  for (const listener of listeners) listener();
}

/**
 * Apply the gate to the held controls. Idempotent: it only writes when an attribute is wrong,
 * so the observer that calls it cannot loop.
 */
function apply(): void {
  if (typeof document === 'undefined') return;
  const live = gateLive();
  for (const el of document.querySelectorAll<HTMLElement>(HELD_SELECTOR)) {
    if (live) {
      if (el.hasAttribute('inert')) el.removeAttribute('inert');
      if (el.hasAttribute('aria-disabled')) el.removeAttribute('aria-disabled');
    } else {
      if (!el.hasAttribute('inert')) el.setAttribute('inert', '');
      if (el.getAttribute('aria-disabled') !== 'true') el.setAttribute('aria-disabled', 'true');
    }
  }
}

let installed = false;

/**
 * Start watching the gate. Safe to call more than once: the first call does the work.
 *
 * The observer watches the `<html>` attributes the gate flips on, plus `inert` and
 * `aria-disabled` on the held controls, so a framework that rewrites one of them gets it put
 * back. Child mutations are watched because a held control can be added after the observer
 * started, and it then has to be held too.
 */
export function installGate(): void {
  if (installed || typeof document === 'undefined') return;
  installed = true;

  const observer = new MutationObserver((records) => {
    let relevant = false;
    for (const record of records) {
      if (record.type === 'attributes') {
        // An attribute change on <html> is the gate flipping. An attribute change on a held
        // control is a framework rewriting it. Both matter.
        relevant = true;
        break;
      }
      for (const node of record.addedNodes) {
        if (!(node instanceof HTMLElement)) continue;
        if (node.matches(HELD_SELECTOR) || node.querySelector(HELD_SELECTOR)) {
          relevant = true;
          break;
        }
      }
      if (relevant) break;
    }
    if (!relevant) return;
    notify();
    apply();
  });
  observer.observe(document.documentElement, {
    attributes: true,
    subtree: true,
    attributeFilter: ['data-sound-ready', 'data-sound-muted', 'inert', 'aria-disabled'],
    childList: true,
  });

  // The head script runs before the body is parsed, so the first pass has nothing to hold.
  // It runs again as soon as the document is ready.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      notify();
      apply();
    });
  } else {
    notify();
    apply();
  }
}

// The gate lives outside any framework lifecycle: it watches itself on import in the browser.
if (typeof document !== 'undefined') installGate();
