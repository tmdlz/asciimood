// Every animation the app can play, and how each turns into a grid of
// coloured cells of any size. All of them are Asciimood's own.
import { ANIMS } from './anims.ts'
import type { Anim } from './anims.ts'
import type { AgentState } from '../types'

export type Entry = {
  id: string
  name: string
  /** One line saying what you see. */
  note: string
  /** Two hues (0-360) the picture is shaded between. */
  hues: [number, number]
  /** The drawing in ANIMS, where it differs from `id`. */
  anim?: string
  /** Seconds per loop. */
  dur: number
  /** One 0xRRGGBB ink for every character, in place of the hues. */
  ink?: number
  /** A 0xRRGGBB ground behind the picture, in place of the terminal's. */
  ground?: number
  /** Asciimood Pro: drawn on asciimood.com ahead of time, its frames fetched for a licensed device. */
  pro?: true
}

export const CATALOG: Entry[] = [
  { id: 'sleeping-cat', anim: 'cat', name: 'Sleeping cat', note: 'a cat asleep on a cushion, Zs drifting up', hues: [40, 85], dur: 6 },
  { id: 'orbits', name: 'Orbits', note: 'planets on their ellipses, a moon round the biggest', hues: [260, 300], dur: 12 },
  { id: 'char-rain', anim: 'rain', name: 'Character rain', note: 'streams of glyphs falling at three speeds', hues: [145, 120], dur: 6 },
  { id: 'helix', name: 'DNA helix', note: 'two strands turning, base pairs between them', hues: [170, 140], dur: 6 },
  { id: 'checker-tunnel', anim: 'tunnel', name: 'Tunnel', note: 'flying down a checkered tube', hues: [320, 260], dur: 6 },
  { id: 'fire', name: 'Fire', note: 'flames licking up from a hot bed', hues: [15, 45], dur: 3 },
  { id: 'ink-plasma', anim: 'plasma', name: 'Plasma', note: 'soft waves of ink folding into each other', hues: [25, 340], dur: 10 },
  { id: 'moire', name: 'Moiré', note: 'two sets of rings drifting through each other', hues: [280, 230], dur: 12 },
  { id: 'torus', name: 'Spinning torus', note: 'a lit doughnut turning on two axes', hues: [200, 160], dur: 6 },
  { id: 'waves', name: 'Waves', note: 'three layers of sea and a little boat', hues: [230, 190], dur: 8 },
  { id: 'lava', name: 'Lava lamp', note: 'wax blobs rising and sinking', hues: [15, 350], dur: 10 },
  { id: 'wire-cube', anim: 'cube', name: 'Cube', note: 'a wireframe cube tumbling', hues: [60, 100], dur: 8 },
  { id: 'gull', name: 'Gull', note: 'a gull head-on, gliding, then three wingbeats', hues: [195, 225], dur: 6 },
  { id: 'horse', name: 'Horse', note: "Muybridge's 1878 gallop, in ASCII", hues: [25, 45], dur: 1.5 },
  { id: 'white-cat', anim: 'dotcat', name: 'White cat', note: 'a white cat in dots, blinking', hues: [0, 0], ink: 0xf3f0e9, dur: 4 },
  { id: 'bolt', name: 'Bolt', note: 'a thick, leaning lightning bolt making one full turn on its axis', hues: [0, 0], ink: 0xeeece6, ground: 0x0b0b0e, dur: 6 },
  { id: 'cup-of-tea', anim: 'cup', name: 'Cup of tea', note: 'a steaming mug of tea in dense letters, rings spreading on the tea', hues: [0, 0], ink: 0xece8df, ground: 0x0b0b0e, dur: 6 },
  { id: 'vortex', name: 'Vortex', note: 'a whirlpool from above, bright crescents sliding round its rings', hues: [0, 0], ink: 0xc4c4c8, ground: 0x060607, dur: 8 },
  { id: 'yellow-blobs', anim: 'blobs', name: 'Yellow blobs', note: 'yellow lava-lamp blobs on black, merging and splitting, ringed by dotted contours', hues: [0, 0], ink: 0xf4d31f, ground: 0x0a0a08, dur: 8 },
  { id: 'chompers', name: 'Chompers', note: 'glowing fanged mouths in the dark, each snapping shut on its own beat', hues: [0, 0], ink: 0x47ff7a, ground: 0x070a1c, dur: 4 },
  { id: 'digit-globe', anim: 'globe', name: 'Digit globe', note: 'a globe of digits turning, a crease of packed numbers rolling across it', hues: [200, 165], dur: 14 },
  { id: 'radiation', name: 'Radiation', note: 'a radiation sign turning slowly while light pulses ripple out from its hub', hues: [0, 0], ink: 0xf2c21b, ground: 0x0b0b0e, dur: 6 },
  { id: 'binary-mask', anim: 'mask', name: 'Binary mask', note: 'a Guy Fawkes mask written in falling 0s and 1s, holding, then washed away by the rain', hues: [0, 0], ink: 0xeeece6, ground: 0x0b0b0e, dur: 9 },
  { id: 'hero', name: 'ASCIIMOOD', note: 'the name, filled with plasma', hues: [30, 350], dur: 8 },
]

