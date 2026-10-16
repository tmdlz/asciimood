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

// Cup of tea: a steaming mug of tea in dense letters, redrawn from a static ASCII "not my cup
// of tea" mug on Pinterest. Our own shape: a cylinder seen from a little above, lit from the
// left, sampled 2x2 per cell. Lit glaze is "M", shadow thins to "/:-.", and the silhouette gets
// edge letters as in hand-made ASCII. Steam rises off it in three wisps and slow rings spread
// across the tea.
A.cup = (() => {
  const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  // the sketch is 36 x 32 rows (a row is two columns wide), the mug sits on its bottom edge
  // the rim is drawn thicker front and back than true perspective would, so the lip reads
  const CX = 16, R = 9.5, K = 0.33, RIM = 12.5, BASE = 28.4, WALL = 1.1, DEPTH = 2.1;
  const RI = R - WALL, RIY = R * K - 0.85, HX = CX + R - 0.4, HY = 19.6;
  const LABEL = ["NOT MY", "CUP OF", "TEA"];
  const TIERS = [".`", "-:", "/+", "+o", "OS", "YH", "DN", "NM", "M"];

  // what lies at (X, Y): [kind, light]. kinds: 0 nothing, 1 glaze (solid), 2 inner wall, 3 tea
  const at = (X, Y) => {
    const dx = X - CX, rim = (dx / R) ** 2 + ((Y - RIM) / (R * K)) ** 2;
    if (rim <= 1) {
      if ((dx / RI) ** 2 + ((Y - RIM) / RIY) ** 2 > 1) return [1, Y > RIM ? 0.85 : 0.5]; // the rim
      if ((dx / RI) ** 2 + ((Y - RIM - DEPTH) / RIY) ** 2 <= 1) return [3, 0];
      const nx = dx / RI; // the far wall, seen from inside: lit on the right
      return [2, Math.max(0, 0.75 * nx + 0.66 * Math.sqrt(1 - Math.min(1, nx * nx)))];
    }
    if (Math.abs(dx) <= R && Y > RIM && ((Y - BASE) / (R * K)) ** 2 + (dx / R) ** 2 <= 1 || Math.abs(dx) <= R && Y > RIM && Y <= BASE) {
      const nx = dx / R, nz = Math.sqrt(1 - Math.min(1, nx * nx));
      const lit = Math.max(0, -0.75 * nx + 0.66 * nz) * (1 - 0.25 * smooth(RIM + 4, BASE + 3, Y));
      return [1, 0.22 + 0.78 * lit];
    }
    if (X > CX + R - 0.3) { // the handle, a loop on the shadow side
      const ro = Math.hypot((X - HX) / 5.2, (Y - HY) / 6.4), ri = Math.hypot((X - HX) / 2.9, (Y - HY) / 3.9);
      if (ro <= 1 && ri >= 1) {
        const t = (1 - ro) / (1 - ro + ri - 1 + 1e-6);
        return [1, 0.3 + 0.45 * Math.sin(Math.PI * t) * (0.8 - 0.2 * (Y - HY) / 6.4)];
      }
    }
    return [0, 0];
  };

  // steam: three wisps whose bends and puffs travel up, one turn of 2πp each
  const steam = (X, Y, p) => {
    const base = RIM - 0.5, top = 0.5;
    const h = (base - Y) / (base - top);
    if (h <= 0 || h >= 1) return [0, 0];
    let best = 0, slope = 0;
    for (const [off, ph, ph2, k] of [[-0.38, 0, 1.1, 0.8], [0.02, 2.1, 3.7, 1], [0.4, 4.2, 5.3, 0.8]]) {
      const amp = 0.3 + 2 * h, w = 0.45 + 0.6 * h, a = Y * 0.45 + TAU * p + ph;
      const xc = CX + off * R * (1 - 0.3 * h) + amp * Math.sin(a);
      const puff = 0.5 + 0.5 * Math.sin(Y * 0.7 + 2 * TAU * p + ph2);
      const d = Math.exp(-(((X - xc) / w) ** 2)) * smooth(0, 0.12, h) * (1 - h) ** 0.9 * (0.55 + 0.45 * puff) * 1.9 * k;
      if (d > best) { best = d; slope = amp * 0.45 * Math.cos(a); }
    }
    return [best, slope];
  };

  return (p, W, H) => {
    const sc = Math.min(H / 32, W / 2 / 36); // rows per sketch unit
    const ox = W / 2 - 18 * 2 * sc, oy = H - 32 * sc;
    const toX = (q) => (q - ox) / (2 * sc), toY = (r) => (r - oy) / sc;
    // the label: a dark window on the lit side of the body, if there is room for it
    const lw = 8, lh = LABEL.length + 2;
    const lq = Math.round(ox + (CX - R * 0.32) * 2 * sc - lw / 2), lr = Math.round(oy + (RIM + BASE) / 2 * sc - lh / 2 + 0.5);
    const showLabel = R * 4 * sc >= 26 && (BASE - RIM) * sc >= lh + 4;
    // the row (in cells) where the far half of an ellipse crosses column q, or NaN
    const top = (q, rx, ry, cy) => {
      const u = (toX(q + 0.5) - CX) / rx;
      return Math.abs(u) >= 1 ? NaN : oy + (cy - ry * Math.sqrt(1 - u * u)) * sc;
    };
    // a curve's letter in this cell, picked by where it crosses the cell and how steep it runs
    const arcChar = (q, r, rx, ry, cy, wave) => {
      const y = top(q, rx, ry, cy);
      if (!(y >= r && y < r + 1)) return null;
      const s = top(q + 0.5, rx, ry, cy) - top(q - 0.5, rx, ry, cy), f = y - r;
      if (Math.abs(s) > 0.7) return s < 0 ? "/" : "\\";
      if (wave) return Math.abs(s) > 0.3 ? "." : "~";
      return f < 0.3 ? (s < -0.15 ? "'" : s > 0.15 ? "`" : "-") : f < 0.55 ? "-" : f < 0.8 ? "." : "_";
    };
    const arcs = (q, r) => {
      const outer = arcChar(q, r, R, R * K, RIM);
      if (outer) return outer;
      if (top(q, R, R * K, RIM) >= r) return null; // above the outer lip: steam, or nothing
      const inner = arcChar(q, r, RI, RIY, RIM);
      if (inner) return inner;
      const wy = toY(top(q, RI, RIY, RIM + DEPTH)), dx = toX(q + 0.5) - CX;
      const water = (dx / RI) ** 2 + ((wy - RIM) / RIY) ** 2 < 1 ? arcChar(q, r, RI, RIY, RIM + DEPTH, true) : null;
      if (water) return water;
      const [kind] = at(toX(q + 0.5), toY(r + 0.5));
      if (toY(r + 0.5) >= RIM) return null;
      return kind === 2 || kind === 1 ? (hash(q, r, 3) < 0.25 ? "." : " ") : null; // the far wall, faint
    };
    const g = [];
    for (let r = 0; r < H; r++) {
      let line = "";
      for (let q = 0; q < W; q++) {
        if (showLabel && q >= lq && q < lq + lw && r >= lr && r < lr + lh) {
          const s = LABEL[r - lr - 1], i = q - lq - 1;
          line += s && i >= 0 && i < 6 ? (s.padEnd(6)[i] || " ") : " ";
          continue;
        }
        const v = [];
        for (const [i, j] of [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]]) v.push(at(toX(q + i), toY(r + j)));
        const [tl, tr, bl, br] = v.map((a) => a[0] === 1), n = tl + tr + bl + br, h = hash(q, r, 5);
        const cy = toY(r + 0.5);
        let ch = " ";
        // the far half of the opening is drawn as curves, the hand-made way ("_.-'''-._"):
        // the outer lip, the inner lip under it, and the waterline of the tea
        const lip = cy < RIM + DEPTH && Math.abs(toX(q + 0.5) - CX) < R * 0.86 ? arcs(q, r) : null;
        if (lip !== null) ch = lip;
        else if (n === 4) {
          const lit = (v[0][1] + v[1][1] + v[2][1] + v[3][1]) / 4;
          const tier = TIERS[Math.max(0, Math.min(TIERS.length - 1, Math.floor((lit + (h - 0.5) * 0.1) * TIERS.length)))];
          ch = tier[Math.floor(hash(q, r, 9) * tier.length)];
        } else if (n === 3) ch = !tl ? "d" : !tr ? "b" : !bl ? "?" : "7";
        else if (n === 2) {
          if (tl && tr) ch = cy > BASE ? "`" : h < 0.7 ? "'" : "`";
          else if (bl && br) ch = h < 0.6 ? "," : h < 0.85 ? "." : "_";
          else if (tl && bl) ch = h < 0.6 ? ":" : "!";
          else if (tr && br) ch = h < 0.6 ? "j" : "(";
          else ch = tl ? "\\" : "/";
        } else if (n === 1) ch = tl || tr ? "'" : ".";
        else {
          const X = toX(q + 0.5), Y = toY(r + 0.5), [kind, lit] = at(X, Y);
          if (kind === 3) { // rings on the tea, spreading out twice a loop
            const rr = Math.hypot((X - CX) / RI, (Y - RIM - DEPTH) / RIY);
            ch = rr < 0.85 && Math.sin(rr * 9 - 2 * TAU * p) > 0.8 ? (rr < 0.2 ? "o" : "~") : " ";
          } else if (kind === 2) {
            ch = lit > 0.55 && h < 0.25 ? "." : " ";
          } else {
            const [d, slope] = steam(X, Y, p);
            if (d > 0.7) ch = slope > 0.5 ? "\\" : slope < -0.5 ? "/" : slope > 0 ? ")" : "(";
            else if (d > 0.45) ch = slope > 0.5 ? "\\" : slope < -0.5 ? "/" : ":";
            else if (d > 0.25) ch = h < 0.6 ? "." : "`";
          }
        }
        line += ch;
      }
      g.push(line);
    }
    return g.join("\n");
  };
})();

