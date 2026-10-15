// ruled-mountains — from ascii.rest by bas3line, MIT License (see LICENSE)
export const meta = {
    name: "ruled mountains",
    category: "nature",
    note: "ruled lines with a range rising from them, drifting forward",
    cols: 64,
    rows: 20,
    fps: 10
};
const N = 6;
const GAP = 3;
const AMP = [
    5,
    5.5,
    6,
    6.6,
    7.2,
    8
];
const SPEED = 0.2;
const START = 30;
const SLIVER = 3;
const PEAKS = [
    [
        -16,
        3,
        0.55,
        2,
        1,
        0,
        0.71,
        0.4,
        0.93,
        1.9
    ],
    [
        -5,
        3,
        0.85,
        3,
        2,
        -4,
        0.53,
        2.6,
        1.21,
        4.1
    ],
    [
        6,
        3,
        1,
        2,
        4,
        5,
        0.97,
        4.4,
        0.67,
        0.3
    ],
    [
        18,
        3,
        0.6,
        3,
        2,
        0,
        0.61,
        1.2,
        1.07,
        5.2
    ]
];
export default function ruledMountains() {
    const { cols, rows } = meta;
    const mid = cols / 2;
    const base = Array.from({
        length: N
    }, (_, i)=>rows - 1 - (N - 1 - i) * GAP);
    const f = new Float64Array(cols + 1);
    const e = new Int16Array(cols + 1);
    const g = Array.from({
        length: rows
    }, ()=>new Array(cols));
    const owner = Array.from({
        length: rows
    }, ()=>new Int8Array(cols));
    const horizon = new Int16Array(cols);
    const seen = new Int16Array(cols);
    const tent = (h, d, steep)=>h - (d < steep ? d : steep + (d - steep) / 2);
    const profile = (s, amp)=>{
        f.fill(0);
        for (const [lane, wander, tall, west, east, sub, fm, pm, fa, pa] of PEAKS){
            const m = mid + lane + wander * Math.sin(fm * s + pm);
            const h = amp * tall * (0.55 + 0.45 * Math.sin(fa * s + pa));
            for(let x = 0; x <= cols; x++){
                const d = x - m;
                let y = tent(h, Math.abs(d), d < 0 ? west : east);
                if (sub) y = Math.max(y, tent(h - 2, Math.abs(d - sub), 1.5));
                if (y > f[x]) f[x] = y;
            }
        }
        for(let x = 0; x <= cols; x++)e[x] = Math.max(0, Math.round(f[x]));
    };
    return (t, { paper = false } = {})=>{
        const shade = paper ? -1 : 1;
        for (const row of g)row.fill(" ");
        for (const row of owner)row.fill(-1);
        horizon.fill(rows);
        for(let i = N - 1; i >= 0; i--){
            const R = base[i];
            profile((i - (START + t) * SPEED) * 0.9, AMP[i]);
            for(let c = 0; c < cols; c++){
                const a = e[c], b = e[c + 1];
                const r = R - Math.max(a, b) + (a === b ? 0 : 1);
                seen[c] = r >= 0 && r < horizon[c] ? r : -1;
            }
            for(let c = 0; c < cols; c++){
                const r = seen[c];
                if (r < 0) continue;
                let n = c, m = c;
                while(n > 0 && seen[n - 1] >= 0)n--;
                while(m < cols - 1 && seen[m + 1] >= 0)m++;
                const a = e[c], b = e[c + 1], below = horizon[c];
                const ch = b > a ? "/" : b < a ? "\\" : "_";
                horizon[c] = r;
                if (m - n + 1 < SLIVER && n > 0 && m < cols - 1) continue;
                if (ch !== "_" && (owner[r][c - 1] > i || owner[r][c + 1] > i)) continue;
                if (ch !== "_" && [
                    c - 2,
                    c + 2
                ].some((k)=>owner[r][k] > i && g[r][k] === ch)) continue;
                g[r][c] = ch;
                owner[r][c] = i;
                if (Math.sign(b - a) === shade) for(let k = r + 1; k <= R && k < below; k++)g[k][c] = ".";
            }
        }
        return g.map((row)=>row.join("")).join("\n");
    };
}
