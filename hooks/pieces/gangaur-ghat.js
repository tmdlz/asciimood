// gangaur-ghat — from ascii.rest by bas3line, MIT License (see LICENSE)
export const meta = {
    name: "gangaur ghat",
    category: "scenes",
    note: "udaipur at night, a lit gateway on lake pichola and diyas on the water",
    cols: 200,
    rows: 100,
    cell: 1,
    fps: 15,
    ground: "#070a18",
    palette: [
        "#0a1230",
        "#0f1a40",
        "#152352",
        "#1c2e66",
        "#253a7a",
        "#30498e",
        "#3e5aa2",
        "#0c0f1e",
        "#161a30",
        "#232842",
        "#4a5a86",
        "#6474a0",
        "#8291b8",
        "#a3afcf",
        "#c6cee3",
        "#e6ebf5",
        "#fff6dc",
        "#ffe6a8",
        "#ffd277",
        "#ffb84a",
        "#f29a34",
        "#d8782a",
        "#a85a26",
        "#7a4224",
        "#e8c48c",
        "#c89a62",
        "#9a7048",
        "#6a4c38",
        "#3e2c2a",
        "#dfe6ff"
    ]
};
const W = 200, H = 100;
const HZ = 64;
const FAR = 58;
const SHORE = 142;
const MOON = [
    170,
    13
];
const GX = 75;
const DOTS = " ·•●";
const COVER = [
    0,
    0.3,
    0.6,
    1
];
const LIFT = [
    0,
    2.5,
    1.7,
    1.35
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
const FLAME = [
    1,
    0.62,
    0.22
];
const BULB = [
    1,
    0.8,
    0.45
];
const SKY = 0, WATER = 1, TOWN = 2, BLD = 3, GATE = 4, ARCH = 5, STEP = 6, PALACE = 7, HILL = 8, MOONM = 9;
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
const wlF = (x)=>x < SHORE ? HZ : FAR;
const ridgeF = (x)=>23 + 30 * ((x - 50) / 92) ** 2 + 3 * (fbm(x * 0.08, 1.3, 3, 0) - 0.5);
const hillsF = (x)=>50 - 7 * fbm(x * 0.022, 4.1, 3, 0) - 3 * smooth(120, 175, x);
function skyAt(x, y) {
    const v = clamp(y / FAR);
    const dmx = x - MOON[0], dmy = y - MOON[1];
    const halo = Math.exp(-Math.sqrt(dmx * dmx + dmy * dmy) / 14) * 0.16;
    const city = Math.exp(-Math.max(0, FAR - y) / 7) * (0.05 + 0.05 * smooth(130, 175, x));
    return [
        0.03 + 0.08 * v * v + 0.7 * halo + city * 0.9,
        0.045 + 0.12 * v * v + 0.8 * halo + city * 0.6,
        0.15 + 0.24 * Math.pow(v, 1.5) + halo + city * 0.35
    ];
}
export default function gangaurGhat() {
    const P = meta.palette.map(hex);
    const STAR = P.length - 1;
    const N = W * H;
    const out = new Array(N);
    const lut = new Uint8Array(32768).fill(255);
    const nearest = (r, g, b)=>{
        const k = Math.min(31, r * 31.99 | 0) << 10 | Math.min(31, g * 31.99 | 0) << 5 | Math.min(31, b * 31.99 | 0);
        if (lut[k] !== 255) return lut[k];
        let best = 0, bd = 1e9;
        for(let i = 0; i < STAR; i++){
            const dr = P[i][0] - r, dg = P[i][1] - g, db = P[i][2] - b;
            const d = 0.3 * dr * dr + 0.5 * dg * dg + 0.2 * db * db;
            if (d < bd) bd = d, best = i;
        }
        return lut[k] = best;
    };
    const mat = new Uint8Array(N);
    const sR = new Float32Array(N), sG = new Float32Array(N), sB = new Float32Array(N);
    const flo = new Float32Array(N);
    const set = (k, m, r, g, b, f)=>{
        mat[k] = m, sR[k] = r, sG[k] = g, sB[k] = b, flo[k] = f;
    };
    const bulbs = [];
    for(let r = 0; r < H; r++){
        for(let x = 0; x < W; x++){
            const k = r * W + x;
            const xc = x + 0.5, y = r + 0.5;
            if (y >= wlF(xc)) {
                set(k, WATER, 0, 0, 0, 0.12);
                continue;
            }
            const [cr, cg, cb] = skyAt(xc, y);
            const veil = 0.92 + 0.16 * fbm(x * 0.04, r * 0.09, 3, 0);
            set(k, SKY, cr * veil, cg * veil, cb * veil, 0.18);
            const dm = Math.hypot(xc - MOON[0], y - MOON[1]);
            if (dm < 3.7 && Math.hypot(xc - MOON[0] + 1.7, y - MOON[1] + 0.9) > 3.4) set(k, MOONM, 1, 0.97, 0.86, 0.2);
            if (y >= hillsF(xc) && xc > 96) {
                const s = 0.85 + 0.3 * fbm(x * 0.15, r * 0.2, 2, 0);
                set(k, HILL, 0.045 * s, 0.06 * s, 0.14 * s, 0.1);
            }
            if (xc < SHORE && y >= ridgeF(xc)) {
                set(k, TOWN, 0.06, 0.07, 0.16, 0.1);
                if (hash(x * 5 + 1, r * 9) < 0.035 && y > ridgeF(xc) + 2) set(k, TOWN, 0.75, 0.48, 0.2, 0.1);
            }
        }
    }
    const blds = [];
    const keepOut = (yb)=>{
        if (yb <= 41) return [
            999,
            -999
        ];
        return [
            50 - (yb - 41) * 0.55,
            100 + (yb - 41) * 0.55
        ];
    };
    for(let yb = 27, row = 0; yb <= HZ; yb += 2.7, row++){
        const base = yb > HZ - 2.7 ? HZ : yb;
        const front = base === HZ;
        const sc = 0.7 + 0.55 * (base - 27) / (HZ - 27);
        for(let x = -3 + hash(row, 1) * 6; x < SHORE;){
            const w = (5 + 9 * hash(x | 0, row * 3 + 2)) * sc;
            const h = (front ? 9 + 8 * hash(x | 0, row + 50) : 4.5 + 6 * hash(x | 0, row * 3 + 4)) * sc;
            const x1 = Math.min(SHORE + (front ? 1 : 0), x + w);
            const [ko0, ko1] = keepOut(base);
            const mid = (x + x1) / 2;
            if (base > ridgeF(mid) + h * 0.6 && !(x1 > ko0 && x < ko1)) blds.push([
                x,
                x1,
                base - h,
                base,
                hash(x | 0, row * 7 + 9)
            ]);
            x += w + (front ? 0 : hash(x | 0, row + 20) * 2.5);
        }
    }
    const pane = (k, seed, near)=>{
        if (hash(seed * 997 | 0, k) < 0.36) {
            const cream = hash(k, 3) < 0.4;
            set(k, BLD, cream ? 1 : 0.95, cream ? 0.86 : 0.66, cream ? 0.6 : 0.3, 0.14);
        } else set(k, BLD, 0.07 + 0.03 * near, 0.08 + 0.03 * near, 0.19, 0.12);
    };
    blds.sort((a, b)=>a[3] - b[3]);
    blds.forEach(([x0, x1, top, base, sd], bi)=>{
        const sc = 0.7 + 0.55 * (base - 27) / (HZ - 27);
        const depth = 1 - (base - 27) / (HZ - 27);
        const style = sd < 0.3 ? 1 : sd < 0.55 ? 0 : sd < 0.75 ? 3 : 2;
        const mid = (x0 + x1) / 2;
        const tw = (x1 - x0) * 0.55;
        const cw = Math.max(1.6, 1.8 * sc);
        for(let r = Math.floor(top - 5 * sc); r < base; r++){
            if (r < 0) continue;
            for(let x = Math.floor(x0); x < x1; x++){
                if (x < 0 || x >= W) continue;
                const k = r * W + x;
                const xc = x + 0.5, y = r + 0.5;
                let inside = y >= top;
                let part = 0;
                if (!inside) {
                    if (style === 0 && y >= top - 1 && (x & 1) === 0) inside = true, part = 1;
                    if (style === 1) {
                        const dx = Math.abs(xc - mid) / cw;
                        const dy = top - 1.5 * sc - y;
                        if (dx < 1 && dy >= 0 && dy < 2.2 * sc * Math.sqrt(1 - dx * dx)) inside = true, part = 1;
                        if (dx < 1.15 && y >= top - 1.5 * sc - 0.6 && y < top - 1.5 * sc + 0.4) inside = true, part = 1;
                        if ((Math.abs(dx - 0.85) < 0.25 || Math.abs(dx) < 0.15) && y >= top - 1.5 * sc) inside = true, part = 1;
                        if (dx < 0.2 && dy >= 2.2 * sc && dy < 2.2 * sc + 1) inside = true, part = 1;
                    }
                    if (style === 3 && Math.abs(xc - mid) < tw / 2 && y >= top - 3.5 * sc) inside = true, part = 2;
                }
                if (!inside) continue;
                const fy = (y - top) / Math.max(1, base - top);
                let l = (0.7 + 0.45 * sd) * (0.95 - 0.3 * fy);
                if (xc < x0 + 1.2 + (sc > 1 ? 1 : 0)) l *= 0.36;
                else if (xc > x1 - 1) l *= 1.12;
                if (part === 0 && y < top + 1) l *= 1.25;
                else if (part === 0 && y < top + 2 && style !== 3) l *= 0.6;
                if (part === 0 && y > base - 1) l *= 0.6;
                if (part === 1) l *= 0.95;
                if (part === 2 && xc < mid - tw / 2 + 1) l *= 0.5;
                const hz = 0.4 * depth;
                const cr = mix(0.6 * l, 0.12, hz), cg = mix(0.67 * l, 0.17, hz), cb = mix(0.84 * l, 0.38, hz);
                set(k, BLD, cr, cg, cb, 0.14);
                if (part === 0 && y > top + 2 && y < base - 1 && xc > x0 + 1.5 && xc < x1 - 1) {
                    const lx = Math.floor(xc - x0), ly = Math.floor(base - y);
                    if (sc > 1.05) {
                        if (lx % 3 === 1 && ly % 4 >= 1 && ly % 4 <= 2) pane(k, sd * 1000 + bi, 1 - depth);
                    } else if (lx % 3 === 1 && ly % 3 === 1) pane(k, sd * 1000 + bi, 1 - depth);
                }
                if (part === 2 && y > top - 2.2 * sc && y < top - 0.8 && Math.abs(xc - mid) < tw / 2 - 1 && Math.floor(xc) % 2 === 0) pane(k, sd * 1000 + bi + 5, 1 - depth);
            }
        }
        if (base > 40 && hash(bi, 71) < 0.55) {
            for(let x = x0 + 1; x < x1 - 0.5; x += 2)bulbs.push([
                x,
                top - (style === 0 ? 1.5 : 0.5),
                hash(x | 0, bi) * 40
            ]);
        }
    });
    const TX = 38, TB = 33, TH = 19, TW = 5.5;
    for(let r = Math.floor(TB - TH - 3); r < TB + 4; r++){
        for(let x = Math.floor(TX - 12); x < TX + 12; x++){
            const k = r * W + x;
            const xc = x + 0.5, y = r + 0.5;
            const h = TB - y, dx = xc - TX;
            const f = h / TH;
            let hw = f <= 1 && f >= 0 ? TW * Math.pow(Math.max(0, 1 - Math.pow(f, 1.7)), 0.55) : -1;
            if (f > 0.9 && f < 1.03) hw = Math.max(hw, TW * 0.4);
            if (f >= 1.03 && h < TH + 2.2) hw = 0.6;
            if (h < 0 && h > -4) hw = TW * 1.25;
            const md = Math.hypot((xc - (TX + 8)) / 4.2, (y - (TB - 2)) / 3.4);
            const inM = md < 1 && y < TB - 2 || Math.abs(xc - (TX + 8)) < 4.6 && y >= TB - 2 && y < TB + 4;
            if (Math.abs(dx) <= hw || inM) {
                const rib = Math.abs(dx) < hw * 0.3 ? 1.08 : dx < 0 ? 0.62 : 0.95;
                const course = !inM && Math.floor(h / 1.5) % 2 ? 0.85 : 1;
                const l = rib * course * (inM ? xc < TX + 6 ? 0.65 : 0.9 : 1);
                set(k, BLD, 0.72 * l, 0.77 * l, 0.9 * l, 0.14);
            }
            if (h > TH + 1.6 && h < TH + 3.8 && dx > 0.4 && dx < 3 - (h - TH - 1.6) * 0.3) set(k, BLD, 0.85, 0.45, 0.2, 0.1);
        }
    }
    const G0 = 53, G1 = 97, GT = 38, GB = 57;
    const arches = [
        [
            GX,
            6,
            51.5
        ],
        [
            GX - 14.5,
            4.2,
            53
        ],
        [
            GX + 14.5,
            4.2,
            53
        ]
    ];
    const archIn = (xc, y)=>{
        let best = -9;
        for (const [cx, hw, spring] of arches){
            const R = hw * 1.55, dx = Math.abs(xc - cx);
            let d;
            if (y >= spring) d = Math.min(hw - dx, GB - y + 0.5);
            else d = R - Math.hypot(dx + (R - hw), y - spring);
            best = Math.max(best, d);
        }
        return best;
    };
    for(let r = 24; r < GB + 1; r++){
        for(let x = G0 - 2; x < G1 + 2; x++){
            const k = r * W + x;
            const xc = x + 0.5, y = r + 0.5;
            let inside = xc >= G0 && xc < G1 && y >= GT && y < GB;
            let l = 1, dome = false;
            if (xc >= G0 - 1 && xc < G1 + 1 && y >= GT && y < GT + 1.2) inside = true, l = 1.1;
            if (y >= GT + 1.2 && y < GT + 2.2) l = 0.55;
            if (y >= GT - 2 && y < GT && xc >= G0 && xc < G1) inside = true, l = x % 3 === 0 && y < GT - 1 ? 0.5 : 0.95;
            for (const cx of [
                G0 + 2.5,
                GX,
                G1 - 2.5
            ]){
                const big = cx === GX ? 1.6 : 1.15;
                const dx = Math.abs(xc - cx) / (2.6 * big);
                const db = GT - 2 - 2.4 * big;
                if (dx < 1 && y < db && y >= db - 2.8 * big * Math.sqrt(1 - dx * dx)) inside = true, dome = true, l = xc < cx - 1.2 * big ? 0.55 : 1.15;
                if (dx < 0.18 && y < db - 2.8 * big && y >= db - 2.8 * big - 1.2) inside = true, dome = true, l = 1.2;
                if (dx < 1.18 && y >= db && y < db + 0.8) inside = true, dome = true, l = 1.1;
                if (y >= db + 0.8 && y < GT - 2 && (Math.abs(dx - 0.8) < 0.2 || Math.abs(dx + 0.8) < 0.2)) inside = true, dome = true, l = 0.9;
                else if (dx < 0.6 && y >= db + 0.8 && y < GT - 2) inside = true, dome = true, l = 0.22;
            }
            if (!inside) {
                let rim = y >= GT - 3 && y < GT - 2 && xc >= G0 - 1 && xc < G1 + 1;
                for (const cx of [
                    G0 + 2.5,
                    GX,
                    G1 - 2.5
                ]){
                    const big = cx === GX ? 1.6 : 1.15;
                    const db = GT - 2 - 2.4 * big;
                    const dx = Math.abs(xc - cx) / (2.6 * big + 1.2);
                    if (dx < 1 && y < GT - 2 && y >= db - (2.8 * big + 1.4) * Math.sqrt(1 - dx * dx)) rim = true;
                }
                if (rim && mat[k] !== SKY) set(k, TOWN, 0.05, 0.06, 0.14, 0.08);
                continue;
            }
            const ai = archIn(xc, y);
            if (ai > 0 && y >= GT + 2) {
                const g = 0.07 + 0.22 * smooth(GB - 9, GB, y);
                set(k, ARCH, g * 1.1, g * 0.62, g * 0.32, 0.06);
                continue;
            }
            const lift = dome ? 0.55 : smooth(GT - 6, GB, y);
            const mould = ai > -1.2 && ai <= 0 && y >= GT + 2 ? 1.18 : 1;
            const pil = Math.abs(xc - (GX - 8.3)) < 1 || Math.abs(xc - (GX + 8.3)) < 1 ? 1.1 : 1;
            const b = l * mould * pil * (0.62 + 0.42 * lift);
            set(k, GATE, mix(0.74, 0.98, lift) * b, mix(0.62, 0.74, lift) * b, mix(0.58, 0.46, lift) * b, 0.16);
        }
    }
    for(let x = G0 + 0.5; x < G1; x += 2)bulbs.push([
        x,
        GT - 2.5,
        hash(x | 0, 333) * 40
    ]);
    for (const [cx, hw, spring] of arches){
        const R = hw * 1.55, o = R - hw, Ro = R + 1.2;
        const end = Math.acos(o / Ro), n = Math.max(2, Math.round(end * Ro / 2));
        for(let j = 0; j < n; j++){
            const a = end * j / n;
            for (const s of [
                -1,
                1
            ])bulbs.push([
                cx + s * (Ro * Math.cos(a) - o),
                spring - Ro * Math.sin(a),
                hash(cx * 7 + s, j) * 40
            ]);
        }
        bulbs.push([
            cx,
            spring - Ro * Math.sin(end),
            hash(cx, 5) * 40
        ]);
    }
    for(let r = GB; r < HZ; r++){
        const y = r + 0.5;
        const half = 26 + (y - GB) * 1.3;
        for(let x = Math.floor(GX - half); x < GX + half; x++){
            const k = r * W + x;
            const xc = x + 0.5;
            const warm = Math.exp(-(((xc - GX) / 26) ** 2)) * (1 - 0.05 * (y - GB));
            const tread = (r - GB) % 2 === 0;
            const l = (tread ? 1 : 0.38) * (0.55 + 0.45 * warm);
            const wet = r >= HZ - 1 ? 0.6 : 1;
            set(k, STEP, mix(0.42, 0.95, warm) * l * wet, mix(0.47, 0.68, warm) * l * wet, mix(0.62, 0.4, warm) * l * wet, 0.14);
        }
    }
    const wings = [
        [
            147,
            155,
            50
        ],
        [
            155,
            163,
            48
        ],
        [
            163,
            171,
            46.5
        ],
        [
            171,
            179,
            49
        ],
        [
            179,
            187,
            45.5
        ],
        [
            187,
            195,
            48
        ],
        [
            195,
            201,
            50.5
        ]
    ];
    for (const [x0, x1, top] of wings){
        const mid = (x0 + x1) / 2;
        for(let r = Math.floor(top - 5); r < FAR; r++){
            for(let x = Math.floor(x0); x < x1 && x < W; x++){
                const k = r * W + x;
                const xc = x + 0.5, y = r + 0.5;
                let inside = y >= top;
                const tall = top < 48;
                if (tall) {
                    const dx = Math.abs(xc - mid) / 2.2;
                    if (dx < 1 && y < top && y >= top - 0.8 - 2.4 * Math.sqrt(1 - dx * dx)) inside = true;
                    if (dx < 0.25 && y < top && y >= top - 4.2) inside = true;
                }
                if (!inside) continue;
                const l = (xc < x0 + 1 ? 0.55 : 1) * (y < top + 1 ? 1.15 : 1) * (1 - 0.35 * smooth(top, FAR, y));
                set(k, PALACE, 0.6 * l, 0.46 * l, 0.32 * l, 0.14);
                if (y > top + 1.5 && y < FAR - 1.5 && (x - Math.floor(x0)) % 3 === 1 && (FAR - r) % 2 === 0) {
                    const lit = hash(x * 3, r * 11) < 0.75;
                    if (lit) set(k, PALACE, 1, 0.84, 0.5, 0.14);
                    else set(k, PALACE, 0.22, 0.16, 0.14, 0.1);
                }
            }
        }
        for(let x = x0 + 1.5; x < Math.min(W, x1 - 1); x += 3)bulbs.push([
            x,
            top + 0.5,
            hash(x | 0, 909) * 40
        ]);
    }
    const strands = [];
    for(let i = 0; i + 1 < blds.length; i++){
        const a = blds[i], b = blds[i + 1];
        if (a[3] === HZ && b[3] === HZ && hash(i, 401) < 0.6) strands.push([
            a[1] - 1,
            a[2] + 0.5,
            b[1] - 1,
            b[2] + 0.5
        ]);
    }
    for (const [xa, ya, xb, yb] of strands){
        const n = Math.max(2, Math.round(Math.abs(xb - xa) / 2));
        for(let j = 0; j <= n; j++){
            const u = j / n;
            bulbs.push([
                mix(xa, xb, u),
                mix(ya, yb, u) + 2.2 * 4 * u * (1 - u),
                hash(j, xa * 13) * 40
            ]);
        }
    }
    const diyas = [];
    for(let i = 0; i < 52; i++){
        const q = hash(i, 61);
        const y = HZ + 3 + 32 * Math.pow(q, 0.95);
        const dir = hash(i, 65) < 0.62 ? 1 : -1;
        diyas.push([
            hash(i, 62) * 260,
            y,
            hash(i, 63) * 50,
            0.7 + 0.5 * hash(i, 64),
            dir
        ]);
    }
    const dyn = [
        new Float32Array(N),
        new Float32Array(N),
        new Float32Array(N)
    ];
    const dref = new Float32Array(N);
    const addGlow = (fx, fy, core, halo, amp, c)=>{
        const R = Math.ceil(halo * 3);
        for(let r = Math.max(0, Math.floor(fy - R)); r < Math.min(H, fy + R); r++){
            for(let x = Math.max(0, Math.floor(fx - R)); x < Math.min(W, fx + R); x++){
                const k = r * W + x;
                const dx = x + 0.5 - fx, dy = r + 0.5 - fy;
                const d = Math.sqrt(dx * dx + dy * dy);
                const h = Math.exp(-((d / core) ** 2)) * 1.8 * amp, v = Math.exp(-d / halo) * 0.3 * amp;
                dyn[0][k] += h + v * c[0], dyn[1][k] += h * 0.88 + v * c[1], dyn[2][k] += h * 0.6 + v * c[2];
            }
        }
    };
    const addStreak = (fx, y0, width, len, amp)=>{
        for(let r = Math.max(0, Math.floor(y0)); r < H; r++){
            const dy = r + 0.5 - y0;
            const a = Math.exp(-dy / len) * amp * smooth(-0.5, 1, dy);
            if (a < 0.01) break;
            for(let x = Math.max(0, Math.floor(fx - 3 * width - 1)); x < Math.min(W, fx + 3 * width + 1); x++){
                dref[r * W + x] += a * Math.exp(-(((x + 0.5 - fx) / width) ** 2));
            }
        }
    };
    return (t, { color } = {})=>{
        for(let c = 0; c < 3; c++)dyn[c].fill(0);
        dref.fill(0);
        for (const [bx, by, ph] of bulbs){
            const x = Math.floor(bx), r = Math.floor(by);
            if (x < 1 || x >= W - 1 || r < 1 || r >= H - 1) continue;
            const v = 0.62 + 0.38 * Math.sin(t * (1.6 + ph % 1.7) + ph);
            const k = r * W + x;
            dyn[0][k] += v * BULB[0], dyn[1][k] += v * BULB[1], dyn[2][k] += v * BULB[2];
            for (const o of [
                -1,
                1,
                -W,
                W
            ])dyn[0][k + o] += 0.12 * v, dyn[1][k + o] += 0.08 * v, dyn[2][k + o] += 0.03 * v;
        }
        addGlow(GX, 46.5, 0.9, 2.6, 0.85 + 0.15 * Math.sin(t * 7) * Math.sin(t * 4.3), FLAME);
        for (const [x0, y0, ph, sz, dir] of diyas){
            const near = (y0 - HZ) / (H - HZ);
            const x = ((x0 + dir * t * (0.35 + 0.8 * near)) % 260 + 260) % 260 - 30;
            const y = y0 + (1 + 1.6 * near) * Math.sin(x * 0.045 + ph);
            if (x < -3 || x > W + 3 || y < wlF(x) + 1) continue;
            const fl = 0.78 + 0.22 * Math.sin(t * 9 + ph) * Math.sin(t * 5.3 + ph * 2);
            const s = (0.35 + 0.9 * near) * sz;
            addGlow(x, y - 0.4, 0.5 + 0.45 * s, 0.9 + 1.8 * s, fl * 1.3, FLAME);
            const cr = Math.floor(y + 0.4);
            for(let xx = Math.floor(x - 0.8 - s); xx <= x + 0.8 + s; xx++){
                if (xx < 0 || xx >= W || cr >= H) continue;
                const k = cr * W + xx;
                dyn[0][k] += 0.28 * fl, dyn[1][k] += 0.12 * fl, dyn[2][k] += 0.04 * fl;
            }
            addStreak(x, y + 0.6, 0.35 + 0.35 * s, 2 + 5 * s, 0.55 * fl);
        }
        for(let r = 0; r < H; r++){
            const y = r + 0.5;
            for(let x = 0; x < W; x++){
                const k = r * W + x;
                const m = mat[k];
                let cr = sR[k], cg = sG[k], cb = sB[k], floor = flo[k], fade = 1, star = false;
                if (m === SKY && y < 48 && hash(x, r * 3 + 11) > 0.986) {
                    const dm = Math.hypot(x - MOON[0], y - MOON[1]);
                    const tw = (0.45 + 0.4 * Math.sin(t * (1.2 + hash(x, r) * 2.5) + hash(r, x) * 6.28)) * smooth(48, 18, y) * smooth(6, 16, dm);
                    if (tw > 0.12) cr = Math.max(cr, tw * 0.9), cg = Math.max(cg, tw * 0.92), cb = Math.max(cb, tw), star = true;
                } else if (m === WATER) {
                    const wl = wlF(x + 0.5);
                    const d = y - wl, v = (y - FAR) / (H - FAR);
                    const w = 0.6 * noise(x * 0.05 + t * 0.07, y * 0.45 - t * 0.4, 0) + 0.4 * noise(x * 0.16 - t * 0.13, y * 0.95 - t * 0.85, 0);
                    const swell = 0.55 + 0.9 * w;
                    cr = 0.025 * swell, cg = 0.04 * swell, cb = 0.12 * swell;
                    const wx = (noise(x * 0.05 + 7, y * 0.35 - t * 0.6, 0) - 0.5) * (1.5 + 4 * v);
                    const wy = (noise(x * 0.09 + 3, y * 0.6 - t * 0.9, 0) - 0.5) * (1 + 2.5 * v);
                    const ym = wl - d * 0.92 - 0.6 + wy;
                    let sx = Math.round(x + wx);
                    if (sx < 0) sx = 0;
                    if (sx > W - 1) sx = W - 1;
                    const q = ym < 0 ? -1 : Math.floor(ym) * W + sx;
                    if (q >= 0 && mat[q] !== WATER) {
                        const dash = smooth(0.3, 0.75, noise(x * 0.09 + 3, y * 0.9 - t * 1.0, 0));
                        const da = (0.12 + 0.88 * dash) * (0.85 - 0.3 * smooth(HZ, H, y));
                        const sp = Math.max(sR[q], sG[q], sB[q]);
                        const keep = (0.24 + 0.55 * smooth(0.5, 0.9, sR[q] - sB[q] + 0.6)) * (sp > 1 ? 1 / sp : 1);
                        cr += (sR[q] * keep + dyn[0][q]) * da, cg += (sG[q] * keep + dyn[1][q]) * da, cb += (sB[q] * keep + dyn[2][q]) * da;
                    }
                    const fl = dref[k] * (0.25 + 1.0 * smooth(0.3, 0.7, w));
                    cr += fl * FLAME[0], cg += fl * FLAME[1], cb += fl * FLAME[2];
                    floor = 0.12;
                    fade = smooth(H + 4, H - 14, y);
                }
                cr += dyn[0][k], cg += dyn[1][k], cb += dyn[2][k];
                const peak = Math.max(cr, cg, cb, 1e-4);
                const level = clamp(floor + (1 - floor) * Math.pow(peak, 0.72) * 0.95) * fade;
                const step = Math.max(0, Math.min(3, Math.round(level * 3 + BAYER[(r & 3) * 4 + (x & 3)])));
                out[k] = DOTS[step];
                if (color) {
                    if (star) color[k] = STAR;
                    else {
                        const want = step ? Math.min(1, (level + 0.06) / COVER[step]) : 0;
                        const s = Math.min(LIFT[step], (0.3 + 0.7 * want) / peak);
                        color[k] = nearest(clamp(cr * s), clamp(cg * s), clamp(cb * s));
                    }
                }
            }
        }
        const lines = [];
        for(let r = 0; r < H; r++)lines.push(out.slice(r * W, (r + 1) * W).join(""));
        return lines.join("\n");
    };
}