// Vortex: a whirlpool seen from above, redrawn from a Pinterest picture. Rings of dim dots,
// each carrying bright crescents that slide round, the inner ones faster. The rings sway a
// little as it turns.
A.vortex = (() => {
  const BRIGHT = "#@%#";

  // rings from the centre out: inner and outer radius, crescents (arc centre in turns,
  // half-length in turns), and turns per loop
  const RINGS = [
    { r0: 0.15, r1: 0.32, k: 3, arcs: [[0.10, 0.27]] },
    { r0: 0.42, r1: 0.62, k: 2, arcs: [[0.55, 0.25]] },
    { r0: 0.72, r1: 0.94, k: 2, arcs: [[0.95, 0.21], [0.42, 0.09]] },
    { r0: 1.04, r1: 1.28, k: 1, arcs: [[0.30, 0.23]] },
    { r0: 1.38, r1: 1.64, k: 1, arcs: [[0.75, 0.20], [0.22, 0.09]] },
    { r0: 1.74, r1: 2.10, k: 1, arcs: [[0.45, 0.25]] },
  ];

  return (p, W, H) => {
    const t = p * TAU, R = Math.min(W / 2, H) * 0.98;
    let s = "";
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const X = (x + 0.5 - W / 2) / R, Y = ((y + 0.5 - H / 2) * 2) / R;
        const a = Math.atan2(Y, X);
        // the rings sway: a slow three-lobed wobble that turns with the water
        const r = Math.hypot(X, Y) * (1 + 0.035 * Math.sin(3 * a - 2 * t));
        let c = " ";
        if (r < 0.07) c = "@";
        for (const ring of RINGS) {
          if (r < ring.r0 || r > ring.r1) continue;
          const w = ring.r1 - ring.r0;
          // the swirl: angle drifts with radius, breathing once a loop
          const turn = a / TAU - ring.k * p + 0.12 * r * Math.sin(t);
          let lit = false;
          for (const [mid, half] of ring.arcs) {
            const d = Math.abs((((turn - mid) % 1) + 1.5) % 1 - 0.5);
            if (d >= half) continue;
            const f = Math.sqrt(1 - (d / half) ** 2); // thick in the middle, tapering to points
            if (r > ring.r1 - w * f) { lit = true; break; }
          }
          if (lit) c = BRIGHT[Math.floor(hash(x, y, 1) * BRIGHT.length)];
          else c = (x + 2 * y) % 4 === 0 ? ":" : "."; // the dim water, a faint even weave
          break;
        }
        s += c;
      }
      s += "\n";
    }
    return s.slice(0, -1);
  };
})();

