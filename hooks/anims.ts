// @ts-nocheck -- ported as-is from the website, where it is plain JavaScript.
// Asciimood's own animations: each is a pure function of the phase p in [0,1)
// and the size W x H, returning H lines of W characters. Every time term uses
// whole turns of TAU * p, so frame(0) and frame(1) are the same picture.
export type Anim = (p: number, W: number, H: number) => string
import { FOOTAGE } from './footage.ts'

const TAU = Math.PI * 2;
const RAMP = " .:-=+*#%@";
const shade = (v) => RAMP[Math.max(0, Math.min(RAMP.length - 1, Math.floor(v * RAMP.length)))];
const hash = (a, b, c = 0) => {
  let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
const grid = (W, H, ch = " ") => Array.from({ length: H }, () => Array(W).fill(ch));
const out = (g) => g.map((r) => r.join("")).join("\n");
const put = (g, x, y, c) => {
  x = Math.round(x); y = Math.round(y);
  if (y >= 0 && y < g.length && x >= 0 && x < g[0].length) g[y][x] = c;
};
const text = (g, x, y, s) => { for (let i = 0; i < s.length; i++) if (s[i] !== "\u0000") put(g, x + i, y, s[i]); };

// Value noise, periodic along y with period py lattice cells.
const vnoise = (x, y, py) => {
  const xi = Math.floor(x), yi = Math.floor(y);
  const fx = x - xi, fy = y - yi;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const m = (j) => ((j % py) + py) % py;
  const a = hash(xi, m(yi)), b = hash(xi + 1, m(yi));
  const c = hash(xi, m(yi + 1)), d = hash(xi + 1, m(yi + 1));
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
};

const A: Record<string, any> = {};

A.plasma = (p, W, H) => {
  const t = p * TAU; let s = "";
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const X = x / W * 8, Y = y / H * 4;
      let v = Math.sin(X + t) + Math.sin(Y * 1.7 - t) + Math.sin(X * 0.6 + Y * 1.2 + 2 * t)
        + Math.sin(Math.hypot(X - 4 - 2 * Math.cos(t), (Y - 2) * 2 - 2 * Math.sin(t)) * 1.3);
      s += shade((v + 4) / 8);
    }
    s += "\n";
  }
  return s.slice(0, -1);
};

A.moire = (p, W, H) => {
  const t = p * TAU; let s = "";
  const c1x = W / 2 + Math.cos(t) * W / 5, c1y = H / 2 + Math.sin(t) * H / 4;
  const c2x = W / 2 - Math.cos(t) * W / 5, c2y = H / 2 - Math.sin(2 * t) * H / 4;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const d1 = Math.hypot((x - c1x) * 0.5, y - c1y), d2 = Math.hypot((x - c2x) * 0.5, y - c2y);
      const v = (Math.sin(d1 * 1.6) * Math.sin(d2 * 1.6) + 1) / 2;
      s += v > 0.75 ? "#" : v > 0.55 ? "+" : v > 0.4 ? ":" : v > 0.25 ? "." : " ";
    }
    s += "\n";
  }
  return s.slice(0, -1);
};

A.torus = (p, W, H) => {
  const a = p * TAU, b = p * TAU * 2;
  const chars = ".,-~:;=!*#$@";
  const g = grid(W, H), z = new Float32Array(W * H);
  const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
  const K1 = Math.min(W * 0.5, H) * 0.9;
  for (let j = 0; j < TAU; j += 0.07) {
    const cj = Math.cos(j), sj = Math.sin(j);
    for (let i = 0; i < TAU; i += 0.02) {
      const ci = Math.cos(i), si = Math.sin(i);
      const h = cj + 2, D = 1 / (si * h * sa + sj * ca + 5);
      const tt = si * h * ca - sj * sa;
      const x = Math.floor(W / 2 + K1 * 2 * D * (ci * h * cb - tt * sb));
      const y = Math.floor(H / 2 + K1 * D * (ci * h * sb + tt * cb));
      const L = Math.floor(8 * ((sj * sa - si * cj * ca) * cb - si * cj * sa - sj * ca - ci * cj * sb));
      if (y >= 0 && y < H && x >= 0 && x < W && D > z[y * W + x]) {
        z[y * W + x] = D; g[y][x] = chars[Math.max(0, L)];
      }
    }
  }
  return out(g);
};

A.rain = (p, W, H) => {
  const g = grid(W, H), glyphs = "ｱｲｳｴｵｶｷｸｹｺ01<>{}=+*#$%&ﾊﾋﾌﾍﾎ";
  const asciiGlyphs = "01<>{}[]=+*#$%&/\\|;:?";
  const L = Math.floor(H * 0.7), P = H + L, step = Math.floor(p * 24);
  for (let x = 0; x < W; x += 2) {
    for (let s = 0; s < 2; s++) {
      const k = 1 + Math.floor(hash(x, s, 7) * 3);
      const head = (hash(x, s, 3) * P + p * k * P) % P;
      for (let i = 0; i < L; i++) {
        const y = Math.floor(head - i);
        if (y < 0 || y >= H) continue;
        const c = asciiGlyphs[Math.floor(hash(x, y, step + i) * asciiGlyphs.length)];
        g[y][x] = i === 0 ? "@" : i < L * 0.3 ? c : i < L * 0.65 ? (hash(x, y, 1) > 0.5 ? ":" : c) : ".";
      }
    }
  }
  void glyphs;
  return out(g);
};

