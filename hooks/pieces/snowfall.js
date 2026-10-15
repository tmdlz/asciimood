// snowfall — from ascii.rest by bas3line, MIT License (see LICENSE)
export const meta = {
    name: "snowfall",
    category: "nature",
    note: "snow swaying down, building drifts on the ground and a fence",
    cols: 64,
    rows: 22,
    fps: 20
};
const EIGHTHS = " ▁▂▃▄▅▆▇█";
const LINE = "▔─▁";
const POSTS = [
    9,
    20,
    31,
    42
];
const TOP = 10;
const RAILS = [
    11,
    14
];
const RAIL = 2;
const LAYERS = [
    {
        n: 44,
        v: 1.1,
        wind: 0.6,
        sway: 0.5,
        glyph: "."
    },
    {
        n: 30,
        v: 1.8,
        wind: 1.1,
        sway: 1,
        glyph: "+"
    },
    {
        n: 13,
        v: 2.8,
        wind: 1.8,
        sway: 1.6,
        glyph: "*"
    }
];
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
export default function snowfall() {
    const { cols, rows } = meta;
    const rand = mulberry32(7);
    const ground = Float64Array.from({
        length: cols
    }, (_, c)=>{
        const lee = 3.6 * smooth(36, 55, c) * (1 - smooth(55, 59, c));
        return 1 + 0.55 * Math.sin(c * 0.19 + 1.3) + 0.3 * Math.sin(c * 0.47 + 0.4) + lee;
    });
    const extra = new Float64Array(cols).fill(0.3);
    const wind = Float64Array.from({
        length: cols
    }, (_, c)=>0.7 + 1.6 * Math.exp(-(((c - 52) / 7) ** 2)));
    const rail = RAILS.map((_, k)=>Float64Array.from({
            length: cols
        }, (_, c)=>2 + 0.7 * Math.sin(c * 0.45 + k * 2) + 0.4 * rand()));
    const cap = new Float64Array(POSTS.length).fill(7);
    const inFence = (c)=>c > POSTS[0] && c < POSTS[POSTS.length - 1];
    const flakes = [];
    const spawn = (f, top)=>{
        f.x = rand() * cols;
        f.y = top ? -rand() * 2 : rand() * rows;
        f.ph = rand() * 6.283;
        f.w = 0.8 + rand() * 0.45;
    };
    LAYERS.forEach((L, li)=>{
        for(let i = 0; i < L.n; i++){
            const f = {
                li
            };
            spawn(f, false);
            flakes.push(f);
        }
    });
    const step = (dt, t)=>{
        for (const f of flakes){
            const L = LAYERS[f.li];
            const y0 = f.y;
            f.y += L.v * f.w * dt;
            f.x = ((f.x + (L.wind + L.sway * Math.cos(t * f.w * 1.3 + f.ph)) * dt) % cols + cols) % cols;
            const c = Math.floor(f.x);
            if (f.li === 1) {
                const k = RAILS.findIndex((r)=>y0 < r + 0.5 && f.y >= r + 0.5);
                if (k >= 0 && inFence(c) && !POSTS.includes(c) && rand() < 0.7) {
                    for (const [d, a] of [
                        [
                            -1,
                            0.3
                        ],
                        [
                            0,
                            0.6
                        ],
                        [
                            1,
                            0.3
                        ]
                    ])rail[k][c + d] = Math.min(5, rail[k][c + d] + a);
                    spawn(f, true);
                    continue;
                }
                const p = POSTS.indexOf(c);
                if (p >= 0 && y0 < TOP && f.y >= TOP) {
                    cap[p] = Math.min(13, cap[p] + 1);
                    spawn(f, true);
                    continue;
                }
            }
            if (f.y < rows - ground[c] - extra[c]) continue;
            if (f.li > 0) extra[c] += 0.3 * wind[c];
            spawn(f, true);
        }
        const next = Float64Array.from(extra, (e, c)=>e + 1.5 * dt * ((extra[c - 1] ?? e) + (extra[c + 1] ?? e) - 2 * e));
        for(let c = 0; c < cols; c++)extra[c] = next[c] * (1 - 0.02 * dt);
        for (const r of rail)for(let c = 0; c < cols; c++)r[c] -= r[c] * 0.004 * dt;
        for(let p = 0; p < cap.length; p++)cap[p] -= cap[p] * 0.01 * dt;
    };
    for(let i = 0; i < 400; i++)step(0.05, i * 0.05);
    let last = 0;
    return (time, { paper = false } = {})=>{
        let dt = Math.min(0.1, Math.max(0, time - last));
        last = time;
        for(; dt > 1e-9; dt -= 0.05)step(Math.min(dt, 0.05), 20 + time);
        const g = Array.from({
            length: rows
        }, ()=>new Array(cols).fill(" "));
        const draw = (li)=>{
            for (const f of flakes){
                const r = Math.floor(f.y), c = Math.floor(f.x);
                if (f.li !== li || r < 0 || r >= rows) continue;
                const k = LAYERS.findIndex((L)=>L.glyph === g[r][c]);
                if (g[r][c] === " " || k >= 0 && k < li) g[r][c] = LAYERS[li].glyph;
            }
        };
        draw(0);
        RAILS.forEach((r, k)=>{
            for(let c = POSTS[0] + 1; c < POSTS[POSTS.length - 1]; c++)g[r][c] = EIGHTHS[RAIL + Math.floor(rail[k][c])];
        });
        POSTS.forEach((c, p)=>{
            for(let r = TOP; r < rows; r++)g[r][c] = "┃";
            const n = Math.floor(cap[p]);
            g[TOP - 1][c] = EIGHTHS[Math.min(8, 1 + Math.floor(n / 2))];
            if (n > 8) g[TOP - 1][c - 1] = g[TOP - 1][c + 1] = EIGHTHS[n - 8];
        });
        const top = Array.from({
            length: cols
        }, (_, c)=>rows - ground[c] - extra[c]);
        for(let c = 0; c < cols; c++){
            const s = top[c], r = Math.floor(s), f = s - r;
            for(let rr = r + 1; rr < rows; rr++)g[rr][c] = paper ? "░" : "█";
            if (paper) g[r][c] = LINE[Math.min(2, Math.floor(f * 3))];
            else {
                g[r][c] = EIGHTHS[Math.max(1, Math.round((1 - f) * 8))];
            }
        }
        if (paper) for(let c = 0; c + 1 < cols; c++){
            const a = Math.floor(top[c]), b = Math.floor(top[c + 1]);
            for(let r = a + 1; r < b; r++)g[r][c + 1] = "▏";
            for(let r = b + 1; r < a; r++)g[r][c] = "▕";
        }
        draw(1);
        draw(2);
        return g.map((row)=>row.join("")).join("\n");
    };
}