// Yellow blobs: lava-lamp islands on black, redrawn from a Pinterest motion piece. Each blob
// has three tiers: a solid core, a cross-hatched rim and a dotted contour further out. They
// orbit their own spots and breathe, so they melt into each other and part again.
A.blobs = (() => {
  // its own hash, so the blobs keep the layout they were validated with
  const bhash = (a, b, c) => {
    let h = (a * 374761393 + b * 668265263 + c * 1274126177) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };

  return (p, W, H) => {
    const t = p * TAU;
    const S = W / 4.5; // blob spacing: about four and a half across
    const nx = Math.ceil(W / S) + 2, ny = Math.ceil((H * 2) / (S * 0.87)) + 2;
    // one blob per lattice cell, each orbiting its own spot (1 or 2 turns per loop) and breathing
    const blobs = [];
    for (let j = -2; j < ny; j++) for (let i = -2; i < nx; i++) {
      const h = (s) => bhash(i, j, s);
      const n = 1 + Math.floor(h(3) * 2), dir = h(4) < 0.5 ? -1 : 1, ph = h(5) * TAU;
      const orbit = S * (0.3 + 0.35 * h(6));
      const R = S * (0.56 + 0.32 * h(7)) * (1 + 0.14 * Math.sin(t * (3 - n) + h(8) * TAU));
      blobs.push({
        // staggered rows so the blobs never line up into horizontal bands
        x: (i + 0.5 * (j & 1) + 0.1 + 0.8 * h(1)) * S + orbit * Math.cos(dir * n * t + ph),
        y: (j * 0.87 + 0.1 + 0.8 * h(2)) * S + orbit * Math.sin(dir * n * t + ph),
        r2: R * R,
      });
    }
    const lines = [];
    for (let y = 0; y < H; y++) {
      let row = "";
      for (let x = 0; x < W; x++) {
        // y is doubled because cells are twice as tall as wide
        let f = 0;
        for (const b of blobs) {
          const dx = x + 0.5 - b.x, dy = (y + 0.5) * 2 - b.y, q = 1 - (dx * dx + dy * dy) / b.r2;
          if (q > 0) f += q * q * q;
        }
        let c = " ";
        if (f > 0.6) c = "#";
        else if (f > 0.3) c = "+";
        // a dot-matrix halo floating outside the rim, with black between them
        else if (f > 0.006 && f < 0.075 && (x + y) % 2 === 0) c = ".";
        row += c;
      }
      lines.push(row);
    }
    return lines.join("\n");
  };
})();