A.tunnel = (p, W, H) => {
  let s = "";
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const dx = (x - W / 2) / (W / 2), dy = (y - H / 2) / (H / 2);
      const r = Math.hypot(dx, dy) + 1e-3, a = Math.atan2(dy, dx);
      const u = 1.2 / r + p * 2, v = a / TAU * 12 + p * 2;
      const chk = (Math.floor(u * 2) + Math.floor(v)) & 1;
      const depth = Math.min(1, r * 1.1);
      s += r < 0.08 ? " " : chk ? shade(depth * 0.95) : (depth > 0.5 ? "." : " ");
    }
    s += "\n";
  }
  return s.slice(0, -1);
};

A.waves = (p, W, H) => {
  const t = p * TAU, g = grid(W, H);
  const layers = [
    { base: 0.35, amp: 0.10, f: 0.18, k: 1, ch: "~", fill: " " },
    { base: 0.55, amp: 0.12, f: 0.11, k: -1, ch: "≈", fill: "." },
    { base: 0.75, amp: 0.10, f: 0.23, k: 2, ch: "~", fill: ":" },
  ];
  for (const Lr of layers) {
    for (let x = 0; x < W; x++) {
      const h = H * (Lr.base + Lr.amp * Math.sin(x * Lr.f + Lr.k * t) + 0.04 * Math.sin(x * 0.5 - 3 * t));
      const top = Math.round(h);
      for (let y = Math.max(0, top); y < H; y++) g[y][x] = y === top ? Lr.ch : Lr.fill;
    }
  }
  // a boat riding the first layer
  const bx = Math.round(W * 0.5 + W * 0.3 * Math.sin(t));
  const by = Math.round(H * (0.35 + 0.10 * Math.sin(bx * 0.18 + t) + 0.04 * Math.sin(bx * 0.5 - 3 * t)));
  text(g, bx - 3, by - 2, "  |\\  ");
  text(g, bx - 3, by - 1, "\\____/");
  return out(g);
};

A.orbits = (p, W, H) => {
  const t = p * TAU, g = grid(W, H), cx = W / 2, cy = H / 2;
  const planets = [
    { r: 0.22, k: 3, c: "o", ph: 0 }, { r: 0.42, k: 2, c: "O", ph: 1.3 },
    { r: 0.63, k: 1, c: "@", ph: 2.6 }, { r: 0.85, k: -1, c: "*", ph: 4.1 },
  ];
  for (const pl of planets) {
    const rx = pl.r * W * 0.48, ry = pl.r * H * 0.48;
    for (let a = 0; a < TAU; a += 0.05) put(g, cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, "·");
    for (let tr = 1; tr <= 4; tr++) {
      const a = pl.ph + pl.k * t - Math.sign(pl.k) * tr * 0.09;
      put(g, cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, tr < 3 ? ":" : ".");
    }
    const a = pl.ph + pl.k * t;
    put(g, cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, pl.c);
    if (pl.c === "@") { // moon
      const ma = 4 * t;
      put(g, cx + Math.cos(a) * rx + Math.cos(ma) * 3, cy + Math.sin(a) * ry + Math.sin(ma) * 1.5, "°");
    }
  }
  text(g, Math.round(cx) - 1, Math.round(cy), "(#)");
  return out(g);
};

A.lava = (p, W, H) => {
  const t = p * TAU; let s = "";
  const blobs = [
    [0.30, 1, 0.0, 0.5], [0.55, -1, 1.5, 0.45], [0.70, 2, 3.0, 0.35],
    [0.45, 1, 4.2, 0.4], [0.25, -2, 5.3, 0.3],
  ].map(([bx, k, ph, r]) => ({
    x: W * (bx + 0.06 * Math.sin(t + ph)),
    y: H * (0.5 + 0.38 * Math.sin(k * t + ph)),
    r: r * H * 0.55,
  }));
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let f = 0;
      for (const b of blobs) { const dx = (x - b.x) * 0.5, dy = y - b.y; f += (b.r * b.r) / (dx * dx + dy * dy + 0.5); }
      f += (y / H) ** 6 * 1.6; // pool at the bottom
      s += f > 2.2 ? "@" : f > 1.6 ? "%" : f > 1.15 ? "o" : f > 0.9 ? "." : " ";
    }
    s += "\n";
  }
  return s.slice(0, -1);
};