export const BY_ID = new Map(CATALOG.map(entry => [entry.id, entry]))

/**
 * Asciimood Pro. Its drawings are not in this plugin: asciimood.com renders each loop
 * ahead of time in a few sizes and sends a licensed device the frames, so here a Pro
 * animation is its catalogue entry plus the frames fetched for it.
 */
export const PRO: Entry[] = []
// The sizes the frames come in (tools/pro/build.mjs): the biggest that fits is played, centred.
const PRO_COLS = [48, 64, 80, 96, 112, 128, 144, 160, 184, 208, 240]
const PRO_ROWS = [16, 20, 24, 28, 32, 40, 48, 56, 64]
const fitting = (sizes: number[], n: number): number => sizes.filter(s => s <= n).pop() ?? sizes[0] ?? n
export const proSize = (W: number, H: number): string => `${fitting(PRO_COLS, W)}x${fitting(PRO_ROWS, H)}`
/** Frames fetched from asciimood.com, by `<id>@<size>`: each frame's lines. */
export const proFrames = new Map<string, string[][]>()

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
/** Takes the Pro catalogue asciimood.com sent (or none, once the license is gone). */
export function setPro(raw: unknown): void {
  for (const entry of PRO.splice(0)) BY_ID.delete(entry.id)
  if (!Array.isArray(raw)) return
  for (const r of raw as Record<string, unknown>[]) {
    const { id, name, note, dur, hues, ink, ground } = r ?? {}
    if (typeof id !== 'string' || !/^[a-z0-9-]{1,40}$/.test(id) || BY_ID.has(id)) continue
    if (typeof name !== 'string' || typeof note !== 'string' || !isNum(dur) || dur <= 0) continue
    const pair = Array.isArray(hues) && isNum(hues[0]) && isNum(hues[1]) ? ([hues[0], hues[1]] as [number, number]) : ([0, 0] as [number, number])
    const entry: Entry = { id, name: name.slice(0, 40), note: note.slice(0, 200), hues: pair, dur, pro: true }
    if (isNum(ink)) entry.ink = ink
    if (isNum(ground)) entry.ground = ground
    PRO.push(entry)
    BY_ID.set(id, entry)
  }
}

/** The animation each state plays until the person picks another on asciimood.com. */
export const DEFAULTS: Record<AgentState, string> = {
  idle: 'sleeping-cat',
  think: 'bolt',
  read: 'helix',
  write: 'char-rain',
  run: 'checker-tunnel',
  error: 'fire',
  done: 'waves',
}

/**
 * A frame: one character and one 0xRRGGBB colour per cell, row by row, and a ground
 * colour behind them when the picture has its own; `bgs`, a ground per cell, wins over it.
 */
export type Frame = { chars: string[]; fg: Uint32Array; bg?: number; bgs?: Uint32Array }