// Chompers: glowing fanged mouths in the dark, redrawn from a stop-motion GIF on Pinterest.
// Each snaps shut and slowly gapes open again on its own beat. Teeth are triangles laid
// along a curved gum line; the lower row sits half a tooth over so the jaws interlock.
// Each cell is cut into 4x8 sub-samples and drawn with "#" when full, a slash on a
// tooth's sides ("\##/" above, "/##\" below) and "V" / "A" at its tip.
A.chompers = (() => {
  const ss = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
  const frac = (x) => x - Math.floor(x);
  // How open a jaw is over one bite: snaps shut, holds, gapes slowly, holds.
  const gape = (q) => (q < 0.1 ? 1 - ss(q / 0.1) : q < 0.2 ? 0 : q < 0.62 ? ss((q - 0.2) / 0.42) : 1);

  // x, y: centre as a share of the frame; w: tooth width (share of the short side);
  // n: upper teeth; long: tooth length / width; tilt: degrees; curve: grin;
  // k: bites per loop; ph: where in its bite it starts.
  const MOUTHS = [
    { x: 0.27, y: 0.26, w: 0.115, n: 4, long: 1.3, tilt: -7, curve: 0.5, k: 2, ph: 0.0 },
    { x: 0.79, y: 0.27, w: 0.09, n: 3, long: 1.8, tilt: 14, curve: 0.35, k: 2, ph: 0.4 },
    { x: 0.25, y: 0.74, w: 0.1, n: 3, long: 1.4, tilt: 12, curve: 0.4, k: 2, ph: 0.2 },
    { x: 0.74, y: 0.74, w: 0.115, n: 4, long: 1.3, tilt: -10, curve: 0.55, k: 2, ph: 0.6 },
  ];

  return (p, W, H) => {
    const SW = W, SH = H * 2, S = Math.min(SW, SH); // square units: a cell is 1 wide, 2 tall
    const live = MOUTHS.map((m, mi) => {
      const q = frac(m.k * p + m.ph), o = gape(q);
      const w = m.w * S, L = w * m.long;
      const bite = q < 0.2 ? Math.sin((q / 0.2) * Math.PI) : 0; // a jolt as it bites
      const a = ((m.tilt + 4 * Math.sin(TAU * (p + m.ph))) * Math.PI) / 180;
      const D = L * 1.3 + o * (L * 0.55 + w * 0.5); // gum to gum
      const half = (m.n * w) / 2;
      const teeth = [];
      for (let row = 0; row < 2; row++) {
        const n = row ? m.n - 1 : m.n;
        for (let i = 0; i < n; i++) {
          const xc = -((n * w) / 2) + (i + 0.5) * w;
          const len = L * (row ? 0.85 : 1) * (0.78 + 0.4 * hash(mi, i, row + 3));
          const gum = (row ? D / 2 : -D / 2) - m.curve * w * (xc / half) ** 2; // corners up: a grin
          teeth.push({ xc, gum, len, dir: row ? -1 : 1 });
        }
      }
      const step = Math.floor(p * 48) % 48; // stop-motion boil, 12 nudges a second
      return {
        cx: m.x * SW + (hash(mi, step, 1) - 0.5) * 0.5, cy: m.y * SH + w * 0.35 * bite + (hash(mi, step, 2) - 0.5) * 0.6,
        ca: Math.cos(a), sa: Math.sin(a), w, teeth,
        r: half + D / 2 + L + m.curve * w + 2,
      };
    });
    // the tooth under a point: its direction (1 upper, points down; -1 lower),
    // which side of its centre line the point is on (-1 left, 1 right) and
    // how far from the gum towards the tip (0 to 1)
    let dir = 0, side = 0, depth = 0;
    const at = (x, y) => {
      for (const M of live) {
        const dx = x - M.cx, dy = y - M.cy;
        if (Math.abs(dx) > M.r || Math.abs(dy) > M.r) continue;
        const u = dx * M.ca + dy * M.sa, v = -dx * M.sa + dy * M.ca;
        for (const T of M.teeth) {
          const t = ((v - T.gum) * T.dir) / T.len;
          if (t < 0 || t > 1) continue;
          if (Math.abs(u - T.xc) <= M.w * 0.39 * (1 - t)) { dir = T.dir; side = u < T.xc ? -1 : 1; depth = t; return true; }
        }
      }
      return false;
    };
    let s = "";
    for (let r = 0; r < H; r++) {
      for (let c = 0; c < W; c++) {
        let n = 0, d = 0, e = 0, z = 0;
        for (let sy = 0; sy < 8; sy++) for (let sx = 0; sx < 4; sx++)
          if (at(c + (sx + 0.5) / 4, r * 2 + (sy + 0.5) / 4)) { n++; d += dir; e += side; z += depth; }
        const m = n / 32;
        if (m < 0.12) s += " ";
        else if (m > 0.72) s += "#";
        else if (z < n * 0.15) s += m > 0.4 ? "#" : " "; // along the gum: a flat base, no slashes
        else if (Math.abs(e) < n * 0.5) s += d > 0 ? "V" : "A"; // a tip: both sides in one cell
        else s += (d > 0) === (e < 0) ? "\\" : "/";
      }
      s += "\n";
    }
    return s.slice(0, -1);
  };
})();

