// flag — from ascii.rest by bas3line, MIT License (see LICENSE)
export const meta = {
    name: "flag",
    category: "physics",
    note: "a striped flag rippling on a pole, folds catching the light",
    cols: 62,
    rows: 21,
    fps: 30,
    options: {
        stripes: 5
    }
};
const RAMP = " .:-=+*#%@";
const RISE = "▁▂▃▄▅▆▇";
const LOOP = 12;
const WAVES = 2.3;
const RATE = 17 / LOOP;
const SKEW = 1.4;
const LONG = 29;
const HIGH = 13;
const SWING = 4;
const STRIPS = 300;
export default function flag({ stripes = 5 } = {}) {
    const { cols, rows } = meta;
    const POLE = 4;
    const TOP = 2.5;
    const bands = Math.max(2, Math.round(stripes));
    const xs = new Float64Array((STRIPS + 1) * rows);
    const lit = new Float32Array(cols * rows);
    const hits = new Uint16Array(cols * rows);
    const odd = new Uint16Array(cols * rows);
    const cover = new Float32Array(cols * rows);
    const out = new Array(cols * rows);
    return (t, { paper = false } = {})=>{
        const gust = 0.85 + 0.15 * Math.sin(2 * Math.PI * t / LOOP);
        const ph = (u, v)=>2 * Math.PI * (WAVES * u - RATE * t) - SKEW * v;
        const z = (u, v)=>gust * SWING * u * Math.sin(ph(u, v));
        const dz = (u, v)=>gust * SWING * (Math.sin(ph(u, v)) + u * 2 * Math.PI * WAVES * Math.cos(ph(u, v))) / LONG;
        for(let r = 0; r < rows; r++){
            const v = Math.min(1, Math.max(0, (r + 0.5 - TOP) / HIGH));
            xs[r] = POLE + 1;
            for(let i = 1; i <= STRIPS; i++){
                const w = 2 * LONG / STRIPS / Math.hypot(1, dz((i - 0.5) / STRIPS, v));
                xs[i * rows + r] = xs[(i - 1) * rows + r] + w;
            }
        }
        lit.fill(0), hits.fill(0), odd.fill(0), cover.fill(0);
        for(let i = 0; i <= STRIPS; i++){
            const u = i / STRIPS;
            const zm = z(u, 0.5);
            const h = HIGH * (1 + 0.04 * zm) - 0.8 * u;
            const top = TOP + 1.2 * u * u + 0.8 * u * gust * Math.sin(ph(u, 0.5) + 0.8) - (h - HIGH) / 2;
            for(let r = Math.max(0, Math.floor(top)); r < Math.min(rows, top + h); r++){
                const c = Math.floor(xs[i * rows + r]);
                if (c >= cols) continue;
                const k = r * cols + c;
                const v = Math.min(1, Math.max(0, (r + 0.5 - top) / h));
                const s = dz(u, v);
                lit[k] += Math.max(0, Math.min(1, (0.95 * s + 0.65) / Math.hypot(1, s) + 0.1));
                hits[k]++;
                odd[k] += Math.floor(v * bands * 0.9999) % 2;
                cover[k] = Math.max(cover[k], Math.min(r + 1, top + h) - Math.max(r, top));
            }
        }
        out.fill(" ");
        for(let k = 0; k < cols * rows; k++){
            if (!hits[k]) continue;
            const f = cover[k];
            const below = k + cols < cols * rows && cover[k + cols] > 0.94;
            if (f < 0.8 && below) {
                out[k] = RISE[Math.min(6, Math.floor(f * 8))];
                continue;
            }
            if (f < 0.7 && !below) {
                out[k] = f < 0.3 ? "▔" : "▀";
                continue;
            }
            const l = lit[k] / hits[k];
            const b = odd[k] * 2 > hits[k] ? 0.1 + 0.34 * l : 0.52 + 0.48 * l;
            const g = Math.max(1, Math.min(9, Math.round(b * 9)));
            out[k] = RAMP[paper ? 10 - g : g];
        }
        out[Math.floor(TOP - 1) * cols + POLE] = "o";
        for(let r = Math.floor(TOP); r < rows - 1; r++)out[r * cols + POLE] = "┃";
        for(let c = POLE - 3; c <= POLE + 3; c++)out[(rows - 1) * cols + c] = c === POLE ? "┸" : "▁";
        const lines = [];
        for(let r = 0; r < rows; r++)lines.push(out.slice(r * cols, (r + 1) * cols).join(""));
        return lines.join("\n");
    };
}