A.helix = (p, W, H) => {
  const t = p * TAU, g = grid(W, H), cy = H / 2, R = H * 0.42, bases = "ATGC";
  for (let x = 0; x < W; x++) {
    const ph = x * 0.22 - t;
    const y1 = cy + Math.sin(ph) * R, y2 = cy - Math.sin(ph) * R, front = Math.cos(ph) > 0;
    if (x % 3 === 0) {
      const lo = Math.min(y1, y2), hi = Math.max(y1, y2);
      for (let y = Math.ceil(lo + 1); y < hi; y++) put(g, x, y, Math.abs(Math.cos(ph)) > 0.3 ? "|" : ":");
      const b = Math.floor(hash(x, 0, 5) * 4);
      put(g, x, y1, bases[b]); put(g, x, y2, bases[[1, 0, 3, 2][b]]);
    } else {
      put(g, x, y1, front ? "@" : "o");
      put(g, x, y2, front ? "o" : "@");
    }
  }
  return out(g);
};

A.cube = (p, W, H) => {
  const t = p * TAU, g = grid(W, H), S = Math.min(W / 2, H) * 0.5;
  const V = [];
  for (let i = 0; i < 8; i++) V.push([i & 1 ? 1 : -1, i & 2 ? 1 : -1, i & 4 ? 1 : -1]);
  const ax = t, ay = 2 * t, az = t;
  const P = V.map(([x, y, z]) => {
    let c = Math.cos(ax), s = Math.sin(ax);[y, z] = [y * c - z * s, y * s + z * c];
    c = Math.cos(ay); s = Math.sin(ay);[x, z] = [x * c + z * s, -x * s + z * c];
    c = Math.cos(az); s = Math.sin(az);[x, y] = [x * c - y * s, x * s + y * c];
    const d = 3.2 / (z + 4.2);
    return [W / 2 + x * S * 2 * d, H / 2 + y * S * d, z];
  });
  const E = [];
  for (let i = 0; i < 8; i++) for (let b = 1; b < 8; b <<= 1) if (!(i & b)) E.push([i, i | b]);
  for (const [i, j] of E) {
    const [x0, y0] = P[i], [x1, y1] = P[j], n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 1.5) + 1;
    const sl = (y1 - y0) / ((x1 - x0) * 0.5 || 1e-6);
    const c = Math.abs(sl) < 0.4 ? "-" : Math.abs(sl) > 2.5 ? "|" : sl > 0 ? "\\" : "/";
    for (let k = 0; k <= n; k++) put(g, x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n, c);
  }
  for (const [x, y, z] of P) put(g, x, y, z < 0 ? "@" : "o");
  return out(g);
};

A.fire = (p, W, H) => {
  const chars = " .:^*ox%#@"; let s = "";
  const py = 6, scale = 0.28, M = py / scale; // vertical travel = one lattice period
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const yy = (y + p * M) * scale, xx = x * 0.14;
      let n = vnoise(xx, yy, py) * 0.6 + vnoise(xx * 2 + 9, yy * 2, py * 2) * 0.4;
      const hgt = y / (H - 1);
      const edge = 1 - Math.abs(x - W / 2) / (W / 2) * 0.55;
      let v = (n * 1.2 - 0.25) * hgt * 1.4 * edge + hgt ** 3 * 0.35;
      s += chars[Math.max(0, Math.min(chars.length - 1, Math.floor(v * chars.length)))];
    }
    s += "\n";
  }
  return s.slice(0, -1);
};

A.cat = (p, W, H) => {
  const t = p * TAU, g = grid(W, H), inhale = Math.sin(t) > 0;
  const ox = Math.round(W / 2 - 11), oy = Math.round(H / 2 - 2);
  const art = [
    "     /\\_/\\",
    "    ( -.- )_________",
    inhale ? "   (  \")   (       )\\" : "    (\")    (       )\\",
    inhale ? "  (________________) )" : "   (_______________) )",
    "                    -'",
  ];
  art.forEach((l, i) => text(g, ox, oy + i, l.replace(/ /g, "\u0000")));
  // a tail tip that flicks once per loop
  if (p > 0.6 && p < 0.7) put(g, ox + 21, oy + 4, "~");
  // Zs float up and fade
  for (let i = 0; i < 3; i++) {
    const q = (p * 2 + i / 3) % 1;
    if (q > 0.85) continue;
    put(g, ox + 10 + q * 7 + Math.sin(q * TAU) * 0.8, oy - 1 - q * (oy + 0.5), q < 0.3 ? "z" : "Z");
  }
  // pillow
  text(g, ox - 2, oy + 5, "~".repeat(26).replace(/~/g, (c, i) => (i % 2 ? "~" : "-")));
  return out(g);
};