// Digit globe: a sphere of digits turning on a tilted axis, redrawn from a GIF on Pinterest,
// with a crease that gathers the digits into a bright seam as it rolls round.
// Calm: a slow turn, a lattice spaced so digits never share a cell, each digit fixed
// to its point, and the limb fades digit -> dot -> nothing.
A.globe = (() => {
  const DIG = "0123456789";
  const TILT = 0.42, LEAN = 0.32; // axis tipped towards us, then leaned right
  const ct = Math.cos(TILT), st = Math.sin(TILT), cl = Math.cos(LEAN), sl = Math.sin(LEAN);

  return (p, W, H) => {
    const t = (p - 0.27) * TAU; // the crease faces us a little before the poster frame
    const R = Math.min(W * 0.46, H * 0.92); // radius in columns; rows are half that
    const cx = (W - 1) / 2, cy = (H - 1) / 2;
    const g = grid(W, H);
    const z = new Float32Array(W * H).fill(-9);
    // a point of the sphere (latitude, longitude) -> cell and depth
    const at = (lat, lon) => {
      const cL = Math.cos(lat), x = cL * Math.sin(lon + t), y = -Math.sin(lat), zz = cL * Math.cos(lon + t);
      // tip the axis towards the viewer, then lean it
      let y2 = y * ct - zz * st;
      const z2 = y * st + zz * ct, x2 = x * cl - y2 * sl;
      y2 = x * sl + y2 * cl;
      const X = Math.round(cx + x2 * R), Y = Math.round(cy + y2 * R * 0.5);
      return X < 0 || Y < 0 || X >= W || Y >= H ? null : { X, Y, z: z2 };
    };
    const plot = (q, c, depth) => {
      const k = q.Y * W + q.X;
      if (depth > z[k]) { z[k] = depth; g[q.Y][q.X] = c; }
    };
    // the surface: a lattice of digits, rings two rows apart and points ~4 columns apart,
    // with a clear lane either side of the crease
    const LAT = 4 / R, LON = 4 / R;
    const rings = Math.floor(Math.PI / LAT), lane = 7 / R;
    for (let i = 1; i < rings; i++) {
      const lat = -Math.PI / 2 + i * (Math.PI / rings);
      const n = Math.max(1, Math.round((TAU * Math.cos(lat)) / LON));
      for (let j = 0; j < n; j++) {
        const lon = ((j + hash(i, 7)) / n) * TAU;
        if (Math.abs(Math.sin(lon / 2)) * 2 < lane) continue;
        const q = at(lat, lon);
        if (!q) continue;
        const r = hash(i, j, 9);
        if (r > 0.84) continue; // a fixed sparse subset, never chosen by depth
        // fade at the limb: digit, then a dot, then gone; far side only a faint dust
        const edge = 0.18 + 0.2 * hash(i, j, 5);
        if (q.z > edge) plot(q, DIG[Math.floor(hash(i, j, 3) * 10)], q.z);
        else if (q.z > edge - 0.22 || (q.z < -0.35 && r < 0.12)) plot(q, ".", q.z);
      }
    }
    // the crease: a ridge of packed digits along one meridian, three strands,
    // samples one row apart so each digit keeps its own cell; strands stay a fixed
    // width apart and stop short of the poles, where they would bunch up
    const fine = 2.1 / R; // a cell is 1 x 2 columns: samples 2.1 apart each way never share one
    for (let s = -1; s <= 1; s++) {
      for (let i = 1, m = Math.floor(Math.PI / fine); i < m; i++) {
        const lat = -Math.PI / 2 + i * fine;
        if (Math.abs(lat) > 1.25) continue;
        const q = at(lat, (s * fine) / Math.cos(lat));
        if (!q || q.z < 0.18) continue;
        plot(q, q.z > 0.3 ? DIG[Math.floor(hash(i, s + 5, 11) * 10)] : ".", q.z + 2);
      }
    }
    return out(g);
  };
})();