const hsl = (h: number, s: number, l: number): number => {
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const c = (n: number) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))))
  return (c(0) << 16) | (c(8) << 8) | c(4)
}
const DEFAULT_COLOR = 0x01000000
const shaded = (chars: string[], entry: Entry, W: number, H: number): Frame => {
  const fg = new Uint32Array(W * H)
  const [h1, h2] = entry.hues
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const k = (x / W) * 0.6 + (y / H) * 0.4
      fg[y * W + x] = entry.ink ?? hsl(h1 + (h2 - h1) * k, 0.75, 0.68)
    }
  }
  return { chars, fg, bg: entry.ground }
}

/** The picture `entry` shows `t` seconds in, sized W x H. */
export const render = (entry: Entry, t: number, W: number, H: number): Frame => {
  const p = (t / entry.dur) % 1
  if (entry.pro === true) {
    const size = proSize(W, H)
    const loop = proFrames.get(`${entry.id}@${size}`) ?? []
    const lines = loop[Math.floor(p * loop.length)] ?? []
    const [bw = W, bh = H] = size.split('x').map(Number)
    const top = Math.floor((H - bh) / 2), left = ' '.repeat(Math.max(0, Math.floor((W - bw) / 2)))
    return shaded(Array.from({ length: H }, (_, y) => (left + (lines[y - top] ?? '')).padEnd(W).slice(0, W)), entry, W, H)
  }
  const anim: Anim | undefined = ANIMS[entry.anim ?? entry.id]
  if (anim === undefined) return shaded(Array.from({ length: H }, () => ' '.repeat(W)), entry, W, H)
  return shaded(anim(p, W, H).split('\n').map(l => l.padEnd(W).slice(0, W)), entry, W, H)
}

const hash = (i: number): number => {
  let h = Math.imul(i ^ 0x9e3779b9, 0x85ebca6b)
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

/** Part way (k from 0 to 1) from one frame to the next, cell by cell. */
export const dissolve = (from: Frame, to: Frame, k: number, W: number): Frame => {
  const fg = new Uint32Array(to.fg.length)
  const bgs = new Uint32Array(to.fg.length)
  const chars = to.chars.map((line, y) => {
    let row = ''
    for (let x = 0; x < line.length; x++) {
      const i = y * W + x
      const r = hash(i)
      const old = r >= k + 0.08
      row += r < k ? line[x] : !old ? '░' : (from.chars[y]?.[x] ?? ' ')
      const f = old ? from : to
      fg[i] = f.fg[i] ?? DEFAULT_COLOR
      bgs[i] = f.bgs?.[i] ?? f.bg ?? DEFAULT_COLOR
    }
    return row
  })
  return { chars, fg, bgs }
}

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
const base64 = (bytes: Uint8Array): string => {
  let out = ''
  const at = (i: number): number => bytes[i] ?? 0
  const ch = (n: number): string => B64.charAt(n)
  let i = 0
  for (; i + 2 < bytes.length; i += 3) {
    const n = (at(i) << 16) | (at(i + 1) << 8) | at(i + 2)
    out += ch(n >>> 18) + ch((n >>> 12) & 63) + ch((n >>> 6) & 63) + ch(n & 63)
  }
  if (i < bytes.length) {
    const n = (at(i) << 16) | (at(i + 1) << 8)
    out += ch(n >>> 18) + ch((n >>> 12) & 63) + (i + 1 < bytes.length ? ch((n >>> 6) & 63) : '=') + '='
  }
  return out
}

/** A frame as a Raster's `cells`: [codePoint, foreground, background] per cell. */
export const toCells = (frame: Frame, W: number, H: number): string => {
  const words = new Uint32Array(W * H * 3)
  for (let y = 0; y < H; y++) {
    const line = frame.chars[y] ?? ''
    for (let x = 0; x < W; x++) {
      const i = y * W + x
      const code = line.charCodeAt(x)
      words[i * 3] = code >= 0x20 && code < 0xd800 ? code : 0x20
      words[i * 3 + 1] = frame.fg[i] ?? DEFAULT_COLOR
      words[i * 3 + 2] = frame.bgs?.[i] ?? frame.bg ?? DEFAULT_COLOR
    }
  }
  return base64(new Uint8Array(words.buffer))
}
