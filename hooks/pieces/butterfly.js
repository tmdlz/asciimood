// butterfly — from ascii.rest by bas3line, MIT License (see LICENSE)
export const meta = {
    name: "butterfly",
    category: "creatures",
    note: "a butterfly flapping and gliding along a wandering path",
    cols: 64,
    rows: 24,
    fps: 30
};
const RAMP = " .:-=+*#%@";
const LOOP = 16;
const BEAT = 2.5;
const EYE = 120;
const FORE = {
    x: 9.6,
    y: 5.6,
    a: 11.6,
    b: 7.2,
    r: 0.5
};
const HIND = {
    x: 7,
    y: -4.6,
    a: 8.8,
    b: 7.4,
    r: -0.62
};
const drop = (w, x, y)=>{
    const dx = x - w.x, dy = y - w.y, c = Math.cos(w.r), s = Math.sin(w.r);
    const p = (dx * c + dy * s) / w.a;
    const q = (dy * c - dx * s) / (w.b * (0.58 + 0.42 * Math.min(1, Math.max(0, (p + 1) / 2))));
    return [
        p,
        q,
        p * p + q * q
    ];
};
function wing(x, y) {
    const root = Math.hypot(x, y * 0.8) < 3.6;
    let [p, q, r] = drop(FORE, x, y);
    if (r < 1) {
        const rho = Math.sqrt(r), be = Math.atan2(q, p);
        if (rho > 0.76 + 0.2 * Math.min(1, Math.max(0, (0.5 - p) / 0.8))) return rho > 0.8 && rho < 0.95 && p > 0.3 && Math.cos(be * 7 + 0.3) > 0.45 ? 0.9 : 0.24;
        if (Math.abs(p * 0.85 + q * 0.5 - 0.02) < 0.17) return 0.9;
        return root ? 0.3 : 0.55;
    }
    [p, q, r] = drop(HIND, x, y);
    if (r >= 1) return -1;
    const e = Math.hypot(x - 9.4, (y + 6.4) * 0.8);
    if (e < 1) return 1;
    if (e < 2.3) return 0.1;
    if (e < 3.8) return 0.9;
    if (Math.sqrt(r) > 0.8 && p > -0.3) return 0.24;
    return root ? 0.3 : 0.55;
}
export default function butterfly() {
    const { cols, rows } = meta;
    const out = new Array(cols * rows);
    const put = (x, y, ch)=>{
        x = Math.round(x);
        y = Math.round(y);
        if (x >= 0 && x < cols && y >= 0 && y < rows) out[y * cols + x] = ch;
    };
    return (t, { paper = false } = {})=>{
        const u = (t % LOOP + LOOP) % LOOP;
        const w = 2 * Math.PI / LOOP;
        const g = u % 8, flap = g < 4 ? 1 : g < 4.4 ? 1 - (g - 4) / 0.4 : g > 7.6 ? (g - 7.6) / 0.4 : 0;
        const beat = Math.cos(2 * Math.PI * BEAT * u);
        const th = flap * (0.6 - 0.72 * beat) - 0.06 * (1 - flap);
        const bx = Math.round(cols / 2 + 9 * Math.sin(w * u) + 2 * Math.sin(3 * w * u + 0.6)) - 0.5;
        const by = rows / 2 + 0.6 + 1.4 * Math.sin(2 * w * u + 1) + 0.35 * flap * Math.sin(2 * Math.PI * BEAT * u);
        const bank = (0.16 - 0.1 * flap) * (Math.cos(w * u) + 0.67 * Math.cos(3 * w * u + 0.6)) / 1.67;
        const tilt = [
            th - bank,
            th + bank
        ].map((a)=>[
                Math.cos(a),
                Math.sin(a)
            ]);
        const dim = 0.82 + 0.18 * Math.cos(th);
        const sample = (X, Y)=>{
            const [ct, st] = tilt[X < 0 ? 0 : 1];
            const ax = Math.abs(X), den = EYE * ct + ax * st;
            if (den <= 0) return -1;
            const x = ax * EYE / den, k = EYE / (EYE - x * st);
            return wing(x, Y / k);
        };
        out.fill(" ");
        const col = bx - 0.5;
        const sway = 0.4 * Math.sin(2 * Math.PI * 0.5 * u);
        for (const side of [
            -1,
            1
        ]){
            for(let k = 1; k <= 5; k++){
                const f = k / 5;
                put(col + side * (0.5 + 2.6 * f + sway * f * f), by - 2 - 5 * f, k === 5 ? "o" : side > 0 ? "/" : "\\");
            }
        }
        for(let r = 0; r < rows; r++){
            for(let c = 0; c < cols; c++){
                let n = 0, sx = 0, sy = 0;
                for(let j = 0; j < 3; j++)for(let i = 0; i < 2; i++)if (sample(c + 0.25 + i * 0.5 - bx, (by - r - (j + 0.5) / 3) * 2) >= 0) n++, sx += i - 0.5, sy += 1 - j;
                if (!n) continue;
                const at = r * cols + c;
                if (n < 5) {
                    const ux = sx / n, uy = sy / n;
                    if (Math.abs(uy) > Math.abs(ux) * 2) out[at] = uy < 0 ? n < 3 ? "." : "_" : n < 3 ? "'" : "-";
                    else if (Math.abs(ux) > Math.abs(uy) * 2) out[at] = ux > 0 ? "(" : ")";
                    else out[at] = ux * uy < 0 ? "/" : "\\";
                    continue;
                }
                const v = sample(c + 0.5 - bx, (by - r - 0.5) * 2);
                const i = Math.max(1, Math.round(Math.max(0, v) * dim * (RAMP.length - 1)));
                out[at] = RAMP[paper ? RAMP.length - i : i];
            }
        }
        for(let y = 3; y >= -9; y--)put(col, by - y / 2, y > 1 ? "O" : y > -2 ? "#" : y > -8 ? "|" : "'");
        const lines = [];
        for(let r = 0; r < rows; r++)lines.push(out.slice(r * cols, (r + 1) * cols).join(""));
        return lines.join("\n");
    };
}
