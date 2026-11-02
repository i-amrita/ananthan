/**
 * Sound engine: one shared `AudioContext`, one decode-once sprite buffer, one `play()`.
 *
 * Rules this module keeps:
 * - The realtime `AudioContext` is created lazily on the first user gesture and resumed there.
 *   Creating it eagerly cost ~190 ms of main thread on the home page in the previous engine.
 * - The sprite is decoded exactly once, through an `OfflineAudioContext` (no gesture needed).
 * - Nothing is queued before the buffer exists. A sound that cannot play right now is dropped,
 *   so there is never a burst of late clicks.
 * - `?mute=1` and the stored preference mute everything. Sound is not motion, so
 *   `prefers-reduced-motion` does not gate it.
 *
 * Contract: `.agents/docs/sound.md`.
 */
import { SPRITE, type SoundName, spriteUrl } from './sprite';

/** `loading` until the sprite is decoded or has failed (a failure just means "stay silent"). */
export type SoundStatus = 'loading' | 'ready' | 'failed';

/** Options for a single playback. */
export interface PlayOptions {
  /** Playback rate multiplier. 1 = as rendered. */
  rate?: number;
  /** Linear gain multiplier. 1 = as rendered. */
  gain?: number;
  /** Start offset inside the slice, in seconds. */
  offset?: number;
}

/** Longest the gate may stay pending before the site gives up on sound and stays silent. */
export const LOAD_TIMEOUT_MS = 6000;

/** Gestures that unlock audio. Never `touchstart`: iOS does not count it as user activation. */
const UNLOCK_EVENTS = ['pointerdown', 'touchend', 'mousedown', 'keydown'] as const;

/** Where the persisted mute preference lives. */
export const MUTE_STORAGE_KEY = 'sound-muted';

let ctx: AudioContext | null = null;
let unlockBound = false;
let buffer: AudioBuffer | undefined;
let decodeStarted = false;
let status: SoundStatus = 'loading';
/** Explicit mute choice made in this page load. Wins over the URL and the stored preference. */
let override: boolean | null = null;
let gestureAt = 0;
let timeoutTimer: ReturnType<typeof setTimeout> | undefined;

const listeners = new Set<() => void>();

/** True when the URL carries `?mute=1`. Read on every check, so it survives a history change. */
function urlMuted(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('mute') === '1';
}

/** True when the stored preference says muted. */
function storedMuted(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(MUTE_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Effective mute. Precedence: an explicit choice made in this page load, then `?mute=1`, then
 * the stored preference. `?mute=1` therefore silences the site by default, and a user who
 * unmutes once keeps that choice for the session and for the next visit.
 */
export function isMuted(): boolean {
  if (override !== null) return override;
  return urlMuted() || storedMuted();
}

/**
 * Mute (or unmute) and remember the choice. The choice wins for this page load and is
 * persisted, so it survives the next visit.
 */
export function setMuted(value: boolean): void {
  override = value;
  try {
    localStorage.setItem(MUTE_STORAGE_KEY, value ? '1' : '0');
  } catch {
    // Private mode: the preference just does not persist.
  }
  applyMutedAttribute();
}

/** True when `?mute=1` is the reason the site is silent, i.e. the URL is overriding things. */
export function mutedByUrl(): boolean {
  return override === null && urlMuted();
}

/** Reflect the mute state on `<html>` so CSS can dim a sound toggle without any JS wiring. */
function applyMutedAttribute(): void {
  if (typeof document === 'undefined') return;
  if (isMuted()) document.documentElement.dataset.soundMuted = '';
  else delete document.documentElement.dataset.soundMuted;
}

function emit(): void {
  for (const listener of listeners) listener();
}

function setStatus(next: SoundStatus): void {
  if (status === next) return;
  status = next;
  emit();
}

export function getStatus(): SoundStatus {
  return status;
}

/** Subscribe to status changes. Returns the unsubscribe function. */
export function subscribeStatus(cb: () => void): () => void {
  listeners.add(cb);
  return () => void listeners.delete(cb);
}

/** The realtime context, created on demand. Never created during module load. */
export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    try {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor({ latencyHint: 'interactive' });
    } catch {
      return null;
    }
  }
  return ctx;
}

/**
 * iOS mutes Web Audio under the hardware silent switch unless the page's audio session is
 * `playback`. Best effort, no-op everywhere else.
 */
