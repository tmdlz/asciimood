// train — from ascii.rest by bas3line, MIT License (see LICENSE)
export const meta = {
    name: "train",
    category: "objects",
    note: "a steam train crossing on its track, smoke puffing behind",
    cols: 76,
    rows: 26,
    fps: 15
};
const S = String.raw;
const PARTS = [
    [
        14,
        0,
        [
            S` ________________ `,
            S`/________________\ `,
            S`| __  __  __  __ | `,
            S`||  ||  ||  ||  || `,
            S`||__||__||__||__|| `,
            S`|________________|=`,
            S` |=|=|      |=|=|  `
        ]
    ],
    [
        15,
        19,
        [
            S`  _.-^^^^-._  `,
            S` |^^^^^^^^^^| `,
            S` |          | `,
            S` |          | `,
            S` |__________|=`,
            S`  |=|=||=|=|  `
        ]
    ],
    [
        9,
        33,
        [
            S`                           _____ `,
            S`                           \   / `,
            S` _________      .-.  _      | |  `,
            S` \_______/_____/   \| |_____| |__[]`,
            S`  | ___ |  ||      ||      ||    \ `,
            S`  ||   ||  ||      ||      ||     )`,
            S`  ||___||  ||      ||      ||     )`,
            S`  |     |__||______||______||____/ `,
            S`  |_____|=========================[]`,
            S`  | |                             |\ `,
            S`  |_|                       ____  |\\ `,
            S`                           |____| |\\\ `,
            S`                                  | \\\ `,
            S`                                  |__\\\ `
        ]
    ]
];
const LEN = 73;
const RAIL = 23;
const SPEED = 8;
const DRIVE = [
    42,
    52
];
const SMALL = [
    3,
    6,
    12,
    15,
    22,
    25,
    28,
    31
];
const CROSS = 58;
const CYL = 60;
const STACK = 62;
const RIM = 2.5;
const LIFE = 5.5;
const WIND = 2.4;
const SMOKE = " .:-=+*";
const WHEEL = [
    S`  .---.  `,
    S` /     \ `,
    S`|  (o)  |`,
    S` \     / `,
    S`  '---'  `
];
const SPOKES = [
    [
        S`    |    `,
        S` --   -- `,
        S`    |    `
    ],
    [
        S`   \ /   `,
        S`         `,
        S`   / \   `
    ]
];
const hash = (x, y)=>{
    let h = Math.imul(x, 0x27d4eb2d) ^ Math.imul(y, 0x165667b1);
    h = Math.imul(h ^ h >>> 15, 0x85ebca6b);
    return ((h ^ h >>> 13) >>> 0) / 4294967296;
};
export default function train() {
    const { cols, rows } = meta;
    const SPAN = cols + LEN + 1;
    const X0 = LEN - 16;
    const out = new Array(cols * rows);
    const put = (r, c, ch)=>{
        if (r >= 0 && r < rows && c >= 0 && c < cols) out[r * cols + c] = ch;
    };
    const text = (r, c, s)=>[
            ...s
        ].forEach((ch, i)=>ch !== " " && put(r, c + i, ch));
    const left = (t)=>Math.floor(((X0 + SPEED * t) % SPAN + SPAN) % SPAN) - LEN;
    const OMEGA = SPEED / (2 * RIM);
    const BEAT = Math.PI / 2 / OMEGA;
    const track = [];
    for(let c = 0; c < cols; c++){
        track.push([
            RAIL,
            c,
            "="
        ], [
            RAIL + 1,
            c,
            c % 3 ? "_" : "|"
        ]);
        const h = hash(c, 5);
        track.push([
            RAIL + 2,
            c,
            h < 0.16 ? ":" : h < 0.34 ? "," : h < 0.44 ? "'" : h < 0.7 ? "." : " "
        ]);
    }
    const dens = new Float32Array(cols * rows);
    return (t)=>{
        out.fill(" ");
        const ox = left(t);
        dens.fill(0);
        for(let k = Math.ceil((t - LIFE) / BEAT); k * BEAT <= t; k++){
            const age = t - k * BEAT, u = age / LIFE;
            const x = left(k * BEAT) + STACK - WIND * age + 0.8 * Math.sin(k * 1.7);
            const y = 8.4 - 7.2 * (1 - Math.exp(-age / 2)) + 0.5 * Math.sin(k * 2.9);
            const rad = 1.5 + 0.75 * age ** 0.8, w = (1 - u) ** 1.2;
            for(let r = Math.floor(y - rad); r <= y + rad; r++)for(let c = Math.floor(x - 2 * rad); c <= x + 2 * rad; c++){
                if (r < 0 || r >= rows || c < 0 || c >= cols) continue;
                const dx = (c + 0.5 - x) / 2 / rad, dy = (r + 0.5 - y) / rad, q = dx * dx + dy * dy;
                if (q >= 1) continue;
                const v = w * Math.sqrt(1 - q) * (0.6 - 0.4 * dy - 0.1 * dx);
                const j = r * cols + c;
                if (v > dens[j]) dens[j] = v;
            }
        }
        for(let k = 0; k < cols * rows; k++){
            const v = dens[k];
            if (v > 0.08) out[k] = SMOKE[Math.min(SMOKE.length - 1, Math.ceil(v * 7))];
        }
        for (const [r, c, ch] of track)put(r, c, ch);
        for (const [r0, c0, lines] of PARTS)lines.forEach((s, i)=>text(r0 + i, ox + c0, s));
        const a = OMEGA * t;
        const eighth = Math.floor(a / (Math.PI / 4)) % 2;
        for (const c of DRIVE){
            WHEEL.forEach((s, i)=>text(RAIL - 5 + i, ox + c - 4, s));
            SPOKES[eighth].forEach((s, i)=>text(RAIL - 4 + i, ox + c - 4, s));
        }
        const roll = Math.floor(SPEED * t / 1.4) % 2;
        for (const c of SMALL){
            text(RAIL - 2, ox + c - 1, ".-.");
            text(RAIL - 1, ox + c - 1, roll ? "(+)" : "(x)");
        }
        const hub = RAIL - 3, dr = -Math.round(1.2 * Math.sin(a));
        const dc = Math.round((dr ? 2.4 : 3) * Math.cos(a)), pr = hub + dr;
        const free = (r, c)=>DRIVE.every((d)=>Math.abs(c - d) !== (r === hub ? 4 : 3) && (r !== hub || Math.abs(c - d) > 1));
        for(let c = DRIVE[0] + dc; c <= DRIVE[1] + dc; c++)if (free(pr, c)) put(pr, ox + c, c === DRIVE[0] + dc || c === DRIVE[1] + dc ? "o" : "=");
        const x0 = DRIVE[1] + dc, xh = CROSS + Math.round(Math.cos(a));
        for(let c = x0 + 1; c < xh; c++){
            const r = Math.round(pr + (hub - pr) * (c - x0) / (xh - x0));
            if (free(r, c)) put(r, ox + c, r === pr ? "=" : "-");
        }
        put(hub, ox + xh, "#");
        for(let c = xh + 1; c < CYL; c++)put(hub, ox + c, "=");
        const lines = [];
        for(let r = 0; r < rows; r++)lines.push(out.slice(r * cols, (r + 1) * cols).join(""));
        return lines.join("\n");
    };
}