// A gull seen head-on, wings in an M, drawn in dense letters that thin out
// to dots at the edges. It glides, beats its wings three times, glides again.
const PLUMAGE = [".,'`", ":;i!r", "vucxzJ7L", "YZUCOPSk", "BMOG8EQ0", "@B&W%#M"];
A.gull = (p, W, H) => {
  const t = p * TAU, env = (1 - Math.cos(t)) / 2, beat = Math.sin(3 * t) * env;
  const S = Math.min(W * 0.46, H * 1.8), U = Math.min(S * 0.22, H * 0.34);
  const cx = W / 2, cy = H * 0.5 - U * 0.12 * env * Math.cos(3 * t);
  const elbow = 0.45 + 0.3 * beat, tip = -0.5 + 0.75 * Math.sin(3 * t - 0.7) * env;
  const step = Math.floor(p * 24);
  let s = "";
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const side = Math.abs(x - cx) / S;
      let v = 0;
      if (side <= 1) {
        // centre line of the wing, in rows above the body (positive is up)
        const k = (side - 0.42) / 0.58;
        const lift = side < 0.42 ? elbow * Math.sin(side / 0.42 * Math.PI / 2) : elbow + (tip - elbow) * k ** 1.4;
        const th = U * 0.8 * (1 - side) ** 0.9 + 0.9;
        const mid = cy - lift * U + th * 0.15;
        const d = (y - mid) / (y < mid ? th * 0.4 : th * 0.8); // feathers hang below
        v = Math.max(0, 1 - Math.abs(d) ** 1.6) * (1 - side ** 4);
        // ragged trailing edge
        if (d > 0.4) v *= 0.55 + 0.45 * hash(x, y, 9);
      }
      // body and head
      const bx = (x - cx) / (S * 0.1), by = (y - cy - U * 0.05) / (U * 0.45);
      v = Math.max(v, 1 - Math.hypot(bx, by));
      const hx = (x - cx) / (S * 0.05), hy = (y - cy + U * 0.42) / (U * 0.2);
      v = Math.max(v, (1 - Math.hypot(hx, hy)) * 1.2);
      if (v <= 0.04) { s += " "; continue; }
      const tier = Math.max(0, Math.min(5, Math.floor((v + (hash(x, y, 4) - 0.5) * 0.25) * 6.5)));
      const set = PLUMAGE[tier];
      s += set[Math.floor(hash(x, y, step) * set.length)];
    }
    s += "\n";
  }
  return s.slice(0, -1);
};

// Footage: a real clip (built by tools/footage/build.mjs) drawn in ASCII. Each
// cell is cut into 4x8 sub-pixels of the frame's ink, and gets the character
// whose own ink is shaped most like them; a fixed pick among the near-best
// gives the mixed-letter texture. Frames are worked out once per size.
const unpack = (s, n) => {
  const q = new Uint8Array(n);
  for (let i = 0, k = 0; k < s.length; ) {
    if (s[k] === ".") { const e = s.indexOf(";", k); i += parseInt(s.slice(k + 1, e), 36); k = e + 1; }
    else q[i++] = parseInt(s[k++], 16);
  }
  return q;
};
const reels = {};
const footage = (id, data = FOOTAGE) => (p, W, H) => {
  const FOOTAGE = data, clip = FOOTAGE.clips[id];
  if (!clip) return out(grid(W, H));
  const [SX, SY] = FOOTAGE.sub, cells = SX * SY;
  let reel = reels[id];
  if (!reel) {
    const n = FOOTAGE.chars.length, shapes = new Float32Array(n * cells);
    for (let i = 0; i < shapes.length; i++) shapes[i] = parseInt(FOOTAGE.shapes[i], 16) / 15;
    reel = reels[id] = { frames: clip.frames.map((s) => unpack(s, clip.w * clip.h)), shapes, size: "", drawn: [] };
  }
  if (reel.size !== W + "x" + H) { reel.size = W + "x" + H; reel.drawn = []; }
  const k = Math.floor(p * clip.frames.length) % clip.frames.length;
  if (reel.drawn[k]) return reel.drawn[k];
  const f = reel.frames[k], cw = Math.max(clip.w / (W * 0.94), clip.h / (H * 0.92 * 2));
  const ox = (W - clip.w / cw) / 2, oy = (H - clip.h / cw / 2) / 2;
  const ink = (x, y) => {
    x -= 0.5; y -= 0.5;
    const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
    const at = (a, b) => (a < 0 || b < 0 || a >= clip.w || b >= clip.h ? 0 : f[b * clip.w + a] / 15);
    return (at(x0, y0) * (1 - fx) + at(x0 + 1, y0) * fx) * (1 - fy) + (at(x0, y0 + 1) * (1 - fx) + at(x0 + 1, y0 + 1) * fx) * fy;
  };
  const v = new Float32Array(cells), best = [[0, 0], [0, 0], [0, 0]];
  let s = "";
  for (let r = 0; r < H; r++) {
    for (let q = 0; q < W; q++) {
      let sum = 0;
      for (let sy = 0; sy < SY; sy++) for (let sx = 0; sx < SX; sx++) {
        const a = ink((q - ox + (sx + 0.5) / SX) * cw, (r - oy + (sy + 0.5) / SY) * cw * 2) * 0.62;
        v[sy * SX + sx] = a; sum += a;
      }
      const mean = sum / cells;
      if (mean < 0.04) { s += " "; continue; }
      best[0][0] = best[1][0] = best[2][0] = Infinity;
      for (let g = 0; g < FOOTAGE.chars.length; g++) {
        let e = 0;
        for (let i = 0, o = g * cells; i < cells; i++) { const t = v[i] - reel.shapes[o + i]; e += t * t; }
        if (e < best[2][0]) { best[2] = [e, g]; best.sort((a, b) => a[0] - b[0]); }
      }
      const near = best.filter(([e]) => e <= best[0][0] * 1.25 + 0.03);
      s += FOOTAGE.chars[near[Math.floor(hash(q, r, 77) * near.length)][1]];
    }
    s += "\n";
  }
  return (reel.drawn[k] = s.slice(0, -1));
};

