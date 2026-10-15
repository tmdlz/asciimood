// sundial — from ascii.rest by bas3line, MIT License (see LICENSE)
export const meta = {
    name: "sundial",
    category: "objects",
    note: "jaipur's samrat yantra, its shadow set by your local time",
    cols: 65,
    rows: 23,
    fps: 10,
    clock: true
};
const LAT = 26.92 * Math.PI / 180;
const CX = 32.5, YC = 9.5;
const RX = 26, RY = 11.6;
const INNER = 0.77;
const GROUND = 22, APEX = 4, FOOT = 2.9;
function mulberry32(seed) {
    let s = seed | 0;
    return ()=>{
        s = s + 0x6d2b79f5 | 0;
        let t = Math.imul(s ^ s >>> 15, 1 | s);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}
export default function sundial() {
    const { cols, rows } = meta;
    const grid = new Array(cols * rows);
    const put = (c, r, g)=>{
        c = Math.floor(c), r = Math.floor(r);
        if (c >= 0 && c < cols && r >= 0 && r < rows) grid[r * cols + c] = g;
    };
    const text = (c, r, s)=>[
            ...s
        ].forEach((g, i)=>g !== " " && put(c + i, r, g));
    const angle = (c, r)=>Math.atan2((c - CX) / RX, (r - YC) / RY);
    const face = [];
    for(let r = Math.floor(YC); r < rows; r++){
        for(let c = 0; c < cols; c++){
            const e = Math.hypot((c + 0.5 - CX) / RX, (r + 0.5 - YC) / RY);
            if (e >= 1 || e <= INNER) continue;
            const corners = [
                [
                    c,
                    r
                ],
                [
                    c + 1,
                    r
                ],
                [
                    c,
                    r + 1
                ],
                [
                    c + 1,
                    r + 1
                ]
            ].map(([x, y])=>angle(x, y));
            const lo = Math.min(...corners), hi = Math.max(...corners);
            const hour = Math.floor(hi / (Math.PI / 12)) !== Math.floor(lo / (Math.PI / 12));
            face.push([
                r * cols + c,
                angle(c + 0.5, r + 0.5),
                lo,
                hi,
                hour
            ]);
        }
    }
    const half = (r)=>0.6 + (FOOT - 0.6) * (r - APEX) / (GROUND - 1 - APEX);
    let hidden = Math.PI / 2;
    for (const [k, psi] of face){
        const r = Math.floor(k / cols), c = k % cols;
        if (c < Math.floor(CX - half(r)) || c > Math.floor(CX + half(r))) hidden = Math.min(hidden, Math.abs(psi));
    }
    const rim = new Map();
    const UP = 0.22;
    for(let r = Math.ceil(YC - 0.5); (r + 0.5 - YC) / RY < UP; r++){
        const w = RX * Math.sqrt(1 - ((r + 0.5 - YC) / RY) ** 2);
        rim.set(r * cols + Math.floor(CX - w), "|"), rim.set(r * cols + Math.floor(CX + w), "|");
    }
    const acc = new Map();
    for(let i = 0; i <= 1200; i++){
        const p = (i / 1200 * 2 - 1) * (Math.PI / 2);
        const x = CX + RX * Math.sin(p), y = YC + RY * Math.cos(p);
        if ((Math.floor(y) + 0.5 - YC) / RY < UP) continue;
        const k = Math.floor(y) * cols + Math.floor(x);
        const e = acc.get(k) || [
            0,
            0,
            0,
            p < 0
        ];
        e[0] += 1, e[1] += y - Math.floor(y), e[2] += Math.atan2(2 * RY * Math.abs(Math.sin(p)), RX * Math.cos(p));
        acc.set(k, e);
    }
    const most = new Map();
    for (const [k, [n, , phi, west]] of acc){
        const id = Math.floor(k / cols) * 2 + (west ? 0 : 1);
        if (phi / n > 1.08 && n > (acc.get(most.get(id))?.[0] ?? 0)) most.set(id, k);
    }
    for (const [k, [n, fy, phi, west]] of acc){
        const s = most.get(Math.floor(k / cols) * 2 + (west ? 0 : 1));
        if (s === k) rim.set(k, west ? "\\" : "/");
        else if (s === undefined || n > acc.get(s)[0] * 0.7) rim.set(k, fy / n < 0.4 ? "'" : fy / n > 0.6 ? phi / n > 0.2 ? "." : "_" : "-");
    }
    const base = new Array(cols * rows);
    const draw = (H)=>{
        grid.fill(" ");
        const edge = H === null ? null : Math.sign(H || -1) * Math.max(Math.abs(H), hidden);
        for (const [k, psi, lo, hi, hour] of face){
            let g = hour ? ":" : "·";
            if (H !== null) {
                const d = (hi - lo) / 2;
                if (lo <= edge && edge <= hi) g = "█";
                else if (lo - d <= edge && edge <= hi + d) g = "▓";
                else if (psi * H >= 0 && Math.abs(psi) <= Math.abs(H)) g = "▒";
            }
            grid[k] = g;
        }
        for (const [k, g] of rim)grid[k] = g;
        for(let h = -6; h <= 6; h++){
            if (!h) continue;
            const p = h * Math.PI / 12, s = String(h < 0 ? 12 + h : h);
            text(Math.round(CX + RX * (INNER - 0.09) * Math.sin(p) - s.length / 2), YC + RY * (INNER - 0.12) * Math.cos(p), s);
        }
        for (const s of [
            -1,
            1
        ]){
            const wall = Math.floor(CX + s * RX);
            for(let r = Math.floor(YC); r < GROUND; r++)put(wall, r, "|");
            put(wall, Math.floor(YC) - 1, "_");
            for(let c = 1; c < RX * (1 - INNER) - 0.5; c++)put(wall - s * c, Math.floor(YC) - 1, "_");
            for (const dx of [
                16,
                21
            ])text(Math.floor(CX + s * dx) - 1, GROUND - 2, "╭─╮"), text(Math.floor(CX + s * dx) - 1, GROUND - 1, "│ │");
        }
        for(let c = 0; c < cols; c++)put(c, GROUND, "▀");
        for(let r = APEX; r < GROUND; r++){
            const w = half(r);
            for(let c = Math.ceil(CX - w); c < CX + w; c++)put(c, r, "=");
            put(CX - w, r, "/"), put(CX + w, r, "\\");
            if (w > 2) put(CX - w + 1, r, "|"), put(CX + w - 1, r, "|");
        }
        text(Math.floor(CX) - 1, APEX - 2, "▗█▖");
        text(Math.floor(CX) - 1, APEX - 1, "│ │");
        base.splice(0, base.length, ...grid);
    };
    const rand = mulberry32(5);
    const stars = Array.from({
        length: 22
    }, ()=>[
            rand() * cols | 0,
            rand() * 8 | 0,
            rand() * 6
        ]);
    let key = -1;
    let H = null;
    return (t)=>{
        const now = new Date();
        const hours = now.getHours() + now.getMinutes() / 60;
        const day = (now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 864e5;
        const minute = Math.floor(hours * 60);
        if (minute !== key) {
            key = minute;
            const h = (hours - 12) * 15 * Math.PI / 180;
            const dec = -23.44 * Math.PI * Math.cos(2 * Math.PI * (day + 10) / 365) / 180;
            const up = Math.cos(dec) * Math.cos(h) * Math.cos(LAT) + Math.sin(dec) * Math.sin(LAT) > 0;
            H = up ? Math.max(-Math.PI / 2, Math.min(Math.PI / 2, h)) : null;
            draw(H);
        }
        const out = base.slice();
        const sky = (c, r, g)=>{
            c = Math.floor(c), r = Math.floor(r);
            if (c >= 0 && c < cols && r >= 0 && r < rows && out[r * cols + c] === " ") out[r * cols + c] = g;
        };
        if (H === null) {
            for (const [c, r, ph] of stars)sky(c, r, Math.sin(t * 1.4 + ph) > 0.5 ? "+" : "·");
        } else {
            const x = CX - 24 * Math.sin(H), y = 1.5 + 4 * (1 - Math.cos(H));
            sky(x, y, "O"), sky(x - 1, y, "("), sky(x + 1, y, ")");
            const step = Math.floor(t / 0.45) % 4;
            const rays = [
                [
                    [
                        0,
                        -1,
                        "|"
                    ],
                    [
                        0,
                        1,
                        "|"
                    ],
                    [
                        -3,
                        0,
                        "-"
                    ],
                    [
                        3,
                        0,
                        "-"
                    ]
                ],
                [
                    [
                        -2,
                        -1,
                        "\\"
                    ],
                    [
                        2,
                        -1,
                        "/"
                    ],
                    [
                        -2,
                        1,
                        "/"
                    ],
                    [
                        2,
                        1,
                        "\\"
                    ]
                ]
            ];
            for (const [dx, dy, g] of step === 0 ? rays[0] : step === 2 ? rays[1] : [
                ...rays[0],
                ...rays[1]
            ])sky(x + dx, y + dy, g);
        }
        const lines = [];
        for(let r = 0; r < rows; r++)lines.push(out.slice(r * cols, (r + 1) * cols).join(""));
        return lines.join("\n");
    };
}
