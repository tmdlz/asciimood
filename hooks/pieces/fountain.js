// fountain — from ascii.rest by bas3line, MIT License (see LICENSE)
export const meta = {
    name: "fountain",
    category: "physics",
    note: "arcs of water from a nozzle falling as drops into a basin",
    cols: 57,
    rows: 22,
    fps: 30
};
const G = 30;
const RATE = 80;
const WATER = 17;
const NOZ = 6.5;
const T0 = 8;
const JETS = [
    [
        0,
        0,
        0.004,
        0.035,
        3
    ],
    [
        -17,
        -7,
        0.006,
        0.008,
        4
    ],
    [
        17,
        7,
        0.006,
        0.008,
        4
    ],
    [
        -42,
        -10.4,
        0.005,
        0.006,
        5
    ],
    [
        42,
        10.4,
        0.005,
        0.006,
        5
    ]
];
const TOP = 8.4;
const BASIN = [
    "▀".repeat(49),
    "\\" + "_".repeat(45) + "/",
    "|" + " ".repeat(13) + "|",
    "___|" + "_".repeat(13) + "|___"
];
const POST = [
    "_/^\\_",
    " |#| ",
    " |#| ",
    " |#| ",
    " |#| ",
    " |#| ",
    "_/#\\_"
];
const hash = (i, s)=>{
    let h = Math.imul(i ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(s + 1, 0xc2b2ae35);
    h = Math.imul(h ^ h >>> 15, 0x2c1b3c6d);
    h = Math.imul(h ^ h >>> 12, 0x297a2d39);
    return ((h ^ h >>> 15) >>> 0) / 4294967296;
};
const flight = (vy)=>(vy + Math.sqrt(vy * vy + 2 * G * NOZ)) / G;
export default function fountain() {
    const { cols, rows } = meta;
    const CX = Math.floor(cols / 2) + 0.5;
    const jets = JETS.map(([deg, land, wa, wv, keep], j)=>{
        const a = deg * Math.PI / 180;
        let v = Math.sqrt(2 * G * TOP);
        if (deg) {
            let lo = 1, hi = 60;
            for(let k = 0; k < 40; k++){
                v = (lo + hi) / 2;
                Math.abs(v * Math.sin(a) * flight(v * Math.cos(a))) < Math.abs(land) ? lo = v : hi = v;
            }
        }
        return {
            a,
            v,
            wa,
            wv,
            keep,
            j
        };
    });
    jets.push(jets.shift());
    const drop = (jet, i)=>{
        const s = jet.j * 7 + 1;
        const pulse = jet.j ? 1 : 0.95 + 0.05 * Math.sin(i / RATE * 1.2566);
        const a = jet.a + (hash(i, s) - 0.5) * 2 * jet.wa * Math.PI;
        const v = jet.v * pulse * (1 + (hash(i, s + 1) - 0.5) * 2 * jet.wv);
        const vx = v * Math.sin(a), vy = v * Math.cos(a);
        return {
            t0: (i + hash(i, s + 2) * 0.6) / RATE,
            vx,
            vy,
            end: flight(vy)
        };
    };
    return (time)=>{
        const t = T0 + time;
        const g = Array.from({
            length: rows
        }, ()=>new Array(cols).fill(" "));
        const solid = Array.from({
            length: rows
        }, ()=>new Array(cols).fill(false));
        const put = (c, r, ch)=>{
            if (r >= 0 && r < rows && c >= 0 && c < cols && !solid[r][c]) g[r][c] = ch;
        };
        const stamp = (art, r0)=>art.forEach((line, k)=>{
                const c0 = Math.floor(CX) - (line.length - 1) / 2;
                for(let c = 0; c < line.length; c++){
                    if (line[c] === " ") continue;
                    g[r0 + k][c0 + c] = line[c] === "#" ? " " : line[c];
                    solid[r0 + k][c0 + c] = true;
                }
            });
        stamp(BASIN, WATER + 1);
        stamp(POST, WATER - POST.length + 1);
        const rings = [], hits = [], crowns = [];
        for (const jet of jets){
            for(let i = Math.floor((t - 3.2) * RATE); i <= Math.ceil(t * RATE); i++){
                const d = drop(jet, i), age = t - d.t0;
                if (age < 0) continue;
                if (age >= d.end) {
                    const k = age - d.end, x = d.vx * d.end;
                    if (k < 1.4 && hash(i, jet.j + 60) < 0.018) rings.push([
                        x,
                        k
                    ]);
                    if (k < 0.07 && i % jet.keep === 0) hits.push(x);
                    if (k < 0.4 && hash(i, jet.j + 70) < 0.03) crowns.push([
                        x,
                        k,
                        i,
                        jet.j
                    ]);
                    continue;
                }
                const vy = d.vy - G * age;
                if (vy < 0 && i % jet.keep) continue;
                const row = WATER - NOZ - d.vy * age + G * age * age / 2;
                if (vy < 0 && !jet.j && row > WATER - NOZ - 1) continue;
                const speed = Math.hypot(d.vx, vy), ang = Math.atan2(vy, d.vx) * 180 / Math.PI;
                let ch;
                if (vy < 0) ch = speed > 17 ? ":" : "·";
                else if (!jet.j) ch = speed > 7 ? "|" : speed > 3 ? "·" : "°";
                else if (Math.abs(ang - 90) < 22) ch = "|";
                else if (ang < 28 || ang > 152) ch = row % 1 < 0.5 ? "-" : "_";
                else ch = ang < 90 ? "/" : "\\";
                put(Math.floor(CX + 2 * d.vx * age), Math.floor(row), ch);
            }
        }
        const lo = Math.floor(CX) - 23, hi = Math.floor(CX) + 23;
        for(let c = lo; c <= hi; c++){
            if (solid[WATER][c]) continue;
            const x = (c + 0.5 - CX) / 2;
            let h = 0;
            for (const [x0, k] of rings){
                const d = Math.abs(Math.abs(x - x0) - 0.5 - 2.6 * k);
                if (d < 0.4) h += (1 - d * 2.5) * (1 - k / 1.4);
            }
            g[WATER][c] = h > 0.3 ? "~" : "-";
        }
        for (const x of hits){
            const c = Math.floor(CX + 2 * x);
            if (c >= lo && c <= hi && !solid[WATER][c]) g[WATER][c] = "^";
        }
        for (const [x, k, i, j] of crowns){
            for (const side of [
                -1,
                1
            ]){
                const vx = side * (1.2 + hash(i, j + 40) * 1.4), vy = 7 + hash(i, j + 50 + side) * 4;
                const y = vy * k - G * k * k / 2;
                if (y <= 0.2) continue;
                put(Math.floor(CX + 2 * (x + vx * k)), Math.floor(WATER - y), vy - G * k > 0 ? "'" : ".");
            }
        }
        return g.map((row)=>row.join("")).join("\n");
    };
}
