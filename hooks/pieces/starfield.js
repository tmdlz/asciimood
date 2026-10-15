// starfield — from ascii.rest by bas3line, MIT License (see LICENSE)
export const meta = {
    name: "starfield",
    category: "space",
    note: "stars rush out from the centre and streak at the edges",
    cols: 64,
    rows: 24,
    fps: 30,
    options: {
        stars: 60,
        speed: 1
    }
};
const mulberry32 = (a)=>()=>{
        a = a + 0x6d2b79f5 | 0;
        let t = Math.imul(a ^ a >>> 15, 1 | a);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
export default function starfield({ stars = 60, speed = 1 } = {}) {
    const { cols, rows } = meta;
    const cx = cols / 2, cy = rows / 2;
    const F = 10;
    const NEAR = 0.04, FAR = 1.3, SEEN = 1.05;
    const SHUTTER = 0.16;
    const LIFE = 4 / speed;
    const rand = mulberry32(7);
    const phase = Array.from({
        length: stars
    }, ()=>rand());
    const grid = new Array(cols * rows);
    const order = new Array(stars);
    const place = (i, k)=>{
        const r = mulberry32(i * 7919 + k * 104729 + 13);
        const a = (i + r()) / stars * Math.PI * 2;
        const d = 0.25 + 0.75 * Math.sqrt(r());
        return [
            Math.cos(a) * d,
            Math.sin(a) * d
        ];
    };
    const put = (c, r, ch)=>{
        if (c < 0 || c >= cols || r < 0 || r >= rows) return;
        const k = c + r * cols;
        if (grid[k] === " ") grid[k] = ch;
    };
    return (t)=>{
        grid.fill(" ");
        for(let i = 0; i < stars; i++){
            const u = phase[i] + t / LIFE;
            const k = Math.floor(u);
            order[i] = [
                FAR - (FAR - NEAR) * (u - k),
                i,
                k
            ];
        }
        order.sort((a, b)=>a[0] - b[0]);
        for (const [z, i, k] of order){
            if (z > SEEN) continue;
            const [x, y] = place(i, k);
            const hx = cx + x / z * F, hy = cy + y / z * F * 0.5;
            const zt = z + SHUTTER;
            const c1 = Math.floor(hx), r1 = Math.floor(hy);
            const c0 = Math.floor(cx + x / zt * F), r0 = Math.floor(cy + y / zt * F * 0.5);
            put(c1, r1, z > 0.5 ? "." : z > 0.25 ? "+" : "*");
            if (z > 0.5) continue;
            const n = Math.max(Math.abs(c1 - c0), Math.abs(r1 - r0));
            const fade = Math.min(2, Math.floor(n / 3));
            for(let s = 0; s < n; s++){
                const c = Math.round(c0 + (c1 - c0) * s / n), r = Math.round(r0 + (r1 - r0) * s / n);
                const dc = Math.round(c0 + (c1 - c0) * (s + 1) / n) - c;
                const dr = Math.round(r0 + (r1 - r0) * (s + 1) / n) - r;
                const g = dr === 0 ? "-" : dc === 0 ? "|" : dc * dr > 0 ? "\\" : "/";
                put(c, r, s < fade ? "." : g);
            }
        }
        const lines = [];
        for(let r = 0; r < rows; r++)lines.push(grid.slice(r * cols, (r + 1) * cols).join(""));
        return lines.join("\n");
    };
}