function setPlaybackSession(): void {
  try {
    const session = (navigator as unknown as { audioSession?: { type: string } }).audioSession;
    if (session && session.type !== 'playback') session.type = 'playback';
  } catch {
    // Unsupported value or locked-down browser: sound follows the default policy.
  }
}

/**
 * A gesture: create the realtime context if needed and resume it. Safari reports `suspended`
 * before the first gesture and `interrupted` after a call or a tab switch, so the listeners stay
 * armed for the page's life. Never throws: audio must never break a click.
 */
function unlock(): void {
  try {
    gestureAt = performance.now();
    const c = getAudioContext();
    if (!c) return;
    if (c.state === 'running') return;
    setPlaybackSession();
    void c.resume().catch(() => undefined);
    try {
      // The classic iOS unlock: play one frame of silence inside the gesture.
      const src = c.createBufferSource();
      src.buffer = c.createBuffer(1, 1, 22050);
      src.connect(c.destination);
      src.start(0);
    } catch {
      // The silent poke is optional.
    }
  } catch {
    // Audio must never break the page.
  }
}

/**
 * Fetch and decode the sprite once. An `OfflineAudioContext` decodes without a gesture and
 * without creating the (autoplay-gated) realtime context; the resulting buffer plays on any
 * context, resampled as needed. Browsers without it decode on the realtime context instead.
 */
async function decodeSprite(): Promise<void> {
  if (decodeStarted) return;
  decodeStarted = true;
  timeoutTimer = setTimeout(() => {
    // A stalled fetch must never leave the gate pending forever.
    if (status === 'loading') setStatus('failed');
  }, LOAD_TIMEOUT_MS);
  try {
    const res = await fetch(spriteUrl());
    if (!res.ok) throw new Error(`sprite fetch failed: ${res.status}`);
    const raw = await res.arrayBuffer();
    const Offline =
      window.OfflineAudioContext ??
      (window as unknown as { webkitOfflineAudioContext?: typeof OfflineAudioContext })
        .webkitOfflineAudioContext;
    const decoder: BaseAudioContext | null = Offline ? new Offline(1, 1, 48000) : getAudioContext();
    if (!decoder) throw new Error('no audio context');
    buffer = await decoder.decodeAudioData(raw.slice(0));
    setStatus('ready');
  } catch {
    // No sound, but the site keeps working. The gate flips to `failed`.
    setStatus('failed');
  } finally {
    clearTimeout(timeoutTimer);
    timeoutTimer = undefined;
  }
}

/**
 * Start the decode and arm the gesture unlock. Safe to call repeatedly; only the first call
 * does anything. Does not create an `AudioContext` on its own.
 */
export function initSound(): void {
  if (typeof window === 'undefined') return;
  if (!unlockBound) {
    unlockBound = true;
    for (const event of UNLOCK_EVENTS)
      window.addEventListener(event, unlock, { capture: true, passive: true });
  }
  applyMutedAttribute();
  void decodeSprite();
}

/**
 * The context can play when it is running, or when a gesture just asked for a resume (sources
 * queued on a suspended context start the moment it runs, which keeps the very first press
 * audible without a stale backlog).
 */
function canPlay(): boolean {
  if (!ctx || status !== 'ready' || !buffer) return false;
  if (ctx.state === 'running') return true;
  return (
    (ctx.state === 'suspended' || ctx.state === ('interrupted' as AudioContextState)) &&
    performance.now() - gestureAt < 120
  );
}

/**
 * Play one slice of the sprite. No-op when muted, before the sprite is decoded, or while the
 * context is locked. Never throws.
 */
export function play(name: SoundName, options: PlayOptions = {}): void {
  try {
    playNow(name, options);
  } catch {
    // A failed sound must never break the interaction that triggered it.
  }
}

function playNow(name: SoundName, options: PlayOptions): void {
  if (isMuted() || !canPlay() || !ctx || !buffer) return;
  const slice = SPRITE[name];
  if (!slice) return;
  const [start, duration] = slice;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = options.rate ?? 1;
  const gain = ctx.createGain();
  gain.gain.value = options.gain ?? 1;
  source.connect(gain).connect(ctx.destination);
  const offset = options.offset ?? 0;
  source.start(0, start + offset, Math.max(0.001, duration - offset));
}

/** True when the sprite is decoded, i.e. sounds will actually play if not muted. */
export function isSoundDecoded(): boolean {
  return status === 'ready';
}
