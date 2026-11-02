/**
 * Build the sound sprite: seven synthesized slices packed into one file.
 * Output: public/audio/sprite.mp3 + public/audio/sprite.ogg and the offsets written to
 * src/lib/sound/sprite.ts. Every slice comes from ffmpeg lavfi sources (sine, anoisesrc,
 * aevalsrc envelopes), so nothing is sampled and nothing carries a third-party license.
 *
 * Run: pnpm sound:build
 * Layout contract: .agents/screens/sound-engine.md, .agents/docs/sound.md.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const TMP = '/tmp/ananthan-sprite';
const OUT_DIR = join(ROOT, 'public/audio');
const SR = 44100;

/** Slice order = playback order in the file. `gap` is the silence after the slice. */
const SLICES = [
  { name: 'slider-detent', gap: 0.12 },
  { name: 'slider-settle', gap: 0.12 },
  { name: 'shutter-fire', gap: 0.12 },
  { name: 'shutter-release', gap: 0.12 },
  { name: 'locale-commit', gap: 0.12 },
  { name: 'panel-open', gap: 0.12 },
  { name: 'panel-close', gap: 0 },
] as const;

type Slice = (typeof SLICES)[number]['name'];

/** Filter graph per slice, rendered to a 44.1kHz mono s16 wav. */
const GRAPH: Record<Slice, string> = {
  // Detent tick: a dry 2.1kHz body click with a short noise transient, 60ms.
  'slider-detent': [
    'sine=f=2100:d=0.06[s]',
    'anoisesrc=color=white:seed=1:d=0.06:a=0.4[n]',
    '[n]bandpass=f=4800:width_type=h:w=3200[nb]',
    '[s][nb]amix=inputs=2:duration=first:weights=1 0.5:dropout_transition=0[m]',
    '[m]highpass=f=320,afade=t=in:st=0:d=0.003,afade=t=out:st=0.02:d=0.04[out]',
  ].join(';'),
  // Settle: lower thock with a longer tail, 110ms.
  'slider-settle': [
    'sine=f=620:d=0.11[s]',
    'anoisesrc=color=white:seed=2:d=0.11:a=0.3[n]',
    '[n]bandpass=f=1900:width_type=h:w=1400[nb]',
    '[s][nb]amix=inputs=2:duration=first:weights=1 0.4:dropout_transition=0[m]',
    '[m]highpass=f=160,afade=t=in:st=0:d=0.004,afade=t=out:st=0.03:d=0.08[out]',
  ].join(';'),
  // Shutter fire: two-stage click-clack. Stage 1 (mirror slap, 80ms), gap, stage 2
  // (curtain close, 110ms, louder and darker). Both are band-passed noise plus a body sine.
  'shutter-fire': [
    'anoisesrc=color=white:seed=3:d=0.08:a=0.9[a1n]',
    'sine=f=260:d=0.08[a1s]',
    '[a1n]bandpass=f=3200:width_type=h:w=2600[a1nb]',
    '[a1s]volume=0.8[a1sv]',
    '[a1nb][a1sv]amix=inputs=2:duration=first:weights=1 0.5:dropout_transition=0[a1]',
    '[a1]afade=t=out:st=0.03:d=0.05[ac1]',
    'anullsrc=r=44100:cl=mono:d=0.14[gap]',
    'anoisesrc=color=white:seed=4:d=0.11:a=0.9[a2n]',
    'sine=f=900:d=0.11[a2s]',
    '[a2n]bandpass=f=2000:width_type=h:w=2000[a2nb]',
    '[a2s]volume=0.9[a2sv]',
    '[a2nb][a2sv]amix=inputs=2:duration=first:weights=1 0.7:dropout_transition=0[a2]',
    '[a2]afade=t=out:st=0.04:d=0.07[ac2]',
    '[ac1][gap][ac2]concat=n=3:v=0:a=1[cat]',
    '[cat]afade=t=out:st=0.3:d=0.08[out]',
  ].join(';'),
  // Shutter release: one softer stage, 180ms, ring tail included.
  'shutter-release': [
    'anoisesrc=color=white:seed=5:d=0.18:a=0.9[n]',
    '[n]bandpass=f=2400:width_type=h:w=2200[nb]',
    'sine=f=2400:d=0.18[r]',
    'aevalsrc=0.6*exp(-9*t):d=0.18:s=44100[env]',
    '[r][env]amultiply[rv]',
    '[nb][rv]amix=inputs=2:duration=first:weights=1 0.5:dropout_transition=0[m]',
    '[m]afade=t=out:st=0.08:d=0.1[out]',
  ].join(';'),
  // Locale commit: two bright blips, so it reads as "committed" and not as a detent.
  'locale-commit': [
    'sine=f=880:d=0.05[b1]',
    'sine=f=1320:d=0.06[b2]',
    'anoisesrc=color=white:seed=6:d=0.02:a=0.35[c]',
    '[c]bandpass=f=6000:width_type=h:w=3000[cb]',
    '[b1][cb]amix=inputs=2:duration=first:weights=1 0.3:dropout_transition=0[m1]',
    '[b2]adelay=55:all=1[b2d]',
    '[m1][b2d]amix=inputs=2:duration=longest:dropout_transition=0[m]',
    '[m]afade=t=in:st=0:d=0.004,afade=t=out:st=0.08:d=0.05[out]',
  ].join(';'),
  // Panel open: whoosh. A low band swells while a high band rises late, then both fade.
  // The envelopes are `aevalsrc` expressions; commas and colons inside them are escaped
  // as \, and \: so the ffmpeg graph parser does not split the options.
  'panel-open': [
    'anoisesrc=color=pink:seed=7:d=0.32:a=0.8[n1]',
    'anoisesrc=color=pink:seed=8:d=0.32:a=0.8[n2]',
    '[n1]lowpass=f=1400[lo]',
    '[n2]highpass=f=1600[hi]',
    'aevalsrc=sin(3.14159*min(t/0.22\\,1)):d=0.32:s=44100[e1]',
    'aevalsrc=min(max(0\\,(t-0.07)/0.19)\\,1):d=0.32:s=44100[e2]',
    '[lo][e1]amultiply[lom]',
    '[hi][e2]amultiply[him]',
    '[lom][him]amix=inputs=2:duration=first:weights=1 0.45:dropout_transition=0[m]',
    '[m]afade=t=out:st=0.24:d=0.08[out]',
  ].join(';'),
  // Panel close: dry landing tick, 90ms.
  'panel-close': [
    'sine=f=440:d=0.09[s]',
    'anoisesrc=color=white:seed=9:d=0.09:a=0.4[n]',
    '[n]bandpass=f=2400:width_type=h:w=1800[nb]',
    '[s][nb]amix=inputs=2:duration=first:weights=1 0.4:dropout_transition=0[m]',
    '[m]highpass=f=200,afade=t=in:st=0:d=0.003,afade=t=out:st=0.02:d=0.07[out]',
  ].join(';'),
};

