/**
 * Manifest for the single sound sprite in `public/audio/sprite.mp3` (+ `sprite.ogg` fallback):
 * seven synthesized slices, packed in this order:
 *   1. slider-detent at 0.000s (0.060s)
 *   2. slider-settle at 0.180s (0.110s)
 *   3. shutter-fire at 0.410s (0.330s)
 *   4. shutter-release at 0.860s (0.180s)
 *   5. locale-commit at 1.160s (0.115s)
 *   6. panel-open at 1.395s (0.320s)
 *   7. panel-close at 1.835s (0.090s)
 *
 * Every slice is synthesized offline from ffmpeg lavfi sources (sine, anoisesrc, aevalsrc
 * envelopes); nothing is sampled, so nothing carries a third-party license. Regenerate with
 * `pnpm sound:build` (scripts/build-sound-sprite.ts). Offsets and durations are in seconds.
 * Details: .agents/docs/sound.md.
 */

/** Version stamp for cache busting. Bump when the sprite is regenerated. */
export const SPRITE_HASH = 'bc8969be';

export type SoundName =
  | 'slider-detent'
  | 'slider-settle'
  | 'shutter-fire'
  | 'shutter-release'
  | 'locale-commit'
  | 'panel-open'
  | 'panel-close';

/** [start, duration] pairs in seconds. */
export const SPRITE: Record<SoundName, readonly [number, number]> = {
  'slider-detent': [0, 0.06],
  'slider-settle': [0.18, 0.11],
  'shutter-fire': [0.41, 0.33],
  'shutter-release': [0.86, 0.18],
  'locale-commit': [1.16, 0.115],
  'panel-open': [1.395, 0.32],
  'panel-close': [1.835, 0.09],
};

/** Every slice, in sprite order. */
export const SOUND_NAMES: readonly SoundName[] = [
  'slider-detent',
  'slider-settle',
  'shutter-fire',
  'shutter-release',
  'locale-commit',
  'panel-open',
  'panel-close',
];

/**
 * Sprite URL. The mp3 plays everywhere; the ogg is a smaller fallback where the browser
 * supports it. `SPRITE_HASH` busts the cache when the sprite is regenerated.
 */
export function spriteUrl(): string {
  const ogg =
    typeof document !== 'undefined' &&
    document.createElement('audio').canPlayType('audio/ogg') !== '';
  return ogg ? `/audio/sprite.ogg?v=${SPRITE_HASH}` : `/audio/sprite.mp3?v=${SPRITE_HASH}`;
}
