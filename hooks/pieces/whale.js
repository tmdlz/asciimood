// whale — from ascii.rest by bas3line, MIT License (see LICENSE)
export const meta = {
    name: "whale",
    category: "creatures",
    note: "a whale blows, arches its back and dives, fluke last",
    cols: 72,
    rows: 18,
    fps: 15
};
const SURF = [
    "                 _.-''-._",
    "          __..--'        `--.....______",
    "     _.--'                             ``--.._/|",
    "   .'       #o#                              `-.._",
    "  (____..--''                                     `-.._"
];
const ARCH = [
    "                __..--.._/|",
    "           _.-''           `-._",
    "        .-'                    `-._",
    "      .'                           `-._",
    "     /                                 `-._",
    "    /                                      `-._"
];
const FLUKE = [
    " ._                          _.",
    "  \\`-.._                _..-'/",
    "   `.   ``--.._    _.--''   .'",
    "     `-._      `\\/'      _.-'",
    "         ``--.._||_..--''",
    "                ||",
    "                ||",
    "                ||"
];
const SHADE = " :::..";
const solidify = (art, shade)=>{
    const w = Math.max(...art.map((l)=>l.length));
    const g = art.map((l)=>[
            ...l.padEnd(w)
        ].map((ch)=>ch === " " ? null : ch));
    for(let k = 0; shade && k < w; k++){
        const top = g.findIndex((row)=>row[k] !== null);
        for(let r = top + 1; top >= 0 && r < g.length; r++)g[r][k] ??= shade[r + shade.length - g.length];
    }
    return g.map((row)=>row.map((ch)=>ch === "#" ? " " : ch));
};
const BODY = {
    surf: solidify(SURF, SHADE),
    arch: solidify(ARCH, SHADE),
    fluke: solidify(FLUKE, "")
};
const SEA = 13;
const LOOP = 10;
const T0 = 1.5;
const SWIM = 2.6;
const X0 = 13;
const BLOW = 0.7;
const HOLE = SURF[0].indexOf("''") + 1;
const WIND = 1.5;
const FIN = SURF[2].indexOf("|") - ARCH[0].indexOf("|");
const UP = {
    surf: [
        0,
        1,
        3,
        3.8
    ],
    arch: [
        3.1,
        3.8,
        4.6,
        5.2
    ],
    fluke: [
        5,
        5.9,
        7.5,
        8.5
    ]
};
const DIVE = UP.arch[3];
const FLUKE_X = X0 - SWIM * DIVE - 2 + FIN + ARCH[0].indexOf("|") + 4;
function hash(i, s) {
    let h = Math.imul(i ^ 0x2c1b3c6d, 0x297a2d39) ^ Math.imul(s + 7, 0x9e3779b1);
    h = Math.imul(h ^ h >>> 15, 0x85ebca77);
    return ((h ^ h >>> 13) >>> 0) / 4294967296;
}
const ease = (u)=>u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u);
const depth = (u, up, top, down, under)=>u < up || u > under ? 1 : u < top ? 1 - ease((u - up) / (top - up)) : u < down ? 0 : ease((u - down) / (under - down));
const DRIP = [
    3,
    6,
    10,
    13,
    19,
    22,
    26,
    29
].map((k)=>{
    let row = 4;
    while(row > 0 && (FLUKE[row][k] || " ") === " ")row--;
    return [
        k,
        row
    ];
});
export default function whale() {
    const { cols, rows } = meta;
    const g = Array.from({
        length: rows
    }, ()=>new Array(cols));
    const put = (r, c, ch)=>{
        if (r >= 0 && r < rows && c >= 0 && c < cols) g[r][c] = ch;
    };
    const open = (r, c)=>r >= 0 && r < SEA && c >= 0 && c < cols && g[r][c] === " ";
    const stamp = (shape, left, sink)=>{
        const h = shape.length, drop = Math.round(sink * h), x = Math.round(left);
        shape.forEach((line, i)=>{
            const r = SEA - h + i + drop;
            if (r < SEA) line.forEach((ch, k)=>ch !== null && put(r, x + k, ch));
        });
        return SEA - h + drop;
    };
    const SPRAY = " .':;";
    const blow = (br, bc, from, s)=>{
        const top = 6.6 * Math.sqrt(Math.min(1, s / 0.5));
        const cut = s < 0.8 ? 0 : (s - 0.8) * 7;
        const hw = 1 + 3.6 * Math.min(1, s / 0.8) + 2.4 * Math.max(0, s - 0.8);
        const hh = 1 + 0.6 * Math.min(1, s / 0.8) + 0.5 * Math.max(0, s - 0.8);
        const hy0 = top - 0.6 - 0.5 * Math.max(0, s - 1);
        const amp = Math.min(1, s / 0.2) * (s < 1 ? 1 : Math.exp(-(s - 1) / 1.2));
        const drift = WIND * s;
        for(let r = br - 1; r >= Math.max(0, br - 9); r--){
            const y = br - r;
            const lean = Math.min(1, y / Math.max(1, top));
            const mid = bc + (from - bc) * lean + drift * lean * lean;
            for(let c = Math.floor(mid - 12); c <= mid + 12; c++){
                if (!open(r, c)) continue;
                const dx = c - mid, dy = (y - hy0) / hh;
                let d = y > cut && y <= top ? Math.exp(-((dx / (0.3 + 0.17 * y)) ** 2)) : 0;
                d = Math.max(d, amp * Math.exp(-((dx / hw) ** 2) - dy * dy));
                d *= 0.92 + 0.16 * hash(c * 31 + r, 5);
                const i = Math.min(SPRAY.length - 1, Math.floor(d * SPRAY.length));
                if (i > 0) g[r][c] = SPRAY[i];
            }
        }
    };
    return (t)=>{
        const u = ((t + T0) % LOOP + LOOP) % LOOP;
        for (const row of g)row.fill(" ");
        for(let c = 0; c < cols; c++){
            const h = Math.sin(c * 0.61 - t * 1.4) + 0.7 * Math.sin(c * 0.27 + t * 0.8);
            g[SEA][c] = h > 1.45 ? "-" : "~";
            for (const [r, k] of [
                [
                    SEA + 2,
                    0.6
                ],
                [
                    SEA + 4,
                    -0.4
                ]
            ]){
                const v = Math.sin(c * 0.45 + t * k * 2 + r) * Math.sin(c * 0.06 - t * k * 0.3 + r);
                if (v > 0.6) g[r][c] = "~";
            }
        }
        const hx = X0 - SWIM * Math.min(u, DIVE);
        const top = stamp(BODY.surf, hx - 2, depth(u, ...UP.surf));
        const arch = depth(u, ...UP.arch);
        stamp(BODY.arch, hx - 2 + FIN, arch);
        if (arch < 0.7) {
            const low = ARCH.length - 1 - Math.round(arch * ARCH.length);
            const lip = Math.round(hx - 2 + FIN) + ARCH[low].search(/\S/);
            for(let j = 0; j < 6; j++){
                const p = (u * 1.4 + hash(j, 3)) % 1, a = hash(j, 4);
                const r = Math.round(SEA - 1 - (0.6 + 1.6 * a) * Math.sin(Math.PI * p)), c = Math.round(lip - 1 - p * (1 + 2 * a));
                if (open(r, c)) g[r][c] = p < 0.5 ? "'" : ".";
            }
        }
        if (u > BLOW && u < BLOW + 3) blow(top, Math.round(hx - 2 + HOLE), X0 - SWIM * BLOW - 2 + HOLE, u - BLOW);
        const sink = depth(u, ...UP.fluke);
        const fx = Math.round(FLUKE_X - 16);
        stamp(BODY.fluke, fx, sink);
        if (sink < 1 && u > UP.fluke[1] - 0.2) {
            const ft = SEA - FLUKE.length + Math.round(sink * FLUKE.length);
            DRIP.forEach(([dx, row], j)=>{
                for (const lag of [
                    0,
                    0.5
                ]){
                    const p = (u * 1.6 + hash(j, 9) + lag) % 1;
                    const r = Math.floor(ft + row + 1 + p * p * (SEA - ft - row - 1));
                    if (open(r, fx + dx)) g[r][fx + dx] = p < 0.25 ? "'" : ".";
                }
            });
        }
        const gone = UP.fluke[3] - 0.2;
        if (u > gone && u < gone + 1.2) {
            const w = Math.round(4 + 5 * (u - gone));
            const fade = (u - gone) / 1.2;
            for(let c = -w; c <= w; c++)if (hash(c + 40, Math.floor(u * 4)) > fade) put(SEA, Math.round(FLUKE_X) + c, "_");
        }
        return g.map((row)=>row.join("")).join("\n");
    };
}
