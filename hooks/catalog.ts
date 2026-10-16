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
  { id: 'hero', name: 'ASCIIMOOD', note: 'the name, filled with plasma', hues: [30, 350], dur: 8 },
]

export const BY_ID = new Map(CATALOG.map(entry => [entry.id, entry]))

/** The animation each state plays until the person picks another on asciimood.com. */
export const DEFAULTS: Record<AgentState, string> = {
  idle: 'sleeping-cat',
  think: 'orbits',
  read: 'char-rain',
  write: 'helix',
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
