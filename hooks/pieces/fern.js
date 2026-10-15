// fern — from ascii.rest by bas3line, MIT License (see LICENSE)
export const meta = {
    name: "fern",
    category: "nature",
    note: "barnsley's fern filling in point by point, then swaying",
    cols: 44,
    rows: 30,
    fps: 20
};
const N = 36000;
const GROW = 3;
const SLIM = 0.55;
const TAU = Math.PI * 2;
const MAPS = [
    [
        0,
        0,
        0,
        0.16,
        0,
        0,
        0.01
    ],
    [
        0.85,
        0.04,
        -0.04,
        0.85,
        0,
        1.6,
        0.85
    ],
    [
        0.2 * SLIM,
        -0.26,
        0.23 * SLIM,
        0.22,
        0,
        1.6,
        0.925
    ],
    [
        -0.15 * SLIM,
        0.28,
        0.26 * SLIM,
        0.24,
        0,
        0.44,
        1
    ]
];
const SHIFT = -0.25;
const mulberry32 = (a)=>()=>{
        a = a + 0x6d2b79f5 | 0;
        let t = Math.imul(a ^ a >>> 15, 1 | a);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
export default function fern() {
    const { cols, rows } = meta;
    const rand = mulberry32(17);
    const axis = (k, m)=>{
        let [u, v] = m === 0 ? [
            0,
            1
        ] : [
            MAPS[m][1],
            MAPS[m][3]
        ];
        for(let s = 0; s < k; s++)[u, v] = [
            0.85 * u + 0.04 * v,
            -0.04 * u + 0.85 * v
        ];
        return Math.atan2(u, v);
    };
    const lean = [
        0,
        2,
        3
    ].map((m)=>Array.from({
            length: 61
        }, (_, k)=>axis(k, m)));
    const px = new Float32Array(N), py = new Float32Array(N), pl = new Float32Array(N);
    let x = 0, y = 0, k = 0, m = 0;
    for(let i = -20; i < N; i++){
        const p = rand();
        const j = MAPS.findIndex((q)=>p < q[6]);
        const [a, b, c, d, e, f] = MAPS[j];
        [x, y] = [
            a * x + b * y + e,
            c * x + d * y + f
        ];
        if (j === 1) k = Math.min(60, k + 1);
        else k = 0, m = j;
        if (i >= 0) px[i] = x + SHIFT, py[i] = y, pl[i] = lean[m ? m - 1 : 0][k];
    }
    const spine = [
        [
            SHIFT,
            0
        ]
    ];
    for(let k = 0, [sx, sy] = [
        0,
        0
    ]; k < 60; k++){
        [sx, sy] = [
            0.85 * sx + 0.04 * sy,
            -0.04 * sx + 0.85 * sy + 1.6
        ];
        spine.push([
            sx + SHIFT,
            sy
        ]);
    }
    const S = (rows - 3.8) / 10;
    const ROOT_R = rows - 1.5;
    const ROOT_C = cols / 2;
    const n0 = new Float32Array(cols * rows), sc = new Float32Array(cols * rows), ss = new Float32Array(cols * rows);
    return (t)=>{
        const g = Math.min(1, t / GROW), e = g * g * (3 - 2 * g);
        const n = Math.floor(N * (0.05 + 0.95 * e));
        const scale = S * (0.8 + 0.2 * e);
        const calm = Math.min(1, Math.max(0, (t - GROW * 0.5) / GROW));
        const sway = calm * (0.07 * Math.sin(TAU * t / 5) + 0.02 * Math.sin(TAU * t / 2 + 1));
        const bend = (v0)=>{
            const h = v0 / 10;
            return sway * h * Math.sqrt(h) * 1.6 + 0.012 * calm * h * Math.sin(t * 4 + v0 * 3);
        };
        const place = (u0, v0)=>{
            const a = bend(v0), ca = Math.cos(a), sa = Math.sin(a);
            return [
                ROOT_C + (u0 * ca + v0 * sa) * 2 * scale,
                ROOT_R - (-u0 * sa + v0 * ca) * scale
            ];
        };
        n0.fill(0), sc.fill(0), ss.fill(0);
        for(let i = 0; i < n; i++){
            const [X, Y] = place(px[i], py[i]);
            const c = Math.floor(X), r = Math.floor(Y);
            if (c < 0 || c >= cols || r < 0 || r >= rows) continue;
            const k = c + r * cols, a = 2 * (pl[i] + bend(py[i]));
            n0[k]++, sc[k] += Math.cos(a), ss[k] += Math.sin(a);
        }
        const full = 0.6 + 0.4 * Math.sqrt(n / N);
        const out = new Array(cols * rows).fill(" ");
        for(let k = 0; k < cols * rows; k++){
            if (n0[k] < 2 * full) continue;
            const a = 0.5 * Math.atan2(ss[k], sc[k]), sure = Math.hypot(ss[k], sc[k]) / n0[k];
            out[k] = n0[k] < 6 * full || sure < 0.5 ? "." : Math.abs(a) < 0.33 ? "|" : Math.abs(a) > 1.25 ? "-" : a > 0 ? "/" : "\\";
        }
        const pts = spine.map(([u0, v0])=>place(u0, v0));
        for(let i = 1; i < pts.length; i++){
            const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
            const s = (x1 - x0) / (y0 - y1 + 1e-9);
            for(let r = Math.ceil(y1 - 0.5); r <= Math.floor(y0 - 0.5); r++){
                const c = Math.floor(x0 + s * (y0 - r - 0.5));
                if (c >= 0 && c < cols && r >= 0 && r < rows) out[c + r * cols] = s < 0.4 ? "|" : s < 1.4 ? "(" : "/";
            }
        }
        const rc = Math.floor(pts[0][0]);
        for(let c = rc - 6; c <= rc + 6; c++)if (out[c + (rows - 1) * cols] === " ") out[c + (rows - 1) * cols] = Math.abs(c - rc) > 4 ? "." : "_";
        const lines = [];
        for(let r = 0; r < rows; r++)lines.push(out.slice(r * cols, (r + 1) * cols).join(""));
        return lines.join("\n");
    };
}
