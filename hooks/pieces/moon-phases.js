// moon-phases — from ascii.rest by bas3line, MIT License (see LICENSE)
export const meta = {
    name: "moon phases",
    category: "space",
    note: "the moon waxing and waning, its maria darker in the light",
    cols: 46,
    rows: 23,
    fps: 15
};
const RAMP = " .:-=+*#%@";
const MONTH = 24;
const START = 0.95;
const SS = 3;
const MARIA = [
    [
        -0.62,
        0.08,
        0.28,
        0.5,
        0.62,
        0
    ],
    [
        -0.3,
        0.45,
        0.27,
        0.21,
        0.7,
        0
    ],
    [
        -0.3,
        0.71,
        0.25,
        0.1,
        0.55,
        0.25
    ],
    [
        0.14,
        0.79,
        0.22,
        0.085,
        0.5,
        -0.2
    ],
    [
        0.19,
        0.42,
        0.15,
        0.14,
        0.7,
        0
    ],
    [
        0.38,
        0.12,
        0.21,
        0.16,
        0.7,
        0
    ],
    [
        0.05,
        0.25,
        0.09,
        0.06,
        0.5,
        0
    ],
    [
        -0.28,
        0.08,
        0.12,
        0.09,
        0.4,
        0
    ],
    [
        0.75,
        0.3,
        0.1,
        0.14,
        0.72,
        0
    ],
    [
        0.62,
        -0.12,
        0.12,
        0.2,
        0.62,
        0
    ],
    [
        0.42,
        -0.28,
        0.09,
        0.09,
        0.62,
        0
    ],
    [
        -0.2,
        -0.34,
        0.19,
        0.14,
        0.6,
        0
    ],
    [
        -0.52,
        -0.43,
        0.09,
        0.1,
        0.65,
        0
    ],
    [
        -0.88,
        -0.06,
        0.05,
        0.08,
        0.5,
        0
    ]
];
const CRATERS = [
    [
        -0.15,
        -0.72,
        0.09,
        0.4
    ],
    [
        -0.33,
        0.17,
        0.05,
        0.2
    ],
    [
        -0.6,
        0.14,
        0.035,
        0.15
    ],
    [
        -0.75,
        0.38,
        0.03,
        0.3
    ]
];
const RAYS = [
    [
        1.75,
        0.55
    ],
    [
        1.3,
        0.4
    ],
    [
        2.3,
        0.35
    ],
    [
        0.4,
        0.3
    ],
    [
        3.1,
        0.3
    ],
    [
        -0.6,
        0.22
    ],
    [
        4.1,
        0.2
    ]
];
const TYCHO = CRATERS[0];
function mulberry32(a) {
    return ()=>{
        a = a + 0x6d2b79f5 | 0;
        let t = Math.imul(a ^ a >>> 15, 1 | a);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}
const smooth = (a, b, x)=>{
    const u = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return u * u * (3 - 2 * u);
};
function albedo(x, y) {
    let alb = 1;
    for (const [mx, my, rx, ry, k, rot] of MARIA){
        const c = Math.cos(rot), s = Math.sin(rot), dx = x - mx, dy = y - my;
        alb -= k * (1 - smooth(0.55, 1, Math.hypot((dx * c + dy * s) / rx, (dy * c - dx * s) / ry)));
    }
    alb = Math.max(0.3, alb);
    for (const [mx, my, rr, k] of CRATERS)alb += k * (1 - smooth(0.3, 1, Math.hypot(x - mx, y - my) / rr));
    const dx = x - TYCHO[0], dy = y - TYCHO[1], d = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
    for (const [at, len] of RAYS){
        const off = Math.abs(Math.atan2(Math.sin(a - at), Math.cos(a - at)));
        if (d > TYCHO[2] && d < len && off < 1) alb += 0.3 * (1 - d / len) * Math.exp(-((off * d / 0.03) ** 2));
    }
    return Math.min(1.35, alb);
}
export default function moonPhases() {
    const { cols, rows } = meta;
    const cx = cols / 2, cy = rows / 2;
    const R = rows / 2 - 1;
    const rand = mulberry32(7);
    const disk = (c, r)=>Math.hypot((c + 0.5 - cx) / (2 * R), (cy - r - 0.5) / R);
    const samples = Array.from({
        length: cols * rows
    }, ()=>[]);
    const ground = new Float32Array(cols * rows);
    for(let r = 0; r < rows; r++)for(let c = 0; c < cols; c++){
        const s = samples[r * cols + c];
        for(let j = 0; j < SS; j++)for(let i = 0; i < SS; i++){
            const x = (c + (i + 0.5) / SS - cx) / (2 * R), y = (cy - r - (j + 0.5) / SS) / R;
            const d = x * x + y * y;
            if (d < 1) s.push(x, y, Math.sqrt(1 - d), albedo(x, y));
        }
        for(let i = 3; i < s.length; i += 4)ground[r * cols + c] += s[i] / (s.length / 4);
    }
    const full = 4 * SS * SS;
    const inside = (c, r)=>c >= 0 && c < cols && r >= 0 && r < rows && samples[r * cols + c].length * 2 >= full;
    const rim = new Uint8Array(cols * rows);
    const stars = new Uint8Array(cols * rows);
    for(let r = 0; r < rows; r++)for(let c = 0; c < cols; c++){
        const k = r * cols + c;
        if (inside(c, r)) rim[k] = inside(c - 1, r) && inside(c + 1, r) && inside(c, r - 1) && inside(c, r + 1) ? 0 : 1;
        else if (disk(c, r) > 1.12 && rand() < 0.022) stars[k] = rand() < 0.25 ? 2 : 1;
    }
    const n = RAMP.length - 1;
    return (t, { paper = false } = {})=>{
        const ph = START + 2 * Math.PI * (t % MONTH) / MONTH;
        const m = Math.hypot(Math.sin(ph), 0.12, Math.cos(ph));
        const lx = Math.sin(ph) / m, ly = 0.12 / m, lz = -Math.cos(ph) / m;
        const earthshine = smooth(0, 0.5, Math.cos(ph));
        let out = "";
        for(let r = 0; r < rows; r++){
            if (r) out += "\n";
            for(let c = 0; c < cols; c++){
                const k = r * cols + c, s = samples[k];
                if (!inside(c, r)) {
                    out += stars[k] ? stars[k] === 2 ? "+" : "." : " ";
                    continue;
                }
                let sum = 0;
                for(let i = 0; i < s.length; i += 4){
                    const mu0 = s[i] * lx + s[i + 1] * ly + s[i + 2] * lz;
                    if (mu0 <= 0) continue;
                    sum += s[i + 3] * (0.3 * mu0 + 0.7 * 2 * mu0 / (mu0 + s[i + 2]));
                }
                const v = Math.min(1, sum / (s.length / 4));
                let i = v < 0.015 ? rim[k] || earthshine * ground[k] > 0.72 ? 1 : 0 : 1 + Math.round(v * (n - 1));
                if (paper) i = n - i;
                out += RAMP[i];
            }
        }
        return out;
    };
}
