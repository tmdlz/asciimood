// @ts-nocheck -- ported as-is from the website, where it is plain JavaScript.
// Asciimood's own animations: each is a pure function of the phase p in [0,1)
// and the size W x H, returning H lines of W characters. Every time term uses
// whole turns of TAU * p, so frame(0) and frame(1) are the same picture.
export type Anim = (p: number, W: number, H: number) => string

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
