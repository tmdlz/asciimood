// sierpinski — from ascii.rest by bas3line, MIT License (see LICENSE)
export const meta = {
    name: "sierpinski",
    category: "generative",
    note: "the chaos game filling a sierpinski triangle point by point",
    cols: 59,
    rows: 26,
    fps: 20
};
const QUAD = " ▘▝▀▖▌▞▛▗▚▐▜▄▙▟█";
const CYCLE = 9.6;
const FILL = 6;
const HOLD = 7.3;
const CLEAR = 9.3;
const START = 6.1;
const POINTS = 12000;
const RATE = 1;
const STEADY = 60;
const DEPTH = 7;
function mulberry32(seed) {
    let s = seed | 0;
    return ()=>{
        s = s + 0x6d2b79f5 | 0;
        let t = Math.imul(s ^ s >>> 15, 1 | s);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}
export default function sierpinski() {
    const { cols, rows } = meta;
    const W = cols * 2, H = rows * 2;
    const top = 2, base = H - 2;
    const half = (base - top) / Math.sin(Math.PI / 3);
    const corners = [
        [
            cols,
            top
        ],
        [
            cols - half,
            base
        ],
        [
            cols + half,
            base
        ]
    ];
    const place = (x, y)=>{
        const v = (y - top) / (base - top), s = (x - cols) / half;
        const w = [
            1 - v,
            (v - s) / 2,
            (v + s) / 2
        ];
        if (w[0] < 0 || w[1] < 0 || w[2] < 0) return -1;
        let p = [
            1,
            0,
            2
        ], at = 0, step = 1;
        for(let l = 0; l < DEPTH; l++){
            const k = w.findIndex((x)=>x >= 0.5);
            if (k < 0) return -1;
            for(let j = 0; j < 3; j++)w[j] = j === k ? 2 * w[j] - 1 : 2 * w[j];
            const i = p.indexOf(k);
            at += i * (step /= 3);
            p = i === 0 ? [
                p[0],
                p[2],
                p[1]
            ] : i === 2 ? [
                p[1],
                p[0],
                p[2]
            ] : p;
        }
        return at;
    };
    const rank = new Float32Array(W * H).fill(-1);
    for(let qy = 0; qy < H; qy++)for(let qx = 0; qx < W; qx++){
        let n = 0, first = 2;
        for(let i = 0; i < 16; i++){
            const at = place(qx + ((i & 3) + 0.5) / 4, qy + ((i >> 2) + 0.5) / 4);
            if (at >= 0) n++, first = Math.min(first, at);
        }
        if (n >= 2) rank[qx + qy * W] = first;
    }
    const first = new Int32Array(W * H);
    let cycle = -1;
    const build = (k)=>{
        const rand = mulberry32(k * 977 + 31);
        first.fill(POINTS - 1);
        let [x, y] = corners[rand() * 3 | 0];
        for(let n = 0; n < POINTS; n++){
            const [cx, cy] = corners[rand() * 3 | 0];
            x = (x + cx) / 2;
            y = (y + cy) / 2;
            const at = Math.floor(x) + Math.floor(y) * W;
            if (first[at] > n) first[at] = n;
        }
    };
    const scale = (POINTS - STEADY * FILL) / (Math.exp(RATE * FILL) - 1);
    const marks = corners.map(([x, y], i)=>Math.floor((x + [
            0,
            1,
            -1
        ][i]) / 2) + Math.floor((y + (i ? -1 : 1)) / 2) * cols);
    return (t)=>{
        const u = t + START;
        const k = Math.floor(u / CYCLE);
        if (k !== cycle) build(cycle = k);
        const tau = u - k * CYCLE;
        const shown = tau >= FILL ? POINTS : Math.floor(STEADY * tau + scale * (Math.exp(RATE * tau) - 1));
        const gone = tau <= HOLD ? 0 : (tau - HOLD) / (CLEAR - HOLD);
        const on = (qx, qy)=>{
            const at = qx + qy * W;
            return Number(rank[at] >= gone && first[at] < shown);
        };
        const marked = tau < FILL || tau >= CLEAR;
        const lines = [];
        for(let r = 0; r < rows; r++){
            let line = "";
            for(let c = 0; c < cols; c++){
                const qx = c * 2, qy = r * 2;
                const m = on(qx, qy) | on(qx + 1, qy) << 1 | on(qx, qy + 1) << 2 | on(qx + 1, qy + 1) << 3;
                line += m ? QUAD[m] : marked && marks.includes(c + r * cols) ? "·" : " ";
            }
            lines.push(line);
        }
        return lines.join("\n");
    };
}
