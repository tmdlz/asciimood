// analog-clock — from ascii.rest by bas3line, MIT License (see LICENSE)
export const meta = {
    name: "analog clock",
    category: "objects",
    note: "a round clock face showing the local time, seconds ticking",
    cols: 47,
    rows: 23,
    fps: 8,
    options: {
        numerals: true,
        seconds: true
    },
    clock: true
};
const RAMP = ".,-~:;=!*#$@";
const LO = 3, HI = 10;
const R = 21;
const LM = Math.hypot(-0.5, 0.6, 0.62);
const [LX, LY, LZ] = [
    -0.5 / LM,
    0.6 / LM,
    0.62 / LM
];
const HOUR = {
    up: "║",
    rise: "/",
    fall: "\\",
    run: "=",
    flat: "=",
    wide: true,
    span: 2.4
};
const MINUTE = {
    up: "|",
    rise: "/",
    fall: "\\",
    run: "_",
    flat: "-",
    span: 1.3
};
const SECOND = {
    up: "│",
    rise: "╱",
    fall: "╲",
    run: "─",
    flat: "─",
    span: 1.3
};
export default function analogClock({ numerals = true, seconds = true } = {}) {
    const { cols, rows } = meta;
    const cx = cols / 2, cy = rows / 2;
    const start = Date.now();
    const g = Array.from({
        length: rows
    }, ()=>new Array(cols));
    const set = (c, r, ch)=>{
        if (c >= 0 && c < cols && r >= 0 && r < rows) g[r][c] = ch;
    };
    const put = (x, y, ch)=>set(Math.floor(cx + x), Math.floor(cy - y / 2), ch);
    const hand = (a, r0, r1, st)=>{
        let end = null;
        const sx = Math.sin(a), sy = Math.cos(a);
        const steep = Math.abs(sy) > 4 * Math.abs(sx);
        const rise = sx * sy > 0;
        const runs = 2 * Math.abs(sx) > st.span * Math.abs(sy);
        const yAt = (s)=>cy - sy * s / 2, xAt = (s)=>cx + sx * s;
        const ya = yAt(r0), yb = yAt(r1);
        for(let r = Math.floor(Math.min(ya, yb)); r <= Math.floor(Math.max(ya, yb)); r++){
            let s0 = r0, s1 = r1;
            if (Math.abs(sy) > 1e-6) {
                const p = (cy - r) * 2 / sy, q = (cy - r - 1) * 2 / sy;
                s0 = Math.max(r0, Math.min(p, q));
                s1 = Math.min(r1, Math.max(p, q));
                if (s1 - s0 < 1e-6) continue;
            }
            const xa = xAt(s0), xb = xAt(s1);
            const lo = Math.min(xa, xb), hi = Math.max(xa, xb), mid = (lo + hi) / 2;
            const last = s1 > r1 - 1e-6;
            if (!runs) {
                const c = Math.floor(mid);
                set(c, r, steep ? st.up : rise ? st.rise : st.fall);
                if (st.wide && !steep) set(mid - c < 0.5 ? c - 1 : c + 1, r, rise ? st.rise : st.fall);
                if (last) end = [
                    c,
                    r
                ];
                continue;
            }
            const edgeLo = (xa < xb ? s0 : s1) > r0 + 1e-6 && (xa < xb ? s0 : s1) < r1 - 1e-6;
            const edgeHi = (xa < xb ? s1 : s0) > r0 + 1e-6 && (xa < xb ? s1 : s0) < r1 - 1e-6;
            const ch = edgeLo || edgeHi ? st.run : st.flat;
            const c0 = Math.floor(lo), c1 = Math.floor(hi - 1e-6);
            for(let c = c0; c <= c1; c++)set(c, r, ch);
            if (last) end = [
                Math.max(c0, Math.min(c1, Math.floor(xAt(r1)))),
                r
            ];
            if (st.wide) continue;
            if (rise && edgeHi) set(c1, r, st.rise);
            if (!rise && edgeLo) set(c0, r, st.fall);
        }
        return end;
    };
    const bezel = [
        false,
        true
    ].map((paper)=>{
        const b = Array.from({
            length: rows
        }, ()=>new Array(cols).fill(null));
        for(let r = 0; r < rows; r++)for(let c = 0; c < cols; c++){
            let sum = 0, hit = 0;
            for (const [ox, oy] of [
                [
                    0.25,
                    0.25
                ],
                [
                    0.75,
                    0.25
                ],
                [
                    0.25,
                    0.75
                ],
                [
                    0.75,
                    0.75
                ]
            ]){
                const x = c + ox - cx, y = (cy - (r + oy)) * 2;
                const d = Math.hypot(x, y), s = (d - R) / 1.3;
                if (Math.abs(s) >= 1) continue;
                const z = Math.sqrt(1 - s * s);
                sum += Math.max(0, s * x / d * LX + s * y / d * LY + z * LZ);
                hit++;
            }
            if (hit < 2) continue;
            const i = Math.round(LO + sum / hit * (HI - LO));
            b[r][c] = RAMP[paper ? RAMP.length - 1 - i : i];
        }
        return b;
    });
    return (t, { paper = false } = {})=>{
        const now = new Date(Math.max(Date.now(), start + t * 1000));
        const sec = now.getSeconds(), min = now.getMinutes() + sec / 60;
        const hr = now.getHours() % 12 + min / 60;
        const face = bezel[paper ? 1 : 0];
        for(let r = 0; r < rows; r++)for(let c = 0; c < cols; c++)g[r][c] = face[r][c] ?? " ";
        for(let i = 0; i < 60; i++){
            const a = i * Math.PI / 30, sx = Math.sin(a), sy = Math.cos(a);
            if (i % 5) put(sx * 18, sy * 18, "·");
            else if (!numerals || i % 15) put(sx * 17.4, sy * 17.4, Math.abs(sy) > 0.9 ? "|" : Math.abs(sy) < 0.1 ? "-" : sx * sy > 0 ? "/" : "\\");
        }
        const ah = hr * Math.PI / 6, am = min * Math.PI / 30, as = sec * Math.PI / 30;
        hand(ah, 1.5, 9.5, HOUR);
        hand(am, 1.5, 15.5, MINUTE);
        const tip = seconds && hand(as, 1.5, 14.8, SECOND);
        if (seconds) {
            const w = hand(as + Math.PI, 1.5, 4.4, SECOND), f = cy + Math.cos(as) * 2.2;
            if (w) set(w[0], w[1], f - Math.floor(f) < 0.5 ? "▀" : "▄");
        }
        if (numerals) {
            put(-1, 15.6, "1");
            put(0, 15.6, "2");
            put(15.2, 0, "3");
            put(0, -15.6, "6");
            put(-15.2, 0, "9");
        }
        if (tip) set(tip[0], tip[1], "o");
        put(0, 0, "@");
        return g.map((row)=>row.join("")).join("\n");
    };
}
