// pond-ripples — from ascii.rest by bas3line, MIT License (see LICENSE)
export const meta = {
    name: "pond ripples",
    category: "physics",
    note: "raindrops opening rings that cross and fade on a pond",
    cols: 64,
    rows: 20,
    fps: 20
};
const CW = 0.6, CH = 1.2;
const START = 7.35;
const EVERY = 1.5;
const LIFE = 4;
const SPEED = 2.6;
const WAVE = 1.5;
function rand(i, salt) {
    let h = Math.imul(i ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(salt + 1, 0xc2b2ae35);
    h = Math.imul(h ^ h >>> 15, 0x2c1b3c6d);
    h = Math.imul(h ^ h >>> 12, 0x297a2d39);
    return ((h ^ h >>> 15) >>> 0) / 4294967296;
}
function ellipse(cols, rows, x0, y0, ax, ay, put, small = true) {
    const [flat, steep] = small ? [
        1.05,
        1.25
    ] : [
        0.9,
        1.1
    ];
    for(let c = 0; c < cols; c++){
        const x = ((c + 0.5) * CW - x0) / ax;
        if (Math.abs(x) >= 1) continue;
        const s = Math.sqrt(1 - x * x);
        if (ay / ax * Math.abs(x) / s > flat) continue;
        for (const sign of [
            -1,
            1
        ]){
            const y = (y0 + sign * ay * s) / CH, r = Math.floor(y), f = y - r;
            if (r >= 0 && r < rows) put(r * cols + c, f < 0.3 ? "'" : f < 0.6 ? "-" : f < 0.85 ? "." : "_", Math.atan2(sign * s, x));
        }
    }
    for(let r = 0; r < rows; r++){
        const y = ((r + 0.5) * CH - y0) / ay;
        if (Math.abs(y) >= 1) continue;
        const s = Math.sqrt(1 - y * y), lean = ax / ay * Math.abs(y) / s;
        if (lean > steep) continue;
        for (const sign of [
            -1,
            1
        ]){
            const c = Math.floor((x0 + sign * ax * s) / CW);
            const mark = lean < 0.45 ? sign < 0 ? "(" : ")" : sign < 0 === y < 0 ? "/" : "\\";
            if (c >= 0 && c < cols) put(r * cols + c, mark, Math.atan2(y, sign * s));
        }
    }
}
export default function pondRipples() {
    const { cols, rows } = meta;
    const N = cols * rows;
    const CX = cols * CW / 2, CY = rows * CH / 2;
    const AX = CX - 1.2, AY = CY - 1.12;
    const bank = new Array(N).fill("");
    ellipse(cols, rows, CX, CY, AX, AY, (i, m)=>bank[i] = m, false);
    const open = (x, y)=>{
        const e = Math.min(1, Math.max(0, (1 - ((x - CX) / AX) ** 2 - ((y - CY) / AY) ** 2) / 0.35));
        return e * e * (3 - 2 * e);
    };
    const drops = (t)=>{
        const out = [];
        for(let i = Math.floor((t - LIFE) / EVERY) - 1; i <= Math.floor(t / EVERY) + 1; i++){
            const age = t - (i + 0.7 * (rand(i, 0) - 0.5)) * EVERY;
            if (age < 0 || age > LIFE) continue;
            const r = 0.62 * Math.sqrt(rand(i, 1)), p = 2 * Math.PI * rand(i, 2);
            out.push({
                x: CX + AX * r * Math.cos(p),
                y: CY + AY * r * Math.sin(p),
                age,
                a: 0.8 + 0.2 * rand(i, 3)
            });
        }
        return out.sort((p, q)=>q.age - p.age);
    };
    const ink = new Array(N), level = new Uint8Array(N), owner = new Int16Array(N);
    return (time)=>{
        const t = START + time;
        ink.fill(" "), level.fill(0), owner.fill(-1);
        const kind = (m)=>"'-._".includes(m) ? 0 : "()".includes(m) ? 1 : m === "/" ? 2 : 3;
        const draw = (i, mark, lv, who)=>{
            if (lv === 3 && level[i] === 3 && owner[i] !== who && kind(ink[i]) !== kind(mark)) ink[i] = "x", level[i] = 4;
            else if (lv >= level[i] && level[i] < 4) ink[i] = mark, level[i] = lv, owner[i] = who;
        };
        drops(t).forEach((dp, who)=>{
            const c0 = Math.floor(dp.x / CW), r0 = Math.floor(dp.y / CH), at = r0 * cols + c0;
            if (dp.age < 0.15) return draw(at, "o", 3, who);
            if (dp.age < 0.4) return draw(at - 1, "(", 3, who), draw(at + 1, ")", 3, who);
            const R = 0.5 + SPEED * dp.age, life = dp.a * (1 - dp.age / LIFE);
            ellipse(cols, rows, dp.x, dp.y, R, R, (i, mark, ang)=>{
                const near = open((i % cols + 0.5) * CW, (Math.floor(i / cols) + 0.5) * CH);
                if (life > 0.45 && near > 0.6) draw(i, mark, 3, who);
                else if (life > 0.2 && near > 0.45 && Math.floor((ang + Math.PI) * R / 0.9) % 2) draw(i, mark === "_" || mark === "." ? "." : "·", 2, who);
            });
            const r2 = R - WAVE;
            if (life > 0.55 && r2 > 1.4) ellipse(cols, rows, dp.x, dp.y, r2, r2, (i, _mark, ang)=>{
                if (Math.floor((ang + Math.PI) * r2 / 1.1) % 2) draw(i, "·", 1, who);
            });
        });
        const lines = [];
        for(let r = 0; r < rows; r++){
            let line = "";
            for(let c = 0; c < cols; c++)line += bank[r * cols + c] || ink[r * cols + c];
            lines.push(line);
        }
        return lines.join("\n");
    };
}
