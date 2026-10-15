// tv-static — from ascii.rest by bas3line, MIT License (see LICENSE)
export const meta = {
    name: "tv static",
    category: "effects",
    note: "snow on an old set that tunes into a test card and loses it",
    cols: 58,
    rows: 26,
    fps: 20,
    options: {
        set: true
    }
};
const RAMP = " .:+░▒▓█";
const LOOP = 10;
const BARS = [
    7,
    6,
    5,
    4,
    3,
    2,
    1
];
const CASTLE = [
    1,
    0,
    3,
    0,
    5,
    0,
    7
];
const BOTTOM = [
    [
        0.17,
        5
    ],
    [
        0.34,
        7
    ],
    [
        0.51,
        3
    ],
    [
        0.68,
        0
    ],
    [
        0.73,
        1
    ],
    [
        0.78,
        0
    ],
    [
        0.83,
        2
    ],
    [
        1,
        0
    ]
];
const SNOW = [
    0.36,
    0.48,
    0.6,
    0.7,
    0.8,
    0.9,
    0.98
];
const hash = (a, b, c)=>{
    let h = Math.imul(a, 0x27d4eb2d) ^ Math.imul(b, 0x165667b1) ^ Math.imul(c, 0x2545f491);
    h = Math.imul(h ^ h >>> 15, 0x85ebca6b);
    h = Math.imul(h ^ h >>> 13, 0xc2b2ae35);
    return ((h ^ h >>> 16) >>> 0) / 4294967296;
};
const smooth = (a, b, v)=>{
    const x = Math.max(0, Math.min(1, (v - a) / (b - a)));
    return x * x * (3 - 2 * x);
};
function drawSet(cols, rows) {
    const g = Array.from({
        length: rows
    }, ()=>new Array(cols).fill(" "));
    const box = (x0, y0, x1, y1, c = "╭╮╰╯─│")=>{
        for(let x = x0 + 1; x < x1; x++)g[y0][x] = g[y1][x] = c[4];
        for(let y = y0 + 1; y < y1; y++)g[y][x0] = g[y][x1] = c[5];
        [g[y0][x0], g[y0][x1], g[y1][x0], g[y1][x1]] = [
            c[0],
            c[1],
            c[2],
            c[3]
        ];
    };
    box(1, 5, 56, 23);
    box(3, 6, 43, 22);
    box(46, 8, 52, 10);
    box(46, 12, 52, 14);
    box(45, 16, 53, 21, "┌┐└┘─│");
    for(let y = 17; y <= 20; y++)for(let x = 46; x <= 52; x++)g[y][x] = "═";
    g[13][49] = "╲";
    const put = (x, y, s)=>[
            ...s
        ].forEach((ch, i)=>g[y][x + i] = ch);
    put(25, 4, "▄▄███▄▄");
    for(let k = 1; k <= 4; k++){
        g[4 - k][25 - k] = "╲";
        g[4 - k][31 + k] = "╱";
    }
    g[0][21] = g[0][35] = "o";
    put(5, 24, "╱");
    put(4, 25, "╱");
    put(52, 24, "╲");
    put(53, 25, "╲");
    return g;
}
function drawCard(SW, SH) {
    const card = Array.from({
        length: SH
    }, (_, r)=>Array.from({
            length: SW
        }, (_, c)=>{
            const u = (c + 0.5) / SW, v = (r + 0.5) / SH;
            const bar = Math.min(6, Math.floor(u * 7));
            if (v < 0.67) return BARS[bar];
            if (v < 0.75) return CASTLE[bar];
            return BOTTOM.find(([end])=>u < end)[1];
        }));
    const R = Math.min(SH * 0.43, SW * 0.22) * 2, cx = SW / 2, cy = SH / 2;
    const span = [];
    for(let r = 0; r < SH; r++){
        const y = (r + 0.5 - cy) * 2, w = R * R - y * y;
        span.push(w < 0 ? null : [
            Math.ceil(cx - Math.sqrt(w) - 0.5),
            Math.floor(cx + Math.sqrt(w) - 0.5)
        ]);
    }
    const mid = Math.floor(SH / 2), mc = Math.floor(SW / 2);
    for(let r = 0; r < SH; r++){
        if (!span[r]) continue;
        const [a, b] = span[r];
        const up = r < mid, near = up ? span[r - 1] : span[r + 1];
        const [na, nb] = near || [
            mc + 1,
            mc - 1
        ];
        for(let c = a; c <= b; c++){
            if (c > a && c < na && c < nb) card[r][c] = "─";
            else if (c < b && c > nb && c > na) card[r][c] = "─";
        }
        if (a < na) {
            card[r][a] = up ? "╭" : "╰";
            card[r][na] = up ? "╯" : "╮";
            card[r][b] = up ? "╮" : "╯";
            card[r][nb] = up ? "╰" : "╭";
        } else card[r][a] = card[r][b] = "│";
        if (!near) for(let c = a + 1; c < b; c++)card[r][c] = "─";
    }
    const [a, b] = span[mid];
    for(let c = a + 1; c < b; c++)card[mid][c] = "─";
    for(let r = 0; r < SH; r++)if (span[r]) card[r][mc] = "│";
    card[mid][a] = "├";
    card[mid][b] = "┤";
    card[mid][mc] = "┼";
    card[span.findIndex(Boolean)][mc] = "┬";
    card[SH - 1 - [
        ...span
    ].reverse().findIndex(Boolean)][mc] = "┴";
    return card;
}
export default function tvStatic({ set = true } = {}) {
    const { cols, rows, fps } = meta;
    const frame = set ? drawSet(cols, rows) : null;
    const [X0, Y0, SW, SH] = set ? [
        4,
        7,
        39,
        15
    ] : [
        0,
        0,
        cols,
        rows
    ];
    const inside = (c, r)=>{
        if (!set) return true;
        const x = (c + 0.5 - SW / 2) / (SW / 2), y = (r + 0.5 - SH / 2) / (SH / 2);
        return x ** 6 + y ** 6 <= 1.02;
    };
    const card = drawCard(SW, SH);
    const g = Array.from({
        length: rows
    }, ()=>new Array(cols));
    const N = RAMP.length - 1;
    const ink = (level, paper)=>RAMP[paper ? N - level : level];
    return (t, { paper = false } = {})=>{
        const u = (t % LOOP + LOOP) % LOOP;
        const k = Math.floor(t * fps);
        const lock = smooth(1.6, 3.4, u) * (1 - smooth(6.6, 7.8, u));
        const dial = Math.max(0, Math.min(3, Math.floor((u - 1.1) * 8), 3 - Math.floor((u - 6.4) * 8)));
        const snow = 1 - 0.97 * lock;
        const roll = (1 - lock) ** 2 * (SH + 2) * 2.5;
        const tear = (1 - lock) * 9;
        const hum = (u / LOOP + 0.45) % 1 * (SH + 6) - 3;
        for(let r = 0; r < rows; r++)for(let c = 0; c < cols; c++)g[r][c] = frame ? frame[r][c] : " ";
        if (frame) g[9][49] = "╱─╲│"[dial];
        for(let r = 0; r < SH; r++){
            const dim = 1 - 0.45 * Math.exp(-(((r - hum) / 2.2) ** 2));
            const line = 0.9 + 0.2 * hash(k, r, 9);
            const shift = Math.round(tear * Math.sin(r * 0.8 + u * 9) * hash(k >> 2, r, 3));
            const pr = Math.floor((r + roll) % (SH + 2));
            let prev = hash(k, r, 1);
            for(let c = 0; c < SW; c++){
                if (!inside(c, r)) {
                    g[Y0 + r][X0 + c] = " ";
                    continue;
                }
                const n = hash(k, r * 97 + c, 2);
                prev = 0.6 * n + 0.4 * prev;
                let ch;
                const noisy = hash(k, r * 97 + c, 5) < snow;
                if (noisy && hash(k, r * 97 + c, 6) >= lock ** 6) {
                    const v = prev * line * dim;
                    let level = 0;
                    while(level < SNOW.length && v > SNOW[level])level++;
                    ch = ink(level, paper);
                } else {
                    const pc = ((c + shift) % SW + SW) % SW;
                    let x = pr < SH ? card[pr][pc] : 0;
                    if (noisy && typeof x === "number") x = Math.max(0, Math.min(N, x + (n < 0.5 ? -1 : 1)));
                    ch = typeof x === "number" ? ink(x, paper) : x;
                }
                g[Y0 + r][X0 + c] = ch;
            }
        }
        return g.map((row)=>row.join("")).join("\n");
    };
}
