// Every animation the pane can play, and how each turns into a grid of
// coloured cells of any size.
import { ANIMS } from './anims.ts'
import type { Anim } from './anims.ts'
import { PIECES } from './pieces.ts'
import type { PieceFrame, PieceModule } from './catalog-types.ts'
import type { AgentState } from '../types'

export type Entry = {
  id: string
  name: string
  by: string
  /** The shelf it sits on: `asciimood`, or an ascii.rest category. */
  cat: string
  /** One line saying what you see. */
  note: string
  /** Two hues (0-360) a one-ink picture is shaded between; scenes bring their own palette. */
  hues: [number, number]
  /** Asciimood's own loops: the drawing in ANIMS, where it differs from `id` (an ascii.rest piece took the name first). */
  anim?: string
  /** Asciimood's own loops: seconds per loop. */
  dur?: number
  piece?: PieceModule
}

const ASCII_REST = 'ascii.rest · bas3line'
const HUES: Record<string, [number, number]> = {
  space: [250, 300], nature: [110, 60], creatures: [190, 150], shapes: [30, 350], physics: [200, 240],
  generative: [290, 200], objects: [40, 15], effects: [320, 20], scenes: [0, 0],
}

const OWN: Entry[] = ([
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
  { id: 'hero', name: 'ASCIIMOOD', note: 'the name, filled with plasma', hues: [30, 350], dur: 8 },
] as Omit<Entry, 'by' | 'cat'>[]).map(entry => ({ ...entry, by: 'Asciimood', cat: 'asciimood' }))

const pretty = (id: string): string => id.replace(/-/g, ' ').replace(/^./, c => c.toUpperCase())

export const CATALOG: Entry[] = [
  ...OWN,
  ...PIECES.map(row => ({
    id: row.id,
    name: pretty(row.id),
    by: ASCII_REST,
    cat: row.cat,
    note: row.note,
    hues: HUES[row.cat] ?? [30, 350],
    piece: row.piece,
  })),
]

/** The shelves in the order the picker lists them, each with its pieces. */
export const CATEGORIES: string[] = ['asciimood', 'scenes', 'space', 'nature', 'creatures', 'shapes', 'physics', 'generative', 'objects', 'effects']
  .filter(cat => CATALOG.some(entry => entry.cat === cat))
CATALOG.sort((a, b) => CATEGORIES.indexOf(a.cat) - CATEGORIES.indexOf(b.cat))

export const BY_ID = new Map(CATALOG.map(entry => [entry.id, entry]))

/** The animation each state plays until the person picks another. */
export const DEFAULTS: Record<AgentState, string> = {
  idle: 'cloud-sea',
  think: 'earth',
  read: 'edge-orbit',
  write: 'black-hole',
  run: 'night-highway',
  error: 'volcano-night',
  done: 'earthrise',
}

/**
 * A frame: one character and one 0xRRGGBB colour per cell, row by row, and a ground
 * colour behind them when the picture has its own; `bgs`, a ground per cell, wins over it.
 */
export type Frame = { chars: string[]; fg: Uint32Array; bg?: number; bgs?: Uint32Array }

const frames = new Map<string, PieceFrame>()
const frameOf = (entry: Entry): PieceFrame => {
  let f = frames.get(entry.id)
  if (f === undefined && entry.piece !== undefined) {
    f = entry.piece.default()
    frames.set(entry.id, f)
  }
  return f as PieceFrame
}

const hsl = (h: number, s: number, l: number): number => {
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const c = (n: number) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))))
  return (c(0) << 16) | (c(8) << 8) | c(4)
}
const DEFAULT_COLOR = 0x01000000
const hex = (s: string): number => parseInt(s.slice(1), 16)

/** Centre a fixed-size picture in W x H, cropping what does not fit. */
const fitInto = (s: string, W: number, H: number): string[] => {
  const lines = s.split('\n')
  const w = Math.max(...lines.map(l => l.length))
  const top = Math.floor((lines.length - H) / 2)
  const left = Math.floor((w - W) / 2)
  const out: string[] = []
  for (let y = 0; y < H; y++) {
    const l = (lines[y + top] ?? '').padEnd(w)
    out.push(left >= 0 ? l.slice(left, left + W) : (' '.repeat(-left) + l).padEnd(W).slice(0, W))
  }
  return out
}

const shaded = (chars: string[], entry: Entry, W: number, H: number): Frame => {
  const fg = new Uint32Array(W * H)
  const [h1, h2] = entry.hues
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const k = (x / W) * 0.6 + (y / H) * 0.4
      fg[y * W + x] = hsl(h1 + (h2 - h1) * k, 0.75, 0.68)
    }
  }
  return { chars, fg }
}

