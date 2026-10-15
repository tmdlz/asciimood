// synthwave — from ascii.rest by bas3line, MIT License (see LICENSE)
export const meta = {
    name: "synthwave",
    category: "effects",
    note: "a grid rolling toward a striped sun behind a mountain ridge",
    cols: 65,
    rows: 28,
    fps: 20
};
const HZ = 12;
const SUN_R = 13;
const SUN_Y = 2 * HZ - 6;
const K = 24;
const FAR = 5;
const S = 0.7;
const RAILS = 6;
const SPEED = 0.9;
const LEVEL = [
    "▔",
    "─",
    "▁"
];
const mulberry32 = (a)=>()=>{
        a = a + 0x6d2b79f5 | 0;
        let t = Math.imul(a ^ a >>> 15, 1 | a);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
export default function synthwave() {
    const { cols, rows } = meta;
    const FR = rows - HZ;
    const cx = cols / 2, MID = Math.floor(cx);
    const g = Array.from({
        length: rows
    }, ()=>new Array(cols));
    const rand = mulberry32(5);
    const H = [
        6
    ];
    for(let c = 1; c <= cols; c++){
        const d = Math.abs(c - cx) / cx;
        const want = 1 + 6 * (d - 0.25) + 1.5 * Math.sin(c * 0.45);
        const h = H[c - 1];
        const r = rand();
        let step = r < 0.6 ? Math.sign(Math.round(want - h)) : r < 0.8 ? 1 : -1;
        if (d < 0.25) step = h > 0 ? -1 : 0;
        else if (h + step < 0 || h + step > 7) step = 0;
        H.push(h + step);
    }
    const stars = [];
    for(let i = 0; i < 24; i++)stars.push([
        Math.floor(rand() * cols),
        Math.floor(rand() * (HZ - 3)),
        rand()
    ]);
    const band = (k)=>0.2 * k + 0.3 * k * k / 26;
    const sun = (c, p, s)=>{
        const dx = c + 0.5 - cx, dy = p + 0.5 - SUN_Y;
        if (dx * dx + dy * dy > SUN_R * SUN_R) return 0;
        const k = p - (SUN_Y - 7);
        if (k < 0) return 1;
        return Math.floor(band(k + 1) - s) === Math.floor(band(k) - s) ? 1 : 0;
    };
    const count = new Array(FR), level = new Array(FR);
    const both = (row, c, l, r)=>{
        if (c >= 0 && c < cols) row[c] = l;
        if (2 * MID - c >= 0 && 2 * MID - c < cols) row[2 * MID - c] = r;
    };
    return (t)=>{
        for(let r = 0; r < rows; r++)g[r].fill(" ");
        for (const [c, r, p] of stars){
            const tw = Math.sin(t * (0.8 + p) + p * 30);
            g[r][c] = tw > 0.6 ? p < 0.3 ? "+" : "·" : tw > -0.4 ? "." : " ";
        }
        const s = t * 0.6;
        for(let r = 0; r < HZ; r++)for(let c = 0; c < cols; c++){
            const top = sun(c, 2 * r, s), bot = sun(c, 2 * r + 1, s);
            if (top || bot) g[r][c] = " ▀▄█"[top + 2 * bot];
        }
        for(let c = 0; c < cols; c++){
            const a = H[c], b = H[c + 1];
            if (!a && !b) continue;
            const top = HZ - 1 - Math.min(a, b);
            g[top][c] = b > a ? "/" : b < a ? "\\" : "_";
            for(let r = top + 1; r < HZ; r++)g[r][c] = " ";
        }
        const n0 = t * SPEED % 1;
        count.fill(0);
        for(let n = 1; n < 400; n++){
            const e = K / (n - n0);
            if (e >= FR) continue;
            if (e < 1) break;
            const y = Math.floor(e);
            count[y]++;
            level[y] = Math.min(2, Math.floor(e % 1 * 3));
        }
        const kind = count.map((k, y)=>y === 0 ? "░" : y === 1 ? "═" : y < FAR ? "─" : k > 1 ? "═" : k ? LEVEL[level[y]] : " ");
        const VX = MID + 0.5;
        for(let y = 0; y < FR; y++){
            const row = g[HZ + y], k = kind[y];
            row.fill(k);
            if (y === 0) continue;
            row[MID] = k === "─" ? "┼" : k === "═" ? "╪" : "│";
            const every = S * (y + 0.5) >= 2.4 ? 1 : 2 * S * (y + 0.5) >= 2.4 ? 2 : 4;
            for(let m = every; m <= RAILS; m += every){
                const sl = m * S, xt = VX - sl * y, xb = VX - sl * (y + 1);
                if (xt < 0) break;
                if (sl < 1.3) {
                    const c = Math.floor(VX - sl * (y + 0.5));
                    both(row, c, "/", "\\");
                    continue;
                }
                const hi = Math.floor(xt - 1e-6), lo = Math.floor(xb);
                if (k === " " && y >= m) for(let c = Math.max(0, lo + 1); c < hi; c++)both(row, c, "_", "_");
                both(row, hi, "/", "\\");
            }
        }
        return g.map((row)=>row.join("")).join("\n");
    };
}