// A horse at full gallop: Eadweard Muybridge's The Horse in Motion (1878),
// public domain, fifteen photographs a stride.
A.horse = footage("horse");

// A cat face-on, drawn as a lattice of dots like a dot-matrix print: each cell
// holds two dots, one above the other (":", or "˙" / "." for one), so any font draws it.
// Shapes are laid out in a 720x900 sketch and scaled to fit, sitting on the
// bottom edge. It blinks once a loop; nothing else moves.
const ellipse = (x, y, cx, cy, rx, ry) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
const tri = (x, y, [ax, ay], [bx, by], [cx, cy]) => {
  const s = (px, py, qx, qy, rx, ry) => (px - rx) * (qy - ry) - (qx - rx) * (py - ry);
  const d1 = s(x, y, ax, ay, bx, by), d2 = s(x, y, bx, by, cx, cy), d3 = s(x, y, cx, cy, ax, ay);
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
};
const nearLine = (x, y, ax, ay, bx, by, w) => {
  const dx = bx - ax, dy = by - ay, u = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(x - ax - u * dx, y - ay - u * dy) <= w;
};
A.dotcat = (p, W, H) => {
  const open = Math.min(1, Math.abs(p - 0.6) / 0.035); // one blink: 1 open, 0 shut
  const DW = W, DH = H * 2, s = Math.min((DW * 0.92) / 640, (DH * 0.96) / 800);
  const ox = DW / 2 - 392 * s, oy = DH - 900 * s;
  const cat = (x, y) => {
    for (const [cx, cy, rx, pd] of [[283, 437, 68, 30], [510, 437, 62, -20]]) {
      const ry = Math.max(9, 52 * open); // shut, a slit stays
      if (ellipse(x, y, cx, cy, rx, ry)) return open > 0.4 && ellipse(x, y, cx + pd, cy - 4, 20, 30); // eye white, pupil
    }
    if (y >= 285 && y <= 640 && x >= 140 && x <= 612) return true; // head
    if (tri(x, y, [245, 100], [148, 300], [348, 300]) || tri(x, y, [515, 100], [418, 300], [607, 300])) return true; // ears
    if (y >= 620 && tri(x, y, [250, 620], [140, 905], [500, 620]) || tri(x, y, [500, 620], [140, 905], [548, 905])) return true; // body
    for (const [ax, ay, bx, by] of [[82, 518, 150, 518], [82, 568, 150, 550], [112, 612, 152, 588], [622, 512, 702, 512], [622, 550, 706, 568], [622, 588, 666, 612]])
      if (nearLine(x, y, ax, ay, bx, by, 7)) return true; // whiskers
    return false;
  };
  let out = "";
  for (let r = 0; r < H; r++) {
    for (let q = 0; q < W; q++) {
      const top = cat((q + 0.5 - ox) / s, (r * 2 + 0.5 - oy) / s), bottom = cat((q + 0.5 - ox) / s, (r * 2 + 1.5 - oy) / s);
      out += top ? (bottom ? ":" : "˙") : bottom ? "." : " ";
    }
    out += "\n";
  }
  return out.slice(0, -1);
};