/** The picture `entry` shows `t` seconds in, sized W x H. */
export const render = (entry: Entry, t: number, W: number, H: number): Frame => {
  if (entry.piece === undefined) {
    const p = (t / (entry.dur ?? 6)) % 1
    const anim: Anim | undefined = ANIMS[entry.anim ?? entry.id]
    if (anim === undefined) return shaded(Array.from({ length: H }, () => ' '.repeat(W)), entry, W, H)
    return shaded(anim(p, W, H).split('\n').map(l => l.padEnd(W).slice(0, W)), entry, W, H)
  }
  const { meta } = entry.piece
  if (meta.palette === undefined) return shaded(fitInto(frameOf(entry)(t, { paper: false }), W, H), entry, W, H)

  // A coloured scene drawn in braille, as ascii.rest draws it: dots on the
  // scene's dark ground. A terminal cell holds 2 x 4 dots, so a 120 x 36 pane
  // has more dots than the scene has cells and none is lost. Each dot is the
  // scene cell under it; a cell takes the colour of its brightest dot and keeps
  // only the dots near that brightness, so a lit road never brightens the dim
  // grid beside it.
  const color = new Uint8Array(meta.cols * meta.rows)
  const lines = frameOf(entry)(t, { paper: false, color }).split('\n')
  const cell = meta.cell ?? 2
  const DW = W * 2, DH = H * 4
  const scale = Math.min(meta.cols / DW, (meta.rows * cell) / DH)
  const ox = (meta.cols - DW * scale) / 2
  const oy = (meta.rows - (DH * scale) / cell) / 2
  const palette = meta.palette.map(hex)
  const ground = meta.ground === undefined ? 0 : hex(meta.ground)
  const lumOf = (c: number) => ((c >> 16) & 255) * 0.3 + ((c >> 8) & 255) * 0.59 + (c & 255) * 0.11
  const groundLum = lumOf(ground)
  // Braille dot bits by [column][row] within a cell.
  const BITS = [[0x01, 0x02, 0x04, 0x40], [0x08, 0x10, 0x20, 0x80]]
  const chars: string[] = []
  const fg = new Uint32Array(W * H)
  const dotC = new Uint32Array(8)
  const dotL = new Float64Array(8)
  for (let y = 0; y < H; y++) {
    let row = ''
    for (let x = 0; x < W; x++) {
      let top = 0, topC = ground, topInk = 0
      for (let dx = 0; dx < 2; dx++) {
        for (let dy = 0; dy < 4; dy++) {
          const k = dx * 4 + dy
          const c = Math.floor(ox + (x * 2 + dx + 0.5) * scale)
          const r = Math.floor(oy + ((y * 4 + dy + 0.5) * scale) / cell)
          const ch = lines[r]?.[c] ?? ' '
          const rgb = ch === ' ' || c < 0 || c >= meta.cols ? ground : (palette[color[r * meta.cols + c] ?? 0] ?? ground)
          const l = ch === ' ' ? 0 : Math.max(0, lumOf(rgb) - groundLum) * (0.5 + inkOf(ch) / INK.length)
          dotC[k] = rgb
          dotL[k] = l
          if (l > top) { top = l; topC = rgb; topInk = inkOf(ch) / (INK.length - 1) }
        }
      }
      let bits = 0
      if (top > 4) {
        for (let dx = 0; dx < 2; dx++) for (let dy = 0; dy < 4; dy++) if (dotL[dx * 4 + dy] >= top * 0.55) bits |= BITS[dx]![dy]!
      }
      row += bits === 0 ? ' ' : String.fromCharCode(0x2800 + bits)
      // A small glyph (·) is a faint dot on the website: dim it toward the ground.
      const k = 0.3 + 0.7 * topInk
      const mix = (sh: number) => Math.round(((ground >> sh) & 255) + (((topC >> sh) & 255) - ((ground >> sh) & 255)) * k)
      fg[y * W + x] = (mix(16) << 16) | (mix(8) << 8) | mix(0)
    }
    chars.push(row)
  }
  return { chars, fg, bg: meta.ground === undefined ? undefined : ground }
}

/** How much ink a glyph lays down: a blank least, a full dot or block most. */
const INK = ' .,`\'-·:;~^"=+*•o°#%&$@●█'
const inkOf = (ch: string): number => {
  const i = INK.indexOf(ch)
  return i < 0 ? INK.length / 2 : i
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