// Radiation: the trefoil warning sign, redrawn in code (a dark disc with three windows and a
// hollow hub, our own proportions), hazard-yellow ink on black. It turns a third of a turn per
// loop (the sign has 3-fold symmetry, so the loop is seamless) while two light pulses run out
// from the hub through the ink. Cells are sampled 2x4 so edges fade "@#*=:." cleanly.
A.radiation = (() => {
  const RING = 0.84, HUB_OUT = 0.31, HUB_IN = 0.19, WIN = Math.PI / 6; // window half-angle 30°

  // Is the point (in units of the disc radius, angle already turned) ink?
  const ink = (r, a) => {
    if (r > 1) return false;
    if (r >= RING) return true;                      // outer ring
    if (r < HUB_IN) return false;                    // hollow centre
    if (r < HUB_OUT) return true;                    // hub ring
    const d = Math.abs((((a % (TAU / 3)) + TAU / 3) % (TAU / 3)) - TAU / 6);
    return d >= WIN;                                 // the three windows
  };

  return (p, W, H) => {
    const R = Math.min(W / 2, H) * 0.9, cx = W / 2, cy = H / 2;
    const turn = (TAU / 3) * p + Math.PI / 6; // windows start at bottom, upper left, upper right
    let s = "";
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        let cov = 0;
        for (let j = 0; j < 4; j++) for (let i = 0; i < 2; i++) {
          const px = (x + 0.25 + i * 0.5 - cx) / R, py = ((y + 0.125 + j * 0.25 - cy) * 2) / R;
          if (ink(Math.hypot(px, py), Math.atan2(py, px) - turn)) cov++;
        }
        cov /= 8;
        let c = " ";
        if (cov >= 1) {
          // a pulse leaves the hub twice per loop and runs out through the ink as a lighter band
          const r = Math.hypot((x + 0.5 - cx) / R, ((y + 0.5 - cy) * 2) / R);
          const k = ((2 * p - (r - 0.2) / 0.85) % 0.5 + 0.5) % 0.5; // 0 at the front, grows inward
          c = k < 0.035 ? ":" : k < 0.075 ? "=" : k < 0.12 ? "*" : "@";
        } else if (cov > 0) c = RAMP[Math.max(1, Math.min(8, Math.round(cov * 9)))];
        s += c;
      }
      s += "\n";
    }
    return s.slice(0, -1);
  };
})();

