// fireworks — from ascii.rest by bas3line, MIT License (see LICENSE)
export const meta = {
    name: "fireworks",
    category: "effects",
    note: "shells climb and burst as peonies, rings, willows and palms",
    cols: 64,
    rows: 24,
    fps: 30
};
const G = 13;
const EVERY = 1.25;
const KINDS = [
    "peony",
    "willow",
    "ring",
    "palm",
    "saturn",
    "peony",
    "willow",
    "ring",
    "palm"
];
const SPOTS = [
    0.3,
    0.68,
    0.45,
    0.25,
    0.62,
    0.36,
    0.72
];
const OPEN = 0.55;
function mulberry32(seed) {
    let s = seed | 0;
    return ()=>{
        s = s + 0x6d2b79f5 | 0;
        let t = Math.imul(s ^ s >>> 15, 1 | s);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}
function streak(dx, dy) {
    let a = Math.atan2(dy, dx);
    if (a < 0) a += Math.PI;
    return a < 0.42 || a > 2.72 ? "-" : a < 1.2 ? "/" : a < 1.94 ? "|" : "\\";
}
function shell(i, cols, H) {
    const r = mulberry32(i * 7919 + 17);
    const pick = (list)=>list[(i % list.length + list.length) % list.length];
    const s = {
        kind: pick(KINDS),
        at: i * EVERY + r() * 0.25,
        x0: cols * (pick(SPOTS) + (r() - 0.5) * 0.05),
        drift: (r() - 0.5) * 2,
        rise: 1 + r() * 0.2,
        top: H * (0.62 + r() * 0.08),
        sparks: []
    };
    const add = (vx, vy, o)=>s.sparks.push({
            vx,
            vy,
            k: 2.2,
            life: 1.7,
            seed: r() * 1e9 | 0,
            ...o
        });
    const sphere = (count, speed, o, deep = true)=>{
        const turn = r() * 6.283;
        for(let j = 0; j < count; j++){
            const a = turn + (j + 0.5) / count * 6.283;
            const inner = deep && j % 3 === 1;
            const reach = inner ? 0.5 + 0.25 * (j * 7 % 5 / 4) : 0.94 + r() * 0.06;
            add(Math.cos(a) * speed * reach, Math.sin(a) * speed * reach, {
                inner,
                ...o
            });
        }
    };
    const ring = (count, speed, o, open)=>{
        const tilt = open + r() * 0.15, roll = (r() - 0.5) * 0.5;
        for(let j = 0; j < count; j++){
            const a = j / count * 6.283, x = Math.cos(a), y = Math.sin(a) * tilt;
            add((x * Math.cos(roll) - y * Math.sin(roll)) * speed, (x * Math.sin(roll) + y * Math.cos(roll)) * speed, o);
        }
    };
    if (s.kind === "peony") sphere(27, 33, {
        look: "peony"
    });
    else if (s.kind === "willow") sphere(15, 30, {
        look: "willow",
        k: 2.1,
        life: 3.4
    }, false);
    else if (s.kind === "ring") ring(24, 28, {
        look: "ring",
        life: 1.5
    }, 0.3);
    else if (s.kind === "saturn") ring(24, 30, {
        look: "ring",
        life: 1.5
    }, 0.5), sphere(9, 10, {
        look: "core",
        life: 1.1
    });
    else {
        for(let j = 0; j < 7; j++){
            const a = Math.PI / 2 + (j - 3) / 3 * 1.15 + (r() - 0.5) * 0.08;
            add(Math.cos(a) * 36, Math.sin(a) * 36, {
                look: "palm",
                k: 2.2,
                life: 1.9
            });
        }
    }
    return s;
}
export default function fireworks() {
    const { cols, rows } = meta;
    const H = rows * 2;
    const grid = new Array(cols * rows);
    const cache = new Map();
    const get = (i)=>{
        if (!cache.has(i)) cache.set(i, shell(i, cols, H));
        return cache.get(i);
    };
    const cell = (x, y)=>{
        const c = Math.floor(x), r = Math.floor(rows - y / 2);
        return c >= 0 && c < cols && r >= 0 && r < rows ? c + r * cols : -1;
    };
    const put = (x, y, ch)=>{
        const k = cell(x, y);
        if (k >= 0) grid[k] = ch;
    };
    const at = (s, p, b)=>{
        const e = (1 - Math.exp(-p.k * b)) / p.k;
        return [
            s.x0 + s.drift * s.rise + p.vx * e,
            s.top + p.vy * e - G / p.k * (b - e)
        ];
    };
    const back = (p, a, q)=>-Math.log(1 - q * (1 - Math.exp(-p.k * a))) / p.k;
    const stroke = (s, p, b0, b1, style)=>{
        if (b1 <= b0) return;
        const n = 24;
        let last = cell(...at(s, p, b1)), m = 0;
        for(let j = 1; j <= n; j++){
            const b = b1 - (b1 - b0) * j / n;
            const [x, y] = at(s, p, b), [nx, ny] = at(s, p, b + 0.01);
            const k = cell(x, y);
            if (k < 0 || k === last) continue;
            last = k;
            const g = style(j / n, nx - x, ny - y, m++);
            if (g) grid[k] = g;
        }
    };
    const lead = get(0).at + get(0).rise + OPEN;
    return (time)=>{
        grid.fill(" ");
        const t = time + lead;
        const tick = Math.floor(t * 30);
        const last = Math.floor(t / EVERY);
        for(let i = last - 4; i <= last; i++){
            const s = get(i);
            const age = t - s.at;
            if (age < 0) continue;
            if (age < s.rise) {
                const g = 2 * s.top / (s.rise * s.rise), v0 = g * s.rise;
                const pos = (a)=>[
                        s.x0 + s.drift * a,
                        v0 * a - g * a * a / 2
                    ];
                for(let j = 5; j >= 1; j--){
                    const a = age - j * 0.05;
                    if (a < 0 || (tick + j + i) % 3 === 0) continue;
                    const [x, y] = pos(a);
                    put(x + ((tick * 7 + j) % 3 - 1) * 0.4, y - j * 0.3, j > 3 ? "." : ":");
                }
                put(...pos(age), "|");
                continue;
            }
            const a = age - s.rise;
            const heads = [];
            for (const p of s.sparks){
                if (a > p.life) continue;
                const f = a / p.life;
                let h = Math.imul(p.seed ^ Math.imul(tick, 0x9e3779b1), 0x85ebca6b);
                h = ((h ^ h >>> 13) >>> 0) % 1000 / 1000;
                if (f > 0.7 && h < (f - 0.7) * 3) continue;
                if (a < 0.1) continue;
                const [x, y] = at(s, p, a);
                if (p.look === "peony") {
                    if (!p.inner && a < 0.75) stroke(s, p, Math.max(back(p, a, 0.6), a - 0.12), a, (_, dx, dy)=>streak(dx, dy));
                    heads.push([
                        x,
                        y,
                        a < 0.7 ? "*" : f < 0.6 ? "+" : "."
                    ]);
                } else if (p.look === "ring") {
                    if (a < 0.15) continue;
                    heads.push([
                        x,
                        y,
                        a < 0.3 || f > 0.6 ? "." : "o"
                    ]);
                } else if (p.look === "core") {
                    heads.push([
                        x,
                        y,
                        f < 0.5 ? "+" : "."
                    ]);
                } else if (p.look === "willow") {
                    stroke(s, p, Math.max(back(p, a, 0.45), a - 1.6), a, (u, dx, dy, m)=>u < 0.6 ? streak(dx, dy) : m % 2 ? "" : ".");
                    heads.push([
                        x,
                        y,
                        f < 0.25 ? "*" : "."
                    ]);
                } else {
                    stroke(s, p, Math.max(back(p, a, 0.45), a - 1), a, (u, dx, dy)=>u < 0.9 ? streak(dx, dy) : ".");
                    heads.push([
                        x,
                        y,
                        a < 0.2 ? "*" : a < 0.45 ? "@" : f < 0.75 ? "o" : "."
                    ]);
                }
            }
            for (const [x, y, g] of heads)put(x, y, g);
            if (a < 0.12) put(s.x0 + s.drift * s.rise, s.top, a < 0.06 ? "@" : "*");
        }
        for (const i of cache.keys())if (i < last - 5) cache.delete(i);
        const lines = [];
        for(let r = 0; r < rows; r++)lines.push(grid.slice(r * cols, (r + 1) * cols).join(""));
        return lines.join("\n");
    };
}
