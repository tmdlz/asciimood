// cloud-sea — from ascii.rest by bas3line, MIT License (see LICENSE)
export const meta = {
    name: "cloud sea",
    category: "scenes",
    note: "the sun sinks into a drifting sea of orange cloud at dusk",
    cols: 200,
    rows: 100,
    cell: 1,
    fps: 15,
    ground: "#0e0e0f",
    palette: [
        "#0e0e0f",
        "#161617",
        "#1f1f20",
        "#2a2a2b",
        "#353536",
        "#404041",
        "#545456",
        "#6c6c6e",
        "#8a8a8c",
        "#a39a94",
        "#2c211c",
        "#43302a",
        "#5e3c2a",
        "#7c4826",
        "#9c521f",
        "#c2601c",
        "#dc6f1e",
        "#f38020",
        "#f6922e",
        "#faae40",
        "#fbbd5c",
        "#fccb7c",
        "#fdda9e",
        "#feeac4",
        "#fff6e6"
    ]
};
const W = 200, H = 100;
const HZ = 40;
const SUN = [
    150,
    HZ + 1.5
];
const SR = 10;
const DOTS = " ·•●";
const COVER = [
    0,
    0.3,
    0.6,
    1
];
const BAYER = [
    0,
    8,
    2,
    10,
    12,
    4,
    14,
    6,
    3,
    11,
    1,
    9,
    15,
    7,
    13,
    5
].map((v)=>v / 16 - 0.47);
const SKY = 0, SEA = 1;
function hash(x, y) {
    let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
    h = Math.imul(h ^ h >>> 13, 1274126177);
    return ((h ^ h >>> 16) >>> 0) / 4294967296;
}
function noise(x, y, period) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const fx = x - xi, fy = y - yi;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    let x0 = xi, x1 = xi + 1;
    if (period) {
        x0 = (xi % period + period) % period;
        x1 = (x0 + 1) % period;
    }
    const a = hash(x0, yi), b = hash(x1, yi), c = hash(x0, yi + 1), d = hash(x1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, octaves, period) {
    let s = 0, n = 0, amp = 0.5, f = 1;
    for(let i = 0; i < octaves; i++){
        s += amp * noise(x * f, y * f, period * f);
        n += amp;
        amp *= 0.5;
        f *= 2;
    }
    return s / n;
}
const clamp = (v)=>v < 0 ? 0 : v > 1 ? 1 : v;
const smooth = (a, b, v)=>{
    const k = clamp((v - a) / (b - a));
    return k * k * (3 - 2 * k);
};
const mix = (a, b, k)=>a + (b - a) * k;
const hex = (s)=>[
        1,
        3,
        5
    ].map((i)=>parseInt(s.slice(i, i + 2), 16) / 255);
