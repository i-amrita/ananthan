/**
 * Manifest for the single sound sprite in `public/audio/sprite.mp3` (+ `sprite.ogg` fallback):
 * four slices cut from the owner's licensed Stable Audio tracks, packed in this order:
 *   1. slider-detent at 0.000s (0.060s)
 *   2. slider-settle at 0.180s (0.230s)
 *   3. shutter-fire at 0.530s (0.220s)
 *   4. shutter-release at 0.870s (0.230s)
 *
 * The slices are sampled, not synthesized. The licence allows commercial use and editing but
 * forbids redistributing the track as a stand-alone file or sound pack, so only the sprite
 * ships; the trimmed sources stay outside the repository. Regenerate with `pnpm sound:build`
 * (scripts/build-sound-sprite.ts). Offsets and durations are in seconds.
 * Details: .agents/docs/sound.md.
 */

/** Version stamp for cache busting. Bump when the sprite is regenerated. */
export const SPRITE_HASH = '10e3e9f2';

export type SoundName = 'slider-detent' | 'slider-settle' | 'shutter-fire' | 'shutter-release';

/** [start, duration] pairs in seconds. */
export const SPRITE: Record<SoundName, readonly [number, number]> = {
  'slider-detent': [0, 0.06],
  'slider-settle': [0.18, 0.23],
  'shutter-fire': [0.53, 0.22],
  'shutter-release': [0.87, 0.23],
};

/** Every slice, in sprite order. */
export const SOUND_NAMES: readonly SoundName[] = [
  'slider-detent',
  'slider-settle',
  'shutter-fire',
  'shutter-release',
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