// Binary mask: a Guy Fawkes ("Anonymous") mask made of 0s and 1s, white on black, our own drawing
// redrawn from a screenshot. The face is a width profile down its height; the features (arched
// brows, slit eyes, nose, curled moustache, smile, pointed goatee) are strokes cut out of it as dark
// gaps, measured in screen cells so they stay one clean row thick at any size. Columns of falling
// digits write the mask from the top, it holds, then a second rain washes it away. Empty at both
// ends, so the loop is seamless.
A.mask = (() => {
  // half-width of the face down its height v in [0,1] (forehead to chin)
  const PROFILE = [[0, 0.36], [0.02, 0.6], [0.06, 0.82], [0.12, 0.94], [0.22, 1], [0.42, 1],
    [0.55, 0.96], [0.66, 0.86], [0.76, 0.7], [0.85, 0.52], [0.92, 0.36], [0.97, 0.24], [1, 0.16]];
  const halfW = (v) => {
    for (let i = 1; i < PROFILE.length; i++) {
      const [v1, w1] = PROFILE[i];
      if (v <= v1) { const [v0, w0] = PROFILE[i - 1]; return w0 + (w1 - w0) * (v - v0) / (v1 - v0); }
    }
    return 0;
  };

  // strokes on the right half, as polylines in (|u|, v) with a thickness per point
  // (in fractions of the mask height, never under one row); mirrored to the left.
  const STROKES = [
    // brow: rising steeply from the nose to a high peak, then sloping down to the temple
    [[0.1, 0.25, 0], [0.24, 0.17, 0], [0.4, 0.13, 0.012], [0.56, 0.14, 0.012], [0.72, 0.18, 0], [0.84, 0.23, 0]],
    // nose: just the tip, a short hook under the nostril
    [[0.13, 0.46, 0], [0.12, 0.51, 0], [0.0, 0.52, 0]],
    // moustache: thin under the nose, thickening outward, then curling up hard into the cheek
    [[0.0, 0.58, 0], [0.14, 0.595, 0.034], [0.3, 0.6, 0.036], [0.42, 0.575, 0.03], [0.52, 0.515, 0.022],
      [0.565, 0.45, 0.012], [0.54, 0.41, 0], [0.48, 0.42, 0]],
    // smile, well under the moustache, its corners lifting
    [[0.0, 0.715, 0], [0.15, 0.71, 0], [0.27, 0.69, 0], [0.35, 0.655, 0]],
    // goatee: a narrow point from under the lip toward the chin
    [[0.0, 0.775, 0.03], [0.0, 0.84, 0.024], [0.0, 0.9, 0]],
  ];

  // distance from point (x, y) to segment (ax, ay)-(bx, by), and where along it
  const seg = (x, y, ax, ay, bx, by) => {
    const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy;
    const t = l ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / l)) : 0;
    return [Math.hypot(x - ax - t * dx, y - ay - t * dy), t];
  };

  // is the cell at (u, v) inside the face and not on a feature? hw, hr: mask size in cells
  const surface = (u, v, hw, hr) => {
    if (v < 0 || v > 1) return false;
    const a = Math.abs(u);
    if (a > halfW(v)) return false;
    // screen units: one column wide, a row is two columns tall
    const X = a * hw, Y = v * hr * 2, min = 1.05;
    // eyes: pointed slits, the lower lid lifting at the outer corner like a smile
    const s = (a - 0.44) / 0.23;
    if (Math.abs(s) < 1) {
      const mid = 0.315 - 0.02 * s, half = Math.max(0.05 * (1 - s * s) * hr * 2, s * s < 0.8 ? min : 0);
      if (Math.abs(Y - mid * hr * 2) < half) return false;
    }
    for (const st of STROKES) {
      for (let i = 1; i < st.length; i++) {
        const [a0, v0, w0] = st[i - 1], [a1, v1, w1] = st[i];
        const [d, t] = seg(X, Y, a0 * hw, v0 * hr * 2, a1 * hw, v1 * hr * 2);
        if (d < Math.max(min, (w0 + (w1 - w0) * t) * hr)) return false;
      }
    }
    return true;
  };

  // timeline (fractions of the loop)
  const SPREAD = 0.09, FALL = 0.15, IN = 0.01, OUT = 0.67, TRAIL = [null, null, ":", "."];

  return (p, W, H) => {
    const hr = Math.min(H * 0.96, (W * 0.92) / 1.56); // mask height in rows
    const hw = hr * 0.78; // half-width in columns (cells are twice as tall as wide)
    const top = (H - hr) / 2, cx = (W - 1) / 2;
    const rows = H + TRAIL.length;
    // the rain head's row in column x for a rain starting at t0
    const head = (x, t0) => (p - t0 - SPREAD * hash(x, 7)) / FALL * rows;
    const lines = [];
    for (let y = 0; y < H; y++) {
      let line = "";
      for (let x = 0; x < W; x++) {
        const u = (x - cx) / hw, v = (y + 0.5 - top) / hr;
        const f = surface(u, v, hw, hr);
        const bit = (x + y) % 2;
        let ch = f ? (bit ? "1" : "0") : " ";
        const hin = head(x, IN), hout = head(x, OUT);
        if (y > hin) ch = " "; // not written yet
        if (y < hout) ch = " "; // already washed away
        // the falling heads and their trails, drawn over everything, only around the mask
        if (Math.abs(x - cx) > hw + 3) { line += ch; continue; }
        for (const h of [hin, hout]) {
          const k = Math.floor(h) - y;
          if (k >= 0 && k < TRAIL.length && h < H + TRAIL.length) {
            ch = TRAIL[k] || (hash(x, y, Math.floor(h)) < 0.5 ? "0" : "1");
            if (f && h === hin && k > 0) ch = bit ? "1" : "0"; // settled behind the first head
          }
        }
        line += ch;
      }
      lines.push(line);
    }
    return lines.join("\n");
  };
})();

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
