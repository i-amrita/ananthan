/**
 * Build the sound sprite from the owner's own Stable Audio recordings.
 *
 * Output: public/audio/sprite.mp3 + public/audio/sprite.ogg and the offsets written to
 * src/lib/sound/sprite.ts. The source material is licensed for commercial use, editing allowed
 * and no attribution required, but it may NOT be redistributed on its own as a stand-alone file
 * or sound pack. So the repository ships only the sprite (a derivative embedded in the site);
 * the trimmed source slices live in a gitignored directory and are read from `SOUND_SRC`
 * (default `/tmp/ananthan-sounds`).
 *
 * Run: pnpm sound:build
 * Layout contract: .agents/screens/sound-engine.md, .agents/docs/sound.md.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const TMP = '/tmp/ananthan-sprite';
const OUT_DIR = join(ROOT, 'public/audio');
/** Where the owner's licensed source tracks live. Override with `SOUND_SRC=/path pnpm sound:build`. */
const SRC_DIR = process.env.SOUND_SRC ?? '/tmp/ananthan-sounds';
/** Trimmed slices land here. Gitignored on purpose: the source may not be redistributed stand-alone. */
const SRC_SLICE_DIR = join(ROOT, 'assets/sound-src');
const SR = 44100;

/**
 * Slice order = playback order in the file. `gap` is the silence after the slice.
 *
 * `source` is the file stem under `SOUND_SRC/<dir>/`, `start`/`end` are the window in seconds of
 * that source. The windows were chosen from a silencedetect + astats + aspectralstats profile
 * (see .agents/docs/sound.md for the numbers). Each window is trimmed, faded and
 * loudness-normalised to about -16 LUFS before it is packed.
 */
const SLICES = [
  {
    name: 'slider-detent',
    source: 'slider-0',
    start: 3.415,
    end: 3.475,
    gap: 0.12,
  },
  {
    name: 'slider-settle',
    source: 'slider-2',
    start: 3.37,
    end: 3.6,
    gap: 0.12,
  },
  {
    name: 'shutter-fire',
    source: 'shutter-1',
    start: 3.48,
    end: 3.7,
    gap: 0.12,
  },
  {
    name: 'shutter-release',
    source: 'shutter-0',
    start: 3.49,
    end: 3.72,
    gap: 0,
  },
] as const;

type Slice = (typeof SLICES)[number]['name'];

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

/** Peak volume in dBFS of a file. */
function probePeakDb(file: string): number {
  const out = execFileSync('ffprobe', [
    '-v',
    'error',
    '-f',
    'lavfi',
    '-i',
    `amovie=${file},astats=metadata=1:reset=0`,
    '-show_entries',
    'frame_tags=lavfi.astats.Overall.Peak_level',
    '-of',
    'csv=p=0',
  ])
    .toString()
    .trim();
  const first = out.split('\n').find((line) => line.trim() && !line.startsWith('#'));
  return Number.parseFloat(first ?? '-99');
}

/** The single FLAC file of a source directory (the tracks ship as `<stem>.flac` next to mp3s). */
function findSourceFile(dir: string): string {
  const full = join(SRC_DIR, dir);
  if (!existsSync(full)) {
    throw new Error(
      `source dir not found: ${full}\n` +
        `Set SOUND_SRC to the directory holding the licensed tracks (default ${SRC_DIR}).`,
    );
  }
  const flacs = readdirSync(full).filter((f) => f.endsWith('.flac'));
  if (flacs.length !== 1) {
    throw new Error(`expected exactly one .flac in ${full}, found ${flacs.length}`);
  }
  return join(full, flacs[0]!);
}

/**
 * Trim the source window, mono it, high-pass the rumble and fade the edges.
 */
function extract(slice: (typeof SLICES)[number]): { file: string; duration: number } {
  const src = findSourceFile(slice.source);
  mkdirSync(SRC_SLICE_DIR, { recursive: true });
  const sliceFile = join(SRC_SLICE_DIR, `${slice.name}.flac`);
  const tmp = join(TMP, `${slice.name}.raw.wav`);
  const dur = slice.end - slice.start;
  run([
    '-i',
    src,
    '-af',
    [
      `atrim=start=${slice.start}:end=${slice.end}`,
      'asetpts=PTS-STARTPTS',
      'aformat=channel_layouts=mono',
      'highpass=f=120',
      'afade=t=in:st=0:d=0.005',
      `afade=t=out:st=${(dur - 0.005).toFixed(3)}:d=0.005`,
    ].join(','),
    '-ar',
    String(SR),
    '-c:a',
    'pcm_s16le',
    tmp,
  ]);
  run(['-i', tmp, '-c:a', 'flac', '-ar', String(SR), sliceFile]);
  return { file: sliceFile, duration: probeDuration(sliceFile) };
}