function run(args: string[]) {
  try {
    execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (error) {
    const e = error as { stderr?: string };
    throw new Error(`ffmpeg failed: ${e.stderr ?? String(error)}`, { cause: error });
  }
}

function probeDuration(file: string): number {
  const out = execFileSync('ffprobe', [
    '-v',
    'error',
    '-show_entries',
    'format=duration',
    '-of',
    'csv=p=0',
    file,
  ])
    .toString()
    .trim();
  return Number.parseFloat(out);
}

/** Mean volume in dBFS, used to assert a slice is not silent. */
function probeMeanDb(file: string): number {
  const out = execFileSync('ffprobe', [
    '-v',
    'error',
    '-f',
    'lavfi',
    '-i',
    `amovie=${file},astats=metadata=1:reset=0`,
    '-show_entries',
    'frame_tags=lavfi.astats.Overall.RMS_level',
    '-of',
    'csv=p=0',
  ])
    .toString()
    .trim();
  const first = out.split('\n').find((line) => line.trim() && !line.startsWith('#'));
  return Number.parseFloat(first ?? '-99');
}

function render() {
  mkdirSync(TMP, { recursive: true });
  const out = new Map<Slice, { file: string; duration: number }>();
  for (const { name } of SLICES) {
    const file = join(TMP, `${name}.wav`);
    run([
      '-f',
      'lavfi',
      '-i',
      GRAPH[name],
      '-ac',
      '1',
      '-ar',
      String(SR),
      '-c:a',
      'pcm_s16le',
      file,
    ]);
    const duration = probeDuration(file);
    const meanDb = probeMeanDb(file);
    if (meanDb < -45) throw new Error(`${name} is silent (${meanDb} dB)`);
    out.set(name, { file, duration });
    console.log(`${name.padEnd(18)} ${duration.toFixed(3)}s  ${meanDb.toFixed(1)} dB`);
  }
  return out;
}

function pack(rendered: Map<Slice, { file: string; duration: number }>) {
  mkdirSync(OUT_DIR, { recursive: true });
  const inputs: string[] = [];
  const padded: string[] = [];
  const offsets = {} as Record<Slice, [number, number]>;
  let t = 0;
  for (const [i, slice] of SLICES.entries()) {
    const r = rendered.get(slice.name)!;
    offsets[slice.name] = [Number(t.toFixed(4)), Number(r.duration.toFixed(4))];
    inputs.push('-i', r.file);
    // Silence after each slice, so the offsets are exactly [start, start + duration + gap].
    padded.push(`[${i}:a]apad=pad_dur=${slice.gap.toFixed(3)}[p${i}]`);
    t += r.duration + slice.gap;
  }
  const wav = join(TMP, 'sprite.wav');
  const labels = SLICES.map((_, i) => `[p${i}]`).join('');
  run([
    ...inputs,
    '-filter_complex',
    `${padded.join(';')};${labels}concat=n=${SLICES.length}:v=0:a=1[cat]`,
    '-map',
    '[cat]',
    '-ac',
    '1',
    '-ar',
    String(SR),
    '-c:a',
    'pcm_s16le',
    wav,
  ]);
  run([
    '-i',
    wav,
    '-c:a',
    'libmp3lame',
    '-b:a',
    '96k',
    '-ac',
    '1',
    '-ar',
    String(SR),
    join(OUT_DIR, 'sprite.mp3'),
  ]);
  // The native `vorbis` encoder is still marked experimental in ffmpeg (`-strict -2`) and
  // only accepts stereo, so the ogg fallback is stereo. `-serial_offset 0` pins the ogg
  // bitstream serial, which the muxer otherwise randomizes, so rebuilds stay byte-stable.
  run([
    '-i',
    wav,
    '-c:a',
    'vorbis',
    '-strict',
    '-2',
    '-q:a',
    '2',
    '-ac',
    '2',
    '-ar',
    String(SR),
    '-f',
    'ogg',
    join(OUT_DIR, 'sprite.ogg'),
  ]);
  pinOggSerial(join(OUT_DIR, 'sprite.ogg'));
  return offsets;
}

/**
 * The ogg muxer randomizes the bitstream serial (`-serial_offset` only offsets it), which makes
 * every rebuild byte-different and churns git. This rewrites every page header's serial to a
 * fixed value and recomputes each page CRC (Ogg uses CRC-32, polynomial 0x04c11db7, init 0, no
 * reflection, no final xor), so rebuilds are byte-stable.
 */
function pinOggSerial(file: string, serial = 0x00000001) {
  const pages = readFileSync(file);
  for (let at = 0; at + 27 <= pages.length;) {
    if (pages.subarray(at, at + 5).toString('latin1') !== 'OggS\0') {
      throw new Error(`${file}: bad ogg page at ${at}`);
    }
    pages.writeUInt32LE(serial, at + 14);
    pages.fill(0, at + 22, at + 26);
    // The page ends after the 27-byte header, the segment table and the segment payloads.
    const segments = pages[at + 26]!;
    let end = at + 27 + segments;
    for (let i = 0; i < segments; i++) end += pages[at + 27 + i]!;
    let crc = 0;
    for (let i = at; i < end; i++) {
      crc ^= pages[i]! << 24;
      for (let bit = 0; bit < 8; bit++)
        crc = crc & 0x80000000 ? ((crc << 1) ^ 0x04c11db7) >>> 0 : (crc << 1) >>> 0;
    }
    pages.writeUInt32LE(crc >>> 0, at + 22);
    at = end;
  }
  writeFileSync(file, pages);
}

function writeManifest(offsets: Record<Slice, [number, number]>) {
  const mp3 = readFileSync(join(OUT_DIR, 'sprite.mp3'));
  const ogg = readFileSync(join(OUT_DIR, 'sprite.ogg'));
  // FNV-1a over the mp3 bytes: a short version stamp for cache busting the URLs. The stamp is
  // part of the URL, so /audio/* can be served immutable (see public/_headers). The mp3 alone
  // is enough: it is byte-reproducible, while the ogg container carries a random bitstream
  // serial, so hashing both would churn the stamp on every rebuild.
  const hash = [...mp3]
    .reduce((a, b) => Math.imul(a ^ b, 16777619) >>> 0, 2166136261)
    .toString(16)
    .padStart(8, '0');
  const names = SLICES.map((s) => s.name);
  const source = [
    '/**',
    ' * Manifest for the single sound sprite in `public/audio/sprite.mp3` (+ `sprite.ogg` fallback):',
    ' * seven synthesized slices, packed in this order:',
    ...names.map(
      (n, i) =>
        ` *   ${i + 1}. ${n} at ${offsets[n][0].toFixed(3)}s (${offsets[n][1].toFixed(3)}s)`,
    ),
    ' *',
    ' * Every slice is synthesized offline from ffmpeg lavfi sources (sine, anoisesrc, aevalsrc',
    ' * envelopes); nothing is sampled, so nothing carries a third-party license. Regenerate with',
    ' * `pnpm sound:build` (scripts/build-sound-sprite.ts). Offsets and durations are in seconds.',
    ' * Details: .agents/docs/sound.md.',
    ' */',
    '',
    '/** Version stamp for cache busting. Bump when the sprite is regenerated. */',
    `export const SPRITE_HASH = '${hash}';`,
    '',
    'export type SoundName =',
    ...names.map((n) => `  | '${n}'`),
    ';',
    '',
    '/** [start, duration] pairs in seconds. */',
    'export const SPRITE: Record<SoundName, readonly [number, number]> = {',
    ...names.map((n) => `  '${n}': [${offsets[n][0]}, ${offsets[n][1]}],`),
    '};',
    '',
    '/** Every slice, in sprite order. */',
    'export const SOUND_NAMES: readonly SoundName[] = [',
    ...names.map((n) => `  '${n}',`),
    '];',
    '',
    '/**',
    ' * Sprite URL. The mp3 plays everywhere; the ogg is a smaller fallback where the browser',
    ' * supports it. `SPRITE_HASH` busts the cache when the sprite is regenerated.',
    ' */',
    'export function spriteUrl(): string {',
    '  const ogg =',
    "    typeof document !== 'undefined' &&",
    "    document.createElement('audio').canPlayType('audio/ogg') !== '';",
    '  return ogg',
    '    ? `/audio/sprite.ogg?v=${SPRITE_HASH}`',
    '    : `/audio/sprite.mp3?v=${SPRITE_HASH}`;',
    '}',
    '',
  ].join('\n');
  mkdirSync(join(ROOT, 'src/lib/sound'), { recursive: true });
  writeFileSync(join(ROOT, 'src/lib/sound/sprite.ts'), source);
  console.log(
    `sprite.mp3 ${(mp3.length / 1024).toFixed(1)} KB, sprite.ogg ${(ogg.length / 1024).toFixed(1)} KB, hash ${hash}`,
  );
}

rmSync(TMP, { recursive: true, force: true });
const rendered = render();
const offsets = pack(rendered);
writeManifest(offsets);
rmSync(TMP, { recursive: true, force: true });