// Bolt: a thick lightning bolt turning on its vertical axis, redrawn from a Pinterest clip
// of a spinning ASCII bolt. Our own zigzag outline extruded into a slab, ray-marched as a
// distance field and sampled 2x2 per cell: faces in "0"s thinning to "=:." away from the
// light, the thickness in "|1" strokes. It leans back, so its edge shows as a slanted sliver.
A.bolt = (() => {
  // the bolt outline, y up, centred on the origin
  const POLY = [[0.1, 1], [0.62, 1], [0.22, 0.2], [0.55, 0.2], [-0.3, -1], [-0.02, -0.12], [-0.4, -0.12]]
    .map(([x, y]) => [x - 0.1, y]);
  const HALF = 0.11; // half the slab's thickness

  // signed distance to the outline (negative inside)
  const poly2 = (x, y) => {
    let d = Infinity, s = 1;
    for (let i = 0, j = POLY.length - 1; i < POLY.length; j = i++) {
      const [ax, ay] = POLY[i], [bx, by] = POLY[j];
      const ex = bx - ax, ey = by - ay, wx = x - ax, wy = y - ay;
      const t = Math.max(0, Math.min(1, (wx * ex + wy * ey) / (ex * ex + ey * ey)));
      d = Math.min(d, (wx - ex * t) ** 2 + (wy - ey * t) ** 2);
      const c1 = y >= ay, c2 = y < by, c3 = ex * wy > ey * wx;
      if ((c1 && c2 && c3) || (!c1 && !c2 && !c3)) s = -s;
    }
    return s * Math.sqrt(d);
  };
  const bolt = (x, y, z) => {
    const dx = poly2(x, y), dz = Math.abs(z) - HALF;
    return Math.min(Math.max(dx, dz), 0) + Math.hypot(Math.max(dx, 0), Math.max(dz, 0));
  };

  const CAP = [".", ":", "=", "o", "0", "0"], SIDE = [".", ":", "|", "1", "1", "I"];
  const L = (() => { const v = [-0.45, 0.45, -0.77], n = Math.hypot(...v); return v.map((c) => c / n); })();
  const PITCH = 0.1, LEAN = -0.45; // top tipped away from the viewer, the face up to the light

  return (p, W, H) => {
    const yaw = TAU * (p - 0.3), c = Math.cos(yaw), s = Math.sin(yaw), cp = Math.cos(PITCH), sp = Math.sin(PITCH);
    const cl = Math.cos(LEAN), sl = Math.sin(LEAN);
    const sc = Math.min((H * 0.94) / 2.25, (W * 0.95) / 2.6); // rows per unit
    // world -> the bolt's own frame: undo the camera tilt, the turn, then the lean
    const toBolt = (X, Y, Z) => {
      const y = cp * Y - sp * Z, z = sp * Y + cp * Z, x1 = c * X + s * z, z1 = -s * X + c * z;
      return [x1, cl * y - sl * z1, sl * y + cl * z1];
    };
    const toWorld = (x, y, z) => {
      const y1 = cl * y + sl * z, z1 = -sl * y + cl * z, X = c * x - s * z1, z2 = s * x + c * z1;
      return [X, cp * y1 + sp * z2, -sp * y1 + cp * z2];
    };
    // one sample: null for nothing, else { lit, side }
    const sample = (X, Y) => {
      if (X * X + Y * Y > 1.6) return null;
      let t = 0;
      for (let i = 0; i < 64; i++) {
        const [bx, by, bz] = toBolt(X, Y, -3 + t);
        const d = bolt(bx, by, bz);
        if (d < 0.002) {
          const e = 0.004, k = [[1, -1, -1], [-1, -1, 1], [-1, 1, -1], [1, 1, 1]];
          let nx = 0, ny = 0, nz = 0;
          for (const [a, b, g] of k) { const v = bolt(bx + a * e, by + b * e, bz + g * e); nx += a * v; ny += b * v; nz += g * v; }
          const nl = Math.hypot(nx, ny, nz);
          const side = Math.abs(nz / nl) < 0.7;
          const [wx, wy, wz] = toWorld(nx / nl, ny / nl, nz / nl);
          const lit = 0.15 + 0.85 * Math.max(0, wx * L[0] + wy * L[1] + wz * L[2]);
          return { lit, side };
        }
        t += d;
        if (t > 6) break;
      }
      return null;
    };
    let out = "";
    for (let r = 0; r < H; r++) {
      for (let q = 0; q < W; q++) {
        const v = [];
        for (const [i, j] of [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]])
          v.push(sample((q + i - W / 2) / (2 * sc), -(r + j - H / 2) / sc));
        const [tl, tr, bl, br] = v.map((a) => a !== null), n = tl + tr + bl + br, h = hash(q, r, 5);
        let ch = " ";
        if (n === 4) {
          const lit = (v[0].lit + v[1].lit + v[2].lit + v[3].lit) / 4, side = v.filter((a) => a.side).length >= 2;
          const tiers = side ? SIDE : CAP;
          ch = tiers[Math.max(0, Math.min(tiers.length - 1, Math.floor((lit + (h - 0.5) * 0.04) * (tiers.length - 1))))];
        } else if (n === 3) ch = !tl ? "/" : !tr ? "\\" : !bl ? "\\" : "/";
        else if (n === 2) {
          if (tl && tr) ch = "'";
          else if (bl && br) ch = h < 0.6 ? "." : ",";
          else if (tl && bl) ch = ":";
          else if (tr && br) ch = ":";
          else ch = tl ? "\\" : "/";
        } else if (n === 1) ch = tl || tr ? "'" : ".";
        out += ch;
      }
      out += "\n";
    }
    return out.slice(0, -1);
  };
})();