function ramp(stops, v, out) {
    let i = 1;
    while(i < stops.length - 1 && v > stops[i][0])i++;
    const a = stops[i - 1], b = stops[i];
    const k = clamp((v - a[0]) / (b[0] - a[0]));
    out[0] = mix(a[1], b[1], k), out[1] = mix(a[2], b[2], k), out[2] = mix(a[3], b[3], k);
}
const SKY_STOPS = [
    [
        0,
        0.035,
        0.035,
        0.04
    ],
    [
        0.4,
        0.075,
        0.075,
        0.08
    ],
    [
        0.72,
        0.16,
        0.155,
        0.16
    ],
    [
        0.9,
        0.2,
        0.185,
        0.18
    ],
    [
        1,
        0.25,
        0.2,
        0.18
    ]
];
const SEA_STOPS = [
    [
        0,
        0.06,
        0.06,
        0.065
    ],
    [
        0.2,
        0.13,
        0.125,
        0.13
    ],
    [
        0.38,
        0.3,
        0.2,
        0.15
    ],
    [
        0.55,
        0.62,
        0.3,
        0.1
    ],
    [
        0.7,
        0.953,
        0.502,
        0.125
    ],
    [
        0.84,
        0.98,
        0.682,
        0.251
    ],
    [
        0.94,
        1.0,
        0.84,
        0.55
    ],
    [
        1,
        1.0,
        0.94,
        0.8
    ]
];
const DY = [];
for(let d = 0.7; d < 120; d *= 1.1)DY.push(d);
const NL = DY.length;
const WB = 1.7;
const PU = 50, RES = 16, US = PU * RES;
export default function cloudSea() {
    const P = meta.palette.map(hex);
    const N = W * H;
    const out = new Array(N);
    const lut = new Uint8Array(32768).fill(255);
    const nearest = (r, g, b)=>{
        const k = Math.min(31, r * 31.99 | 0) << 10 | Math.min(31, g * 31.99 | 0) << 5 | Math.min(31, b * 31.99 | 0);
        if (lut[k] !== 255) return lut[k];
        let best = 0, bd = 1e9;
        for(let i = 0; i < P.length; i++){
            const dr = P[i][0] - r, dg = P[i][1] - g, db = P[i][2] - b;
            const d = 0.3 * dr * dr + 0.5 * dg * dg + 0.2 * db * db;
            if (d < bd) bd = d, best = i;
        }
        return lut[k] = best;
    };
    const halftone = (k, r, x, cr, cg, cb, floor, fade, color)=>{
        const peak = Math.max(cr, cg, cb, 1e-4);
        const level = clamp(floor + (1 - floor) * Math.pow(peak, 0.85) * 0.95) * fade;
        const step = Math.max(0, Math.min(3, Math.round(level * 3 + BAYER[(r & 3) * 4 + (x & 3)])));
        out[k] = DOTS[step];
        if (color) {
            const want = step ? Math.min(1, (level + 0.06) / COVER[step]) : 0;
            const s = (0.3 + 0.7 * want) * (0.4 + 0.6 * smooth(0.14, 0.5, level)) / peak;
            color[k] = nearest(clamp(cr * s), clamp(cg * s), clamp(cb * s));
        }
    };
    const g = [
        0,
        0,
        0
    ];
    const SEAT = new Float32Array(256 * 3);
    for(let i = 0; i < 256; i++){
        ramp(SEA_STOPS, i / 255, g);
        SEAT[i * 3] = g[0], SEAT[i * 3 + 1] = g[1], SEAT[i * 3 + 2] = g[2];
    }
    const sky = new Float32Array(N * 3);
    for(let r = 0; r < H; r++){
        for(let x = 0; x < W; x++){
            const y = r + 0.5;
            const dx = x + 0.5 - SUN[0];
            const v = Math.min(1, y / HZ);
            const near = Math.exp(-Math.abs(dx) / 60);
            ramp(SKY_STOPS, Math.pow(v, 1.15 - 0.2 * near), g);
            const haze = 0.9 + 0.2 * fbm(x * 0.025, y * 0.14, 3, 0);
            const hot = Math.pow(smooth(0.6, 1, v), 1.6) * (0.08 + 0.92 * near);
            const k = (r * W + x) * 3;
            sky[k] = (g[0] + 0.75 * hot) * haze;
            sky[k + 1] = (g[1] + 0.33 * hot) * haze;
            sky[k + 2] = (g[2] * (1 - 0.3 * hot) + 0.03 * hot) * haze;
            const ci = smooth(0.6, 0.78, fbm(x * 0.011 + y * 0.02, y * 0.42, 4, 0)) * smooth(4, 14, y) * smooth(34, 20, y);
            const lit = ci * 0.5 * near;
            sky[k] = mix(sky[k], 0.95, lit), sky[k + 1] = mix(sky[k + 1], 0.5, lit), sky[k + 2] = mix(sky[k + 2], 0.18, lit);
        }
    }
    const HT = new Float32Array(NL * US), SL = new Float32Array(NL * US);
    const prof = (j, u)=>{
        const n = fbm(u * 0.9, j * 4.7, 4, PU * 0.9);
        return 0.05 + 0.36 * Math.pow(smooth(0.28, 0.74, n), 0.85);
    };
    for(let j = 0; j < NL; j++){
        for(let i = 0; i < US; i++){
            const u = i / RES;
            HT[j * US + i] = prof(j, u);
            SL[j * US + i] = (prof(j, u + 0.05) - prof(j, u - 0.05)) * 10;
        }
    }
    const mat = new Uint8Array(N);
    const lay = new Uint8Array(N);
    const sv = new Float32Array(N), sl = new Float32Array(N), uu = new Float32Array(N), dtop = new Float32Array(N);
    const FR = new Float32Array(N), FG = new Float32Array(N), FB = new Float32Array(N);
    return (t, { color } = {})=>{
        const drift = t * 0.12;
        const pulse = Math.sin(t / 4 * Math.PI * 2);
        mat.fill(SKY);
        for(let x = 0; x < W; x++){
            const xc = x + 0.5;
            let ub = H;
            for(let j = NL - 1; j >= 0 && ub > 0; j--){
                const dy = DY[j];
                const base = HZ + dy;
                const u = (xc - 100) / dy * WB + drift + j * 13.7;
                let su = u * RES;
                su = (su % US + US) % US;
                const i0 = su | 0, f = su - i0, i1 = (i0 + 1) % US;
                const o = j * US;
                const ht = HT[o + i0] + (HT[o + i1] - HT[o + i0]) * f;
                const h = ht * dy;
                const top = base - h;
                const r0 = Math.max(0, Math.ceil(top - 0.5));
                if (r0 >= ub) continue;
                const slope = SL[o + i0] + (SL[o + i1] - SL[o + i0]) * f;
                for(let r = r0; r < ub; r++){
                    const k = r * W + x;
                    mat[k] = SEA, lay[k] = j, sv[k] = (base - r - 0.5) / h, sl[k] = slope, uu[k] = u, dtop[k] = r + 0.5 - top;
                }
                ub = r0;
            }
        }
        const sr = SR + 0.35 * pulse;
        const glowK = 1 + 0.12 * pulse;
        for(let r = 0; r < H; r++){
            const y = r + 0.5;
            for(let x = 0; x < W; x++){
                const k = r * W + x;
                const m = mat[k];
                const dx = x + 0.5 - SUN[0], dsy = y - SUN[1];
                const ds = Math.sqrt(dx * dx + dsy * dsy * 2.2);
                const near = Math.exp(-Math.abs(dx) / 55);
                let cr = 0, cg = 0, cb = 0;
                if (m === SKY) {
                    const s = k * 3;
                    cr = sky[s], cg = sky[s + 1], cb = sky[s + 2];
                    const glow = (Math.exp(-ds / 30) * 0.3 + Math.exp(-ds / 11) * 0.35) * glowK;
                    cr += glow, cg += glow * 0.55, cb += glow * 0.18;
                    const dd = Math.sqrt(dx * dx + dsy * dsy);
                    if (dd < sr + 0.6) {
                        const e = dd / sr, a = smooth(sr + 0.45, sr - 0.45, dd);
                        cr = mix(cr, 1.0, a), cg = mix(cg, 0.94 - 0.3 * e * e * e, a), cb = mix(cb, 0.78 - 0.5 * e * e, a);
                    }
                    if (r < 16 && hash(x, r * 5 + 3) > 0.992) {
                        const tw = 0.55 + 0.45 * Math.sin(t * (0.8 + hash(r, x) * 1.6) + hash(x, r) * 6.28);
                        const st = tw * smooth(16, 2, r) * 0.7;
                        cr = Math.max(cr, st * 0.95), cg = Math.max(cg, st * 0.92), cb = Math.max(cb, st * 0.86);
                    }
                } else {
                    const j = lay[k], dy = DY[j];
                    const s = sv[k], u = uu[k];
                    const dt = dtop[k];
                    const rim = Math.exp(-dt / (0.7 + 0.06 * dy));
                    const face = clamp(s);
                    const side = clamp(0.5 - sl[k] * (dx < 0 ? -1 : 1) * 0.9);
                    const close = smooth(3, 14, dy);
                    const tex = (noise(u * 3.2, s * 2.5 + j * 5.3, 0) - 0.5) * 0.18 * close;
                    const sh = noise(u * 2.2 - t * 0.35, j * 1.7 + t * 0.25, 0);
                    const shimmer = smooth(0.55, 0.85, sh) * rim * (0.1 + 0.45 * near);
                    const az = 0.25 + 0.9 * near;
                    let b = (0.07 + 0.17 * face + 0.22 * (side - 0.5) * face + tex) * az + rim * (0.22 + 0.55 * near) + shimmer;
                    b -= 0.2 * smooth(0, -0.6, s);
                    b = clamp(b * (0.9 + 0.12 * smooth(30, 4, dy)));
                    const ci = (b * 255 | 0) * 3;
                    cr = SEAT[ci], cg = SEAT[ci + 1], cb = SEAT[ci + 2];
                    const cool = (1 - near) * (1 - rim) * 0.7;
                    cr = mix(cr, 0.07 * az, cool), cg = mix(cg, 0.068 * az, cool), cb = mix(cb, 0.072 * az, cool);
                    const haze = Math.exp(-dy / 5) * 0.85;
                    const hg = (Math.exp(-ds / 26) * 0.5 + 0.5 * near) * glowK;
                    cr = mix(cr, 0.17 + 0.83 * hg, haze);
                    cg = mix(cg, 0.16 + 0.48 * hg, haze);
                    cb = mix(cb, 0.17, haze);
                    const bloom = Math.exp(-ds / 13) * 0.5 * glowK * (0.4 + rim);
                    cr += bloom, cg += bloom * 0.62, cb += bloom * 0.25;
                }
                FR[k] = cr, FG[k] = cg, FB[k] = cb;
            }
        }
        for(let i = 0; i < 3; i++){
            const bx = Math.floor((t * (4.5 + i * 0.4) + i * 11 + 30) % (W + 40) - 20);
            const by = Math.round(16 + i * 2.6 + 0.8 * Math.sin(t * 0.9 + i * 2));
            const up = Math.sin(t * 7 + i * 1.9) > 0;
            const cells = up ? [
                [
                    0,
                    0
                ],
                [
                    -1,
                    -1
                ],
                [
                    1,
                    -1
                ],
                [
                    -2,
                    -1
                ],
                [
                    2,
                    -1
                ]
            ] : [
                [
                    0,
                    0
                ],
                [
                    -1,
                    0
                ],
                [
                    1,
                    0
                ],
                [
                    -2,
                    1
                ],
                [
                    2,
                    1
                ]
            ];
            for (const [ox, oy] of cells){
                const x = bx + ox, r = by + oy;
                if (x < 0 || x >= W || r < 0 || r >= H) continue;
                const k = r * W + x;
                if (mat[k] !== SKY) continue;
                FR[k] = 0.3, FG[k] = 0.18, FB[k] = 0.12;
            }
        }
        for(let r = 0; r < H; r++){
            const fade = smooth(H + 4, H - 6, r + 0.5);
            for(let x = 0; x < W; x++){
                const k = r * W + x;
                const m = mat[k];
                halftone(k, r, x, FR[k], FG[k], FB[k], m === SKY ? 0.04 : 0.06, m === SEA ? fade : 1, color);
            }
        }
        const lines = [];
        for(let r = 0; r < H; r++)lines.push(out.slice(r * W, (r + 1) * W).join(""));
        return lines.join("\n");
    };
}
