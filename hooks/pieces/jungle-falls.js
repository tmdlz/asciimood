// jungle-falls — from ascii.rest by bas3line, MIT License (see LICENSE)
export const meta = {
    name: "jungle falls",
    category: "scenes",
    note: "a tiered waterfall in a rainforest gorge, spray, a rainbow and macaws",
    cols: 200,
    rows: 100,
    cell: 1,
    fps: 15,
    ground: "#07130d",
    still: 6,
    palette: [
        "#0d2616",
        "#173d1f",
        "#225a26",
        "#2f7a2c",
        "#45983a",
        "#6bb544",
        "#9ccf55",
        "#c9e27a",
        "#2a3436",
        "#465256",
        "#6c7676",
        "#9aa29c",
        "#f7fcfc",
        "#d6eef0",
        "#a8dcdf",
        "#6cc5c6",
        "#35aeb0",
        "#1d8b92",
        "#11636c",
        "#c9e6ef",
        "#93c9e2",
        "#fff1c2",
        "#f2cf6b",
        "#e5483b",
        "#f08c34",
        "#3d84d6",
        "#8b6bd0",
        "#a92d25",
        "#5b8f7a",
        "#8fb8a0",
        "#5e4a36"
    ]
};
const W = 200, H = 100;
const POOL = 80;
const LEDGE = 50;
const BASE_X = 101;
const RAIN = [
    118,
    116,
    56
];
const SUN = [
    30,
    -40
];
const LOOP = 16;
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
const SKY = 0, CANOPY = 1, ROCK = 2, FALL = 3, WATER = 4, LEAF = 5, TRUNK = 6, VINE = 7;
const FALLS = [
    [
        0,
        LEDGE - 1,
        100,
        100.5,
        7,
        9.5
    ],
    [
        LEDGE + 1,
        POOL + 1,
        101,
        101,
        14,
        20
    ],
    [
        31,
        POOL + 1,
        131,
        134,
        1.6,
        3
    ],
    [
        37,
        POOL + 1,
        71,
        69,
        1.2,
        2.4
    ]
];
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
const BOW = [
    [
        0.55,
        0.42,
        0.82
    ],
    [
        0.24,
        0.52,
        0.84
    ],
    [
        0.42,
        0.74,
        0.34
    ],
    [
        0.95,
        0.82,
        0.38
    ],
    [
        0.94,
        0.55,
        0.2
    ],
    [
        0.9,
        0.28,
        0.23
    ]
];
export default function jungleFalls() {
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
    const mat = new Uint8Array(N);
    const shade = new Float32Array(N);
    const depth = new Uint8Array(N);
    const moss = new Float32Array(N);
    const wet = new Float32Array(N);
    const fallU = new Float32Array(N);
    const fallV = new Float32Array(N);
    const spray = new Float32Array(N);
    const ctop = (x)=>17 + 4 * fbm(x * 0.06, 1.3, 3, 0) + 2.5 * Math.exp(-(((x - 100) / 9) ** 2));
    const crown = (x)=>ctop(x) - 2 - 7 * fbm(x * 0.11, 5.1, 3, 0);
    const edge = (y, layer, side)=>{
        const s = layer * 7 + side * 31;
        const base = [
            64,
            52,
            36
        ][layer] - side * 3;
        const wob = [
            7,
            10,
            14
        ][layer];
        return base + wob * (fbm(y * (0.08 + layer * 0.02), s, 3, 0) - 0.5) - [
            16,
            14,
            4
        ][layer] * smooth(70, 98, y);
    };
    const canopy = (d, layer, side)=>[
            26,
            28,
            34
        ][layer] * smooth([
            0,
            4,
            8
        ][layer], [
            22,
            26,
            32
        ][layer], d) - 8 * fbm(d * 0.14, 40 + layer * 3 + side * 9, 3, 0);
    for(let r = 0; r < H; r++){
        const y = r + 0.5;
        for(let x = 0; x < W; x++){
            const k = r * W + x;
            const px = x + 0.5;
            const ct = ctop(px);
            if (y < crown(px)) mat[k] = SKY;
            else if (y < ct) {
                mat[k] = CANOPY;
                const n = fbm(px * 0.3, y * 0.3, 3, 0);
                shade[k] = clamp(0.3 + (n - fbm((px - 1) * 0.3, (y - 1) * 0.3, 3, 0)) * 8 + 0.4 * smooth(ct, ct - 6, y));
            } else if (y < POOL + 0.5) {
                mat[k] = ROCK;
                const n = fbm(px * 0.1, y * 0.07, 4, 0);
                const nl = fbm((px - 1.5) * 0.1, (y - 1) * 0.07, 4, 0);
                const seam = noise(px * 0.45, y * 0.05, 0);
                shade[k] = clamp(0.4 + (n - nl) * 9 + 0.4 * (n - 0.5) - 0.3 * smooth(0.6, 0.85, seam));
                const m = fbm(px * 0.09 + 20, y * 0.16, 3, 0);
                moss[k] = clamp(0.8 * smooth(0.58, 0.7, m) + 0.8 * smooth(ct + 4, ct, y));
                if (Math.abs(px - 101) < 26 - 4 * fbm(px * 0.2, 4, 2, 0) && y >= LEDGE - 1.5 && y < LEDGE + 2.5) {
                    shade[k] = y < LEDGE ? 0.95 : 0.3 - 0.1 * (y - LEDGE);
                    moss[k] = y < LEDGE ? 1 : 0.2;
                }
            } else mat[k] = WATER;
            if (mat[k] === ROCK) {
                let near = 99;
                for (const [lip, foot, c0, c1, w0, w1] of FALLS){
                    const top = lip || ct - 0.5;
                    if (y < top - 1 || y >= foot) continue;
                    const f = (y - top) / (foot - top);
                    const cx = mix(c0, c1, f), hw = mix(w0, w1, f) * (1 + 0.14 * (noise(y * 0.3, c0, 0) - 0.5));
                    const d = Math.abs(px - cx) - hw;
                    if (d < 0 && y >= top) {
                        mat[k] = FALL;
                        fallU[k] = (px - cx) / hw;
                        fallV[k] = y - top;
                    }
                    near = Math.min(near, d);
                }
                wet[k] = smooth(6, 0, near);
            }
            for(let layer = 0; layer < 3; layer++){
                const inL = px < edge(y, layer, 0) && y > canopy(px, layer, 0);
                const inR = W - px < edge(y, layer, 1) && y > canopy(W - px, layer, 1);
                if (!inL && !inR) continue;
                mat[k] = LEAF;
                depth[k] = layer;
                const f = 0.24 - layer * 0.04;
                const n = fbm(px * f + layer * 9, y * f, 4, 0);
                const nl = fbm((px - 1.5) * f + layer * 9, (y - 1.5) * f, 4, 0);
                shade[k] = clamp((n - 0.3) * 1.8) * clamp(0.4 + (n - nl) * 12);
            }
            spray[k] = Math.exp(-(((px - BASE_X) / 36) ** 2)) * smooth(POOL - 38, POOL - 2, y) * smooth(POOL + 8, POOL, y) + 0.7 * Math.exp(-(((px - 100) / 17) ** 2)) * smooth(LEDGE - 14, LEDGE - 1, y) * smooth(LEDGE + 9, LEDGE + 1, y);
        }
    }
    const stamp = (cx, cy, rad, s)=>{
        for(let yy = Math.floor(cy - rad); yy <= cy + rad; yy++){
            for(let xx = Math.floor(cx - rad); xx <= cx + rad; xx++){
                if (xx < 0 || xx >= W || yy < 0 || yy >= H) continue;
                if ((xx + 0.5 - cx) ** 2 + (yy + 0.5 - cy) ** 2 > rad * rad + 0.15) continue;
                const k = yy * W + xx;
                mat[k] = LEAF;
                depth[k] = 2;
                shade[k] = s;
            }
        }
    };
    const frond = (x0, y0, ang, len, droop, seed)=>{
        const dx = Math.cos(ang), dy = Math.sin(ang);
        const steps = Math.ceil(len * 2);
        for(let i = 0; i <= steps; i++){
            const s = i / steps;
            const x = x0 + dx * len * s, y = y0 + dy * len * s + droop * s * s * len;
            const tx = dx, ty = dy + 2 * droop * s;
            const tl = Math.hypot(tx, ty);
            stamp(x, y, 0.7, 0.6);
            if (i % 3) continue;
            const leaf = (1.2 + 4.2 * Math.sin(Math.PI * Math.min(1, s * 1.1))) * (0.8 + 0.4 * hash(i, seed));
            for (const side of [
                -1,
                1
            ]){
                const lx = -ty / tl * side - 0.4 * tx / tl, ly = tx / tl * side - 0.4 * ty / tl + 0.5;
                const ll = Math.hypot(lx, ly);
                const up = ly / ll < 0.2;
                for(let j = 1; j <= leaf; j += 0.8){
                    stamp(x + lx / ll * j, y + ly / ll * j, 0.45, up ? 0.95 - 0.3 * (j / leaf) : 0.5 - 0.2 * (j / leaf));
                }
            }
        }
    };
    const palm = (rx, ry, qx, qy, kx, ky, seed)=>{
        for(let i = 0; i <= 240; i++){
            const s = i / 240;
            const x = (1 - s) * (1 - s) * rx + 2 * (1 - s) * s * qx + s * s * kx;
            const y = (1 - s) * (1 - s) * ry + 2 * (1 - s) * s * qy + s * s * ky;
            const rad = 2.8 - 1.2 * s;
            for(let yy = Math.floor(y - rad); yy <= y + rad; yy++){
                for(let xx = Math.floor(x - rad); xx <= x + rad; xx++){
                    if (xx < 0 || xx >= W || yy < 0 || yy >= H) continue;
                    const ox = xx + 0.5 - x, oy = yy + 0.5 - y;
                    if (ox * ox + oy * oy > rad * rad) continue;
                    const k = yy * W + xx;
                    mat[k] = TRUNK;
                    shade[k] = clamp(0.4 - 0.6 * (ox / rad)) * (yy % 3 === 0 ? 0.65 : 1);
                }
            }
        }
        const n = 8;
        for(let i = 0; i < n; i++){
            const a = -Math.PI * 1.1 + i / (n - 1) * Math.PI * 1.2 + 0.25 * (hash(i, seed) - 0.5);
            const len = 19 + 9 * hash(i, seed + 1);
            frond(kx, ky, a, len, 0.3 + 0.35 * hash(i, seed + 2), seed * 10 + i);
        }
    };
    palm(16, 104, 18, 56, 42, 15, 3);
    palm(188, 104, 190, 54, 160, 12, 7);
    const ferns = [
        [
            4,
            101,
            1
        ],
        [
            26,
            102,
            1
        ],
        [
            46,
            103,
            1
        ],
        [
            196,
            101,
            -1
        ],
        [
            174,
            102,
            -1
        ],
        [
            156,
            103,
            -1
        ]
    ];
    for (const [fx, fy, dir] of ferns){
        for(let i = 0; i < 5; i++){
            const a = -Math.PI / 2 + dir * (0.25 + i * 0.32) + 0.15 * (hash(fx, i) - 0.5);
            frond(fx, fy, a, 13 + 6 * hash(i, fx), 0.55, fx * 3 + i);
        }
    }
    const vines = [];
    for(let i = 0; i < 10; i++){
        const left = i < 5;
        const x = left ? 62 + i * 4.6 + hash(i, 1) * 2 : 118 + (i - 5) * 4.8 + hash(i, 2) * 2;
        if (Math.abs(x - 100) < 12) continue;
        vines.push([
            x,
            Math.floor(ctop(x)) - 1,
            14 + 26 * hash(i, 3),
            hash(i, 4) * 6.28
        ]);
    }
    const haze = new Float32Array(N);
    for(let k = 0; k < N; k++)haze[k] = fbm(k % W * 0.04, Math.floor(k / W) * 0.1, 3, 0);
    const vine = new Uint8Array(N);
    const shafts = new Float32Array(280);
    return (t, { color } = {})=>{
        vine.fill(0);
        for (const [vx, top, len, ph] of vines){
            for(let i = 0; i < len; i++){
                const s = i / len, r = top + i;
                const x = Math.round(vx - 0.5 + 0.9 * s * s * Math.sin(t * 0.9 + ph) + 1.5 * Math.sin(i * 0.15 + ph));
                if (x < 0 || x >= W || r >= H) continue;
                vine[r * W + x] = 1;
                if (hash(i, vx | 0) > 0.5) {
                    const lx = x + (hash(vx | 0, i) > 0.5 ? 1 : -1);
                    if (lx >= 0 && lx < W) vine[r * W + lx] = 2;
                }
            }
        }
        for(let i = 0; i < shafts.length; i++){
            const p = i - 70;
            shafts[i] = smooth(0.55, 0.8, noise(p * 0.16 + t * 0.04, 3.1 + t * 0.08, 0)) * smooth(-20, 50, p);
        }
        for(let r = 0; r < H; r++){
            const y = r + 0.5;
            for(let x = 0; x < W; x++){
                const k = r * W + x;
                const px = x + 0.5;
                let m = mat[k];
                let cr = 0, cg = 0, cb = 0, floor = 0.15;
                let air = 1;
                if (vine[k] && m !== TRUNK && !(m === LEAF && depth[k] === 2)) m = VINE;
                if (m === SKY) {
                    const v = y / 20;
                    const ds = Math.hypot(px - SUN[0], y - SUN[1]);
                    const sun = Math.exp(-ds / 60) * 0.5;
                    const veil = 0.9 + 0.15 * haze[k];
                    cr = (0.5 + 0.35 * v) * veil + sun;
                    cg = (0.74 + 0.18 * v) * veil + sun * 0.95;
                    cb = (0.9 + 0.06 * v) * veil + sun * 0.7;
                    floor = 0.3;
                } else if (m === CANOPY) {
                    const s = shade[k];
                    cr = 0.24 + 0.32 * s, cg = 0.42 + 0.4 * s, cb = 0.28 + 0.22 * s;
                    floor = 0.2;
                } else if (m === ROCK) {
                    const s = shade[k], w = wet[k], mo = moss[k];
                    cr = (0.07 + 0.27 * s) * (1 - 0.4 * w);
                    cg = (0.09 + 0.28 * s) * (1 - 0.35 * w);
                    cb = (0.1 + 0.28 * s) * (1 - 0.3 * w);
                    const g = 0.25 + 0.75 * s;
                    cr = mix(cr, 0.12 * g + 0.02, mo * 0.8);
                    cg = mix(cg, 0.48 * g + 0.05, mo * 0.8);
                    cb = mix(cb, 0.1 * g + 0.02, mo * 0.8);
                    if (w > 0.3 && hash(x + (t * 6 | 0) * 13, r) > 0.95) cr += 0.5 * w, cg += 0.55 * w, cb += 0.55 * w;
                    floor = 0.05;
                } else if (m === FALL) {
                    const u = fallU[k], v = fallV[k];
                    const speed = 8 + 1.4 * v;
                    const s1 = noise(px * 0.65, (y - t * speed) * 0.09, 0);
                    const s2 = noise(px * 1.4 + 31, (y - t * speed * 1.3) * 0.2, 0);
                    const s = 0.6 * s1 + 0.4 * s2;
                    const lip = smooth(4, 0, v);
                    const edgeK = smooth(1, 0.55, Math.abs(u));
                    const white = clamp(smooth(0.28, 0.68, s) * (0.6 + 0.4 * edgeK) + 0.3 * edgeK);
                    cr = mix(0.3, 0.98, white), cg = mix(0.56, 1, white), cb = mix(0.6, 1, white);
                    cr = mix(cr, 0.25 + 0.5 * s, lip), cg = mix(cg, 0.72 + 0.25 * s, lip), cb = mix(cb, 0.72 + 0.25 * s, lip);
                    const thin = (1 - edgeK) * (1 - smooth(0.35, 0.62, s));
                    cr = mix(cr, 0.08, thin), cg = mix(cg, 0.11, thin), cb = mix(cb, 0.12, thin);
                    floor = 0.2;
                    air = 0.5;
                } else if (m === WATER) {
                    const v = (y - POOL) / (H - POOL);
                    const dx = (px - BASE_X) / 1.6, dy = (y - POOL) * 3.2;
                    const d = Math.sqrt(dx * dx + dy * dy);
                    const near = Math.exp(-d / 30);
                    cr = 0.05 + 0.2 * near - 0.03 * v;
                    cg = 0.45 + 0.3 * near - 0.15 * v;
                    cb = 0.48 + 0.28 * near - 0.14 * v;
                    const rip = Math.sin(d * 0.42 - t * 4.5) * 0.5 + 0.5;
                    const brk = noise(px * 0.12, y * 0.6 - t * 0.5, 0);
                    const crest = smooth(0.7, 0.95, rip) * smooth(0.35, 0.7, brk) * (0.5 + 0.5 * near);
                    cr += 0.55 * crest, cg += 0.5 * crest, cb += 0.45 * crest;
                    const wob = smooth(0.4, 0.9, noise(px * 0.5, y * 0.8 - t * 2, 0));
                    let boil = 0;
                    for (const [, , , c1, , w1] of FALLS){
                        const refl = Math.exp(-(((px - c1) / (w1 * 0.9)) ** 2)) * wob * smooth(H, POOL + 4, y);
                        cr += 0.25 * refl, cg += 0.28 * refl, cb += 0.28 * refl;
                        if (w1 < 5) boil += Math.exp(-(((px - c1) / 5) ** 2)) * smooth(POOL + 6, POOL, y);
                    }
                    const zone = Math.exp(-(((px - BASE_X) / 25) ** 2)) * smooth(POOL + 15, POOL, y);
                    const ch = fbm(px * 0.16 + Math.sin(t * 1.3) * 0.6, y * 0.4 - t * 1.2, 2, 0);
                    const foam = clamp(smooth(0.4, 0.6, ch) * zone * 1.7 + smooth(0.78, 0.92, brk) * near * 0.7 + boil * ch);
                    cr = mix(cr, 0.96, foam), cg = mix(cg, 0.99, foam), cb = mix(cb, 1, foam);
                    floor = 0.15;
                } else if (m === LEAF) {
                    const lay = depth[k];
                    const flick = lay === 2 ? 0.1 * Math.sin(t * 1.7 + hash(x >> 2, r >> 2) * 6.28) : 0;
                    const b = clamp(shade[k] * (lay === 2 ? 1.1 : 1) + (lay === 2 ? 0.06 : 0) + flick);
                    if (lay === 0) {
                        cr = 0.12 + 0.3 * b, cg = 0.28 + 0.42 * b, cb = 0.2 + 0.24 * b;
                        air = 0.9;
                        floor = 0.12;
                    } else if (lay === 1) {
                        cr = 0.03 + 0.3 * b * b, cg = 0.1 + 0.55 * b, cb = 0.03 + 0.1 * b;
                        air = 0.55;
                        floor = 0.04;
                    } else {
                        cr = 0.01 + 0.55 * b * b * b, cg = 0.03 + 0.78 * b * b, cb = 0.01 + 0.14 * b * b;
                        air = 0.15;
                        floor = 0;
                    }
                } else if (m === TRUNK) {
                    const s = shade[k];
                    cr = 0.1 + 0.55 * s * s, cg = 0.085 + 0.47 * s * s, cb = 0.06 + 0.34 * s * s;
                    air = 0.15;
                    floor = 0.1;
                } else {
                    if (vine[k] === 2) cr = 0.4, cg = 0.78, cb = 0.2;
                    else cr = 0.12, cg = 0.3, cb = 0.1;
                    air = 0.4;
                    floor = 0;
                }
                const e = spray[k] * air;
                if (e > 0.02) {
                    const dn = fbm(px * 0.05 - t * 0.25, y * 0.08 + t * 0.55, 2, 0);
                    const mist = clamp(e * (smooth(0.3, 0.7, dn) * 1.1 + 0.15));
                    cr = mix(cr, 0.9, mist * 0.85), cg = mix(cg, 0.96, mist * 0.85), cb = mix(cb, 0.97, mist * 0.85);
                    const dr = Math.hypot(px - RAIN[0], y - RAIN[1]) - RAIN[2];
                    if (dr > -6 && dr < 6) {
                        const q = (dr + 6) / 12 * (BOW.length - 1);
                        const i = Math.min(BOW.length - 2, Math.floor(q)), f = q - i;
                        const a = Math.min(0.85, Math.sin((dr + 6) / 12 * Math.PI) * (0.35 + mist * 1.6 + e * 0.6));
                        cr = mix(cr, mix(BOW[i][0], BOW[i + 1][0], f), a);
                        cg = mix(cg, mix(BOW[i][1], BOW[i + 1][1], f), a);
                        cb = mix(cb, mix(BOW[i][2], BOW[i + 1][2], f), a);
                    }
                }
                const sh = shafts[Math.max(0, Math.min(279, px - 0.62 * y + 70 | 0))] * smooth(H, 10, y) * air * 0.75;
                cr = mix(cr, 1, sh * 0.9), cg = mix(cg, 0.94, sh * 0.85), cb = mix(cb, 0.7, sh * 0.7);
                const peak = Math.max(cr, cg, cb, 1e-4);
                const level = clamp(floor + (1 - floor) * Math.pow(peak, 0.85) * 0.95);
                const step = Math.max(0, Math.min(3, Math.round(level * 3 + BAYER[(r & 3) * 4 + (x & 3)])));
                out[k] = DOTS[step];
                if (color) {
                    const want = step ? Math.min(1, (level + 0.06) / COVER[step]) : 0;
                    const s = Math.min(2.2, (0.3 + 0.7 * want) / peak);
                    color[k] = nearest(clamp(cr * s), clamp(cg * s), clamp(cb * s));
                }
            }
        }
        const ph = t % LOOP / LOOP;
        for(let b = 0; b < 2; b++){
            const bx = -30 + ph * 270 - b * 24;
            const by = 29 + b * 6 + 2.5 * Math.sin(ph * Math.PI * 4 + b);
            const flap = Math.sin(t * 7 + b * 2.1);
            for(let r = Math.floor(by - 10); r <= by + 10; r++){
                for(let x = Math.floor(bx - 18); x <= bx + 8; x++){
                    if (x < 0 || x >= W || r < 0 || r >= H) continue;
                    const lx = x + 0.5 - bx, ly = r + 0.5 - by;
                    let c = -1;
                    const tl = -lx - 4;
                    if (tl > 0 && tl < 13 && Math.abs(ly - tl * 0.1) < 1.3 * (1 - tl / 14)) c = tl > 8 ? 25 : 23;
                    if ((lx / 4.6) ** 2 + (ly / 1.7) ** 2 < 1) c = 23;
                    if ((lx - 4.4) ** 2 + (ly + 0.6) ** 2 < 2.6) c = lx > 4.6 && ly < -0.6 ? 12 : 23;
                    if (lx > 5.6 && lx < 7.2 && ly > -1 && ly < 1) c = 13;
                    const tip = -flap * 8;
                    const reach = 1 - Math.abs(lx + 0.5) / 3.8;
                    if (reach > 0 && Math.abs(tip) > 0.8) {
                        const f = ly / (tip * reach);
                        if (f > 0.15 && f < 1) c = f < 0.4 ? 27 : f < 0.58 ? 22 : 25;
                    }
                    if (c < 0) continue;
                    out[r * W + x] = "●";
                    if (color) color[r * W + x] = c;
                }
            }
        }
        const lines = [];
        for(let r = 0; r < H; r++)lines.push(out.slice(r * W, (r + 1) * W).join(""));
        return lines.join("\n");
    };
}