// Heart: a heart with two eyes, redrawn from a screenshot of a heart logo with eyes.
// Our own shape: the classic parametric heart (x = 16 sin^3 t, y = 13 cos t - ...) drawn as a
// thin line, its tangent picking / \ | _ - per cell. It beats lub-dub three times a loop; the
// almond eyes look right, then left, then down, and blink once. Eyes sampled 2x2 per cell:
// full cells get dense letters, part-filled cells get edge strokes, the pupil stays dark.
A.heart = (() => {
  const smooth = (e0, e1, x) => {
    const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
    return t * t * (3 - 2 * t);
  };
  // a bump around phase c (wrapped, so it loops), width w
  const bump = (p, c, w) => {
    let d = Math.abs(p - c) % 1;
    d = Math.min(d, 1 - d);
    return Math.exp(-(d * d) / (2 * w * w));
  };
  // gaze keyframes over one loop: [p, x, y] in units of the pupil's travel
  const GAZE = [[0.0, 0.75, 0.45], [0.22, 0.75, 0.45], [0.34, -0.75, 0.35], [0.56, -0.75, 0.35], [0.66, 0.0, -0.5], [0.86, 0.0, -0.5], [1.0, 0.75, 0.45]];
  const gaze = (p) => {
    for (let i = 0; i < GAZE.length - 1; i++) {
      const [a, ax, ay] = GAZE[i], [b, bx, by] = GAZE[i + 1];
      if (p >= a && p <= b) {
        const k = smooth(a, b, p);
        return [ax + (bx - ax) * k, ay + (by - ay) * k];
      }
    }
    return [GAZE[0][1], GAZE[0][2]];
  };
  const DENSE = "@@#%&8B";

  return (p, W, H) => {
    // lub-dub, three beats a loop
    let beat = 0;
    for (let k = 0; k < 3; k++) beat += bump(p, k / 3 + 0.04, 0.012) + 0.6 * bump(p, k / 3 + 0.085, 0.012);
    const s = 1 + 0.08 * beat;
    const sc = Math.min((W * 0.8) / 34, (H * 2 * 0.84) / 30) * s; // columns per unit; rows are two columns tall
    const cx = W / 2, cy = H / 2 - 0.4; // heart centre (y unit 0 sits a bit above the middle)
    const yOff = 2.5; // the parametric heart spans y -17..12; centre it
    const grid = Array.from({ length: H }, () => new Array(W).fill(" "));

    // the outline, one stroke thick: steep stretches get one cell per row (where the curve
    // crosses the row's middle), shallow ones one cell per column; the tangent picks the stroke
    const N = 900;
    const toCell = (t) => {
      const x = 16 * Math.sin(t) ** 3;
      const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      return [cx + x * sc, cy - ((y + yOff) * sc) / 2];
    };
    const put = (q, r, ch) => {
      if (q >= 0 && q < W && r >= 0 && r < H && grid[r][q] === " ") grid[r][q] = ch;
    };
    const stroke = (a, fy) => {
      if (Math.abs(a) < 22) return fy > 0.6 ? "_" : fy < 0.25 ? "\"" : "-";
      if (Math.abs(a) > 72) return "|";
      return a > 0 ? "/" : "\\";
    };
    const pts = [];
    for (let i = 0; i <= N; i++) pts.push(toCell((i / N) * TAU));
    // the cleft and the tip are corners: the curve runs into both almost straight up and
    // down, so cut that stem off and close each with one V where the two sides meet
    const CLEFT = 0.26, TIP = 0.28;
    put(Math.floor(cx), Math.floor(toCell(CLEFT)[1]), "V");
    put(Math.floor(cx), Math.floor(toCell(Math.PI - TIP)[1]), "V");
    for (let i = 0; i < N; i++) {
      const t = ((i + 0.5) / N) * TAU;
      if (Math.min(t, TAU - t) < CLEFT || Math.abs(t - Math.PI) < TIP) continue;
      const [AX, AY] = pts[i], [BX, BY] = pts[i + 1];
      const dx = BX - AX, dy = (BY - AY) * 2;
      const a = (Math.atan2(-dy * Math.sign(dx || 1), Math.abs(dx)) * 180) / Math.PI; // -90..90, up positive
      if (Math.abs(a) > 34) {
        for (let r = Math.ceil(Math.min(AY, BY) - 0.5); r + 0.5 <= Math.max(AY, BY); r++) {
          const k = (r + 0.5 - AY) / (BY - AY);
          put(Math.floor(AX + dx * k), r, stroke(a, 0.5));
        }
      } else {
        for (let q = Math.ceil(Math.min(AX, BX) - 0.5); q + 0.5 <= Math.max(AX, BX); q++) {
          const Y = AY + (BY - AY) * ((q + 0.5 - AX) / (BX - AX));
          put(q, Math.floor(Y), stroke(a, Y - Math.floor(Y)));
        }
      }
    }

    // the eyes: almonds that blink, pupils that wander
    const blink = Math.max(bump(p, 0.6, 0.012), bump(p, 0.95, 0.01));
    const open = 1 - smooth(0.25, 0.95, blink);
    const [gx, gy] = gaze(p);
    const EX = 7.4, EY = 1.6, HW = 4.4, HH = 3.1 * open + 0.15, PR = 2.0;
    const eyeAt = (ux, uy) => {
      for (const side of [-1, 1]) {
        const lx = ux - side * EX, ly = uy - EY;
        const f = 1 - (lx / HW) ** 2;
        if (f <= 0) continue;
        // a slight droop to the outer corner gives it a soft look
        const tilt = -0.12 * side * lx;
        const top = HH * f ** 0.75 + tilt, bot = -HH * 0.85 * f ** 0.75 + tilt;
        if (ly > top || ly < bot) continue;
        const px = gx * (HW - PR - 0.6), py = gy * Math.max(0, HH - PR * 0.7);
        const dp = Math.hypot(lx - px, ly - py);
        return dp < PR ? 2 : 1;
      }
      return 0;
    };
    const SUB = [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]];
    for (let r = 0; r < H; r++) {
      for (let q = 0; q < W; q++) {
        const v = SUB.map(([i, j]) => eyeAt((q + i - cx) / sc, -(((r + j - cy) * 2) / sc) - yOff));
        const lit = v.map((a) => a === 1), n = lit.filter(Boolean).length;
        if (!v.some((a) => a > 0)) continue;
        const [tl, tr, bl, br] = lit, h = hash(q, r, 7);
        let ch = " ";
        if (n === 4) ch = DENSE[Math.floor(h * DENSE.length)];
        else if (n === 3) ch = !tl ? "d" : !tr ? "b" : !bl ? "Y" : "P";
        else if (n === 2) {
          if (tl && tr) ch = "\"";
          else if (bl && br) ch = "_";
          else if (tl && bl) ch = "[";
          else if (tr && br) ch = "]";
          else ch = tl ? "\\" : "/";
        } else if (n === 1) ch = tl || tr ? "'" : ".";
        grid[r][q] = ch;
      }
    }
    // one glint per pupil, a single cell up and to the right of its centre
    if (open > 0.6) {
      const px = gx * (HW - PR - 0.6), py = gy * Math.max(0, HH - PR * 0.7);
      for (const side of [-1, 1]) {
        const q = Math.floor(cx + (side * EX + px + 0.7) * sc), r = Math.floor(cy - ((EY + py + 0.8 + yOff) * sc) / 2);
        if (r >= 0 && r < H && q >= 0 && q < W && grid[r][q] === " ") grid[r][q] = "o";
      }
    }
    return grid.map((row) => row.join("")).join("\n");
  };
})();

