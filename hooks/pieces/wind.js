// wind — from ascii.rest by bas3line, MIT License (see LICENSE)
export const meta = {
    name: "wind",
    category: "nature",
    note: "gusts streaming along bending lines, curling at the head",
    cols: 64,
    rows: 14,
    fps: 15
};
const GAP = 2;
const BAR = "▔─▁";
const END = "'·.";
const MIN = 8;
const TIP = 14;
const CURL = 16;
const MAX_CURLS = 3;
const FLAT = 4;
const hash = (x, y, z)=>{
    let h = Math.imul(x, 0x27d4eb2d) ^ Math.imul(y, 0x165667b1) ^ Math.imul(z, 0x2545f491);
    h = Math.imul(h ^ h >>> 15, 0x85ebca6b);
    h = Math.imul(h ^ h >>> 13, 0xc2b2ae35);
    return ((h ^ h >>> 16) >>> 0) / 4294967296;
};
const ease = (t)=>t * t * (3 - 2 * t);
const mix = (a, b, t)=>a + (b - a) * t;
function noise(x, y, z) {
    const i = Math.floor(x), j = Math.floor(y), k = Math.floor(z);
    const u = ease(x - i), v = ease(y - j), w = ease(z - k);
    const n = (a, b, c)=>hash(i + a, j + b, k + c);
    return mix(mix(mix(n(0, 0, 0), n(1, 0, 0), u), mix(n(0, 1, 0), n(1, 1, 0), u), v), mix(mix(n(0, 0, 1), n(1, 0, 1), u), mix(n(0, 1, 1), n(1, 1, 1), u), v), w);
}
const psi = (x, y, t)=>y + 5 * (noise(x * 0.04 - t * 0.05, y * 0.18, t * 0.02) + 0.35 * noise(x * 0.07 + 4, y * 0.4, t * 0.04));
export default function wind() {
    const { cols, rows } = meta;
    const g = Array.from({
        length: rows
    }, ()=>new Array(cols));
    const gusts = (k, t)=>{
        const mask = new Uint8Array(cols), spans = [];
        for(let c = 0, from = -1; c <= cols; c++){
            const on = c < cols && noise(c * 0.09 - t * 0.5, k * 1.7, t * 0.05) * Math.min(1, (c + 1) / 8, (cols - c) / 8) > 0.5;
            if (on && from < 0) from = c;
            if (!on && from >= 0) {
                if (c - from >= MIN) {
                    mask.fill(2, from, c);
                    if (c - from >= TIP) mask[from] = 1;
                    spans.push([
                        from,
                        c - 1
                    ]);
                }
                from = -1;
            }
        }
        return {
            mask,
            spans,
            row: new Int16Array(cols).fill(-1),
            cells: []
        };
    };
    const free = (r, c)=>r >= 0 && r < rows && c >= 0 && c < cols && g[r][c] === " ";
    return (t)=>{
        for (const row of g)row.fill(" ");
        const lines = [];
        for(let c = 0; c < cols; c++){
            let was = Math.floor(psi(c + 0.5, 0, t) / GAP);
            for(let j = 0; j < rows * 3; j++){
                const now = Math.floor(psi(c + 0.5, (j + 1) / 3, t) / GAP), k = Math.max(now, was), same = now === was;
                was = now;
                if (same) continue;
                const line = lines[k] ??= gusts(k, t);
                if (line.row[c] < 0) line.row[c] = Math.floor(j / 3);
                const on = line.mask[c];
                if (on) g[Math.floor(j / 3)][c] = (on === 1 ? END : BAR)[j % 3], line.cells.push(c, Math.floor(j / 3));
            }
        }
        for (const line of lines){
            if (!line) continue;
            const { cells } = line;
            let i = 0;
            for (const [from, to] of line.spans){
                while(i < cells.length && cells[i] < from)i += 2;
                let n = i;
                while(n < cells.length && cells[n] <= to)n += 2;
                if (n - i <= 10) for(let k = i; k < n; k += 2)g[cells[k + 1]][cells[k]] = " ";
                i = n;
            }
        }
        const heads = [];
        lines.forEach((line, k)=>{
            for (const [from, to] of line.spans)if (to - from + 1 >= CURL && line.row[to] >= 0) heads.push([
                to - from,
                k,
                to
            ]);
        });
        heads.sort((a, b)=>b[0] - a[0]);
        const curls = [];
        const room = (r, to, d)=>{
            if (!free(r + d, to - 2) || !free(r, to + 1)) return false;
            for (const rr of [
                r + d,
                r + 2 * d
            ])for(let c = to - 5; c <= to + 2; c++)if (rr >= 0 && rr < rows && c >= 0 && c < cols && g[rr][c] !== " ") return false;
            return true;
        };
        for (const [, k, to] of heads){
            const line = lines[k], r = line.row[to], d = k % 2 ? 1 : -1;
            if (curls.length >= MAX_CURLS || to < FLAT + 2 || r + d < 0 || r + d >= rows) continue;
            let level = true;
            for(let c = to - FLAT; c < to; c++)if (line.row[c] !== r || !BAR.includes(g[r][c])) level = false;
            if (!level || !room(r, to, d)) continue;
            if (curls.some(([cr, cc])=>Math.abs(cr - r) < 5 && Math.abs(cc - to) < 16)) continue;
            curls.push([
                r,
                to
            ]);
            for(let c = to - FLAT; c < to; c++)g[r][c] = "─";
            g[r][to] = d > 0 ? "╮" : "╯";
            g[r + d][to] = d > 0 ? "╯" : "╮";
            g[r + d][to - 1] = "─";
            g[r + d][to - 2] = d > 0 ? "╰" : "╭";
        }
        return g.map((row)=>row.join("")).join("\n");
    };
}