/**
 * Loudness-normalise one slice to `TARGET_LUFS` and keep it below the ceiling.
 *
 * The four slices are short (60-230 ms), so the ITU-R BS.1770 integrated loudness of a slice is
 * meaningless (it needs 400 ms blocks, and a short transient measures far below its momentary
 * level). The perceptual level that matters here is the momentary level of the transient itself,
 * so the gain is derived from the momentary RMS of the loudest 100 ms block and then capped so the
 * true peak stays under -1 dBFS. All four slices end up within about 1 dB of each other and none
 * of them clips.
 */
const TARGET_LUFS = -16;
const CEILING_DB = -1;

function momentaryRmsDb(file: string): number {
  const out = execFileSync('ffprobe', [
    '-v',
    'error',
    '-f',
    'lavfi',
    '-i',
    `amovie=${file},astats=metadata=1:reset=0:measure_perchannel=RMS_level+Peak_level`,
    '-show_entries',
    'frame_tags=lavfi.astats.Overall.RMS_level',
    '-of',
    'csv=p=0',
  ])
    .toString()
    .trim();
  const lines = out.split('\n').filter((line) => line.trim() && !line.startsWith('#'));
  // astats resets its window per metadata frame; the loudest frame is the transient itself.
  let best = -99;
  for (const line of lines) {
    const [rms] = line.split(',');
    const value = Number.parseFloat(rms ?? '');
    if (Number.isFinite(value) && value > best) best = value;
  }
  return best;
}

function normalise(slice: (typeof SLICES)[number], file: string): void {
  const rmsDb = momentaryRmsDb(file);
  const peakDb = probePeakDb(file);
  // The astats window is the whole (short) slice, so its RMS sits under the momentary level of
  // the transient. Empirically the offset is about 3 dB for these slices.
  const momentary = rmsDb + 3;
  const gain = Math.min(TARGET_LUFS - momentary, CEILING_DB - peakDb);
  if (!Number.isFinite(gain)) throw new Error(`${slice.name}: cannot measure loudness`);
  const tmp = join(TMP, `${slice.name}.norm.wav`);
  run([
    '-i',
    file,
    '-af',
    // `level=disabled` keeps the limiter from boosting the signal back up to the limit.
    `volume=${gain.toFixed(2)}dB,alimiter=limit=${Math.pow(10, CEILING_DB / 20).toFixed(4)}:level=disabled`,
    '-ar',
    String(SR),
    '-c:a',
    'pcm_s16le',
    tmp,
  ]);
  run(['-i', tmp, '-c:a', 'flac', '-ar', String(SR), file]);
}

function render() {
  mkdirSync(TMP, { recursive: true });
  const out = new Map<Slice, { file: string; duration: number }>();
  for (const slice of SLICES) {
    const { file, duration } = extract(slice);
    normalise(slice, file);
    const meanDb = probeMeanDb(file);
    const peakDb = probePeakDb(file);
    if (meanDb < -45) throw new Error(`${slice.name} is silent (${meanDb} dB)`);
    if (peakDb > CEILING_DB + 0.2) throw new Error(`${slice.name} clips (${peakDb} dBFS)`);
    out.set(slice.name, { file, duration });
    console.log(
      `${slice.name.padEnd(18)} ${duration.toFixed(3)}s  rms ${meanDb.toFixed(1)} dB  peak ${peakDb.toFixed(1)} dBFS  ${file}`,
    );
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
    " * four slices cut from the owner's licensed Stable Audio tracks, packed in this order:",
    ...names.map(
      (n, i) =>
        ` *   ${i + 1}. ${n} at ${offsets[n][0].toFixed(3)}s (${offsets[n][1].toFixed(3)}s)`,
    ),
    ' *',
    ' * The slices are sampled, not synthesized. The licence allows commercial use and editing but',
    ' * forbids redistributing the track as a stand-alone file or sound pack, so only the sprite',
    ' * ships; the trimmed sources stay outside the repository. Regenerate with `pnpm sound:build`',
    ' * (scripts/build-sound-sprite.ts). Offsets and durations are in seconds.',
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