// Hero: the word ASCIIMOOD filled with plasma over a dim field.
const FONT = {
  K: ["#   #", "#  # ", "# #  ", "##   ", "# #  ", "#  # ", "#   #"],
  I: ["#####", "  #  ", "  #  ", "  #  ", "  #  ", "  #  ", "#####"],
  N: ["#   #", "##  #", "# # #", "#  ##", "#   #", "#   #", "#   #"],
  E: ["#####", "#    ", "#    ", "#### ", "#    ", "#    ", "#####"],
  T: ["#####", "  #  ", "  #  ", "  #  ", "  #  ", "  #  ", "  #  "],
  Y: ["#   #", "#   #", " # # ", "  #  ", "  #  ", "  #  ", "  #  "],
  A: [" ### ", "#   #", "#   #", "#####", "#   #", "#   #", "#   #"],
  S: [" ####", "#    ", "#    ", " ### ", "    #", "    #", "#### "],
  C: [" ####", "#    ", "#    ", "#    ", "#    ", "#    ", " ####"],
  M: ["#   #", "## ##", "# # #", "#   #", "#   #", "#   #", "#   #"],
  O: [" ### ", "#   #", "#   #", "#   #", "#   #", "#   #", " ### "],
  D: ["#### ", "#   #", "#   #", "#   #", "#   #", "#   #", "#### "],
};
A.hero = (p, W, H) => {
  const t = p * TAU, word = "ASCIIMOOD";
  const sx = W >= word.length * 12 ? 2 : 1, sy = H >= 18 ? 2 : 1;
  const ww = word.length * 6 * sx - sx, wh = 7 * sy;
  const ox = Math.floor((W - ww) / 2), oy = Math.floor((H - wh) / 2);
  let s = "";
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const lx = Math.floor((x - ox) / sx), ly = Math.floor((y - oy) / sy);
      const li = Math.floor(lx / 6), cx = lx % 6;
      const on = lx >= 0 && ly >= 0 && ly < 7 && li < word.length && cx < 5 && FONT[word[li]][ly][cx] === "#";
      const X = x / W * 10, Y = y / H * 5;
      const v = (Math.sin(X + t) + Math.sin(Y * 1.5 + 2 * t) + Math.sin((X + Y) * 0.7 - t) + 3) / 6;
      if (on) {
        const wave = Math.sin(x * 0.15 - y * 0.3 - 2 * t);
        s += "%#@&$8"[Math.floor((v * 0.7 + (wave + 1) * 0.15) * 5.99)];
      } else if (x >= ox - 2 && x < ox + ww + 2 && y >= oy - 1 && y < oy + wh + 1) {
        s += " ";
      } else {
        const bg = Math.sin(x * 0.11 + 2 * t) * Math.cos(y * 0.35 - t) + Math.sin(Math.hypot(x - W / 2, (y - H / 2) * 2) * 0.25 - 3 * t) * 0.6;
        s += bg > 1.1 ? ":" : bg > 0.6 ? "." : bg < -1.25 ? "·" : " ";
      }
    }
    s += "\n";
  }
  return s.slice(0, -1);
};

// Pseudo-random dissolve between two frames (used for state transitions).
A.dissolve = (from, to, k) => {
  let o = "";
  const n = Math.max(from.length, to.length);
  for (let i = 0; i < n; i++) {
    const a = from[i] ?? " ", b = to[i] ?? " ";
    if (b === "\n" || a === "\n") { o += b === "\n" ? "\n" : a === "\n" ? "\n" : b; continue; }
    const r = hash(i, 11);
    o += r < k ? b : r < k + 0.08 ? "░" : a;
  }
  return o;
};

export const ANIMS = A as Record<string, Anim> & { dissolve: (from: string, to: string, k: number) => string }
