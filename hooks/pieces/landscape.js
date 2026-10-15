// landscape — from ascii.rest by bas3line, MIT License (see LICENSE)
export const meta = {
    name: "landscape",
    category: "nature",
    note: "a range and a lake under the sun or moon of the local hour",
    cols: 64,
    rows: 18,
    fps: 8,
    options: {
        hour: null,
        phase: null
    },
    clock: true
};
const SHORE = 11;
const SUN = [
    "  \\  |  /  ",
    "   .---.   ",
    "--(     )--",
    "   '---'   ",
    "  /  |  \\  "
];
const MOON = [
    "  .-''-.  ",
    " /######\\ ",
    "|########|",
    " \\######/ ",
    "  '-..-'  "
];
const MARIA = [
    "1,4",
    "2,6",
    "2,7",
    "3,3"
];
const CLOUD = [
    "        .-~~-.          ",
    "   .-~~'######'-.  .-.  ",
    " .'##############'~###'.",
    "(______________________)"
];
const PUFF = [
    "   .-~~-.   ",
    " .'######'. ",
    "(__________)"
];
const CLOUDS = [
    [
        CLOUD,
        0,
        0
    ],
    [
        PUFF,
        2,
        32
    ]
];
const DRIFT = 0.4;
const FLIP = {
    "/": "\\",
    "\\": "/"
};
const hash = (a, b)=>{
    let h = Math.imul(a, 0x27d4eb2d) ^ Math.imul(b, 0x165667b1);
    h = Math.imul(h ^ h >>> 15, 0x85ebca6b);
    return ((h ^ h >>> 13) >>> 0) / 4294967296;
};
const lunation = (d)=>((d.getTime() / 864e5 - 10962.76) / 29.530588853 % 1 + 1) % 1;
export default function landscape({ hour = null, phase = null } = {}) {
    const { cols, rows } = meta;
    const maria = new Set(MARIA);
    const peaks = [
        [
            13,
            5,
            10,
            5
        ],
        [
            33,
            4,
            5,
            6
        ],
        [
            43,
            6,
            6,
            11
        ],
        [
            56,
            3,
            4,
            5
        ]
    ];
    const e = [];
    for(let x = 0; x <= cols; x++){
        const f = Math.max(0, ...peaks.map(([px, h, w, o])=>h * Math.max(0, 1 - Math.abs(x - px) / (x < px ? w : o)) ** 1.3));
        e.push(x ? Math.max(e[x - 1] - 1, Math.min(e[x - 1] + 1, Math.round(f))) : Math.round(f));
    }
    const range = Array.from({
        length: cols
    }, (_, c)=>e[c + 1] > e[c] ? [
            SHORE - e[c],
            "/"
        ] : e[c + 1] < e[c] ? [
            SHORE - e[c + 1],
            "\\"
        ] : [
            SHORE - e[c],
            "_"
        ]);
    const top = range.map(([r])=>r);
    const land = Array.from({
        length: SHORE + 1
    }, (_, r)=>Array.from({
            length: cols
        }, (_, c)=>range[c][0] === r ? range[c][1] : r > range[c][0] && (c + r) % 2 ? "." : " "));
    const mirror = [];
    for(let c = 0; c < cols; c++){
        const [r, ch] = range[c];
        if (FLIP[ch]) mirror.push([
            2 * SHORE + 1 - r,
            c,
            FLIP[ch]
        ]);
        else if (r < SHORE) mirror.push([
            2 * SHORE + 1 - r,
            c,
            "-"
        ]);
    }
    const stars = [
        [
            0,
            45,
            "*",
            0
        ],
        [
            2,
            45,
            ".",
            0.15
        ],
        [
            3,
            50,
            ".",
            0.15
        ],
        [
            2,
            52,
            ".",
            0.3
        ],
        [
            2,
            56,
            "*",
            0
        ],
        [
            3,
            59,
            ".",
            0.1
        ],
        [
            4,
            61,
            "*",
            0
        ],
        [
            0,
            7,
            ".",
            0.5
        ],
        [
            1,
            24,
            "'",
            0.7
        ],
        [
            0,
            34,
            ".",
            0.4
        ],
        [
            2,
            3,
            ".",
            0.8
        ],
        [
            3,
            13,
            "'",
            0.6
        ],
        [
            2,
            30,
            ".",
            0.9
        ],
        [
            4,
            37,
            ".",
            0.75
        ],
        [
            1,
            39,
            "'",
            0.55
        ],
        [
            3,
            21,
            ".",
            0.85
        ],
        [
            5,
            4,
            ".",
            0.65
        ],
        [
            0,
            17,
            ".",
            0.45
        ]
    ];
    const ripples = [];
    for(let k = 2; SHORE + k < rows; k++)ripples.push([
        SHORE + k,
        Math.floor(hash(k, 7) * cols),
        2 + +(k > 4),
        k % 2 ? 0.3 : -0.25
    ]);
    const place = (u)=>{
        const alt = Math.sin(Math.PI * u);
        return [
            Math.round(5 + (cols - 11) * u),
            Math.round(SHORE + 2 - SHORE * Math.max(0, alt) ** 0.45)
        ];
    };
    return (t)=>{
        const now = new Date();
        const h = hour ?? now.getHours() + now.getMinutes() / 60;
        const age = phase ?? lunation(now);
        const g = Array.from({
            length: rows
        }, (_, r)=>r <= SHORE ? [
                ...land[r]
            ] : new Array(cols).fill(" "));
        const sky = (r, c)=>r >= 0 && c >= 0 && c < cols && r < top[c];
        const ground = (r, c)=>c >= 0 && c < cols && r >= top[c] && r <= SHORE;
        const sunU = ((h - 6) % 24 + 24) % 24 / 12;
        const day = sunU < 1;
        const dark = day ? 0 : Math.min(1, Math.sin(Math.PI * (sunU - 1)) * 5);
        const step = Math.floor(t * 2);
        const moonU = ((sunU - age * 2) % 2 + 2) % 2;
        const [cx, cy] = day ? place(sunU) : place(Math.min(moonU, 1.5));
        const up = day || moonU < 1;
        const cloud = Array.from({
            length: rows
        }, ()=>new Array(cols).fill(""));
        const W = CLOUD[0].length, span = cols + W;
        for (const [shape, r0, d] of CLOUDS){
            const w = shape[0].length;
            const x = Math.floor((cx + 15 + d + W + DRIFT * t) % span - W);
            shape.forEach((line, i)=>{
                for(let k = 0; k < w; k++)if (line[k] !== " " && sky(r0 + i, x + k)) cloud[r0 + i][x + k] = line[k] === "#" ? " " : line[k];
            });
        }
        const near = (r, c)=>{
            for(let dr = -1; dr <= 1; dr++)for(let dc = -1; dc <= 1; dc++)if (cloud[r + dr]?.[c + dc]) return true;
            return up && !day && Math.abs(c - cx) <= 6 && Math.abs(r - cy) <= 3;
        };
        for (const [row, col, ch, need] of stars){
            if (dark <= need || !sky(row, col) || near(row, col)) continue;
            g[row][col] = need > 0.3 && hash(col, step) < 0.15 ? " " : ch;
        }
        let lit = 0, full = 1;
        const put = (r, c, ch, solid, body)=>{
            if (!sky(r, c) || cloud[r][c]) return;
            if (!solid) {
                for(let dr = -1; dr <= 1; dr++)for(let dc = -1; dc <= 1; dc++)if (ground(r + dr, c + dc) || cloud[r + dr]?.[c + dc]) return;
            }
            g[r][c] = ch;
            if (body) lit++;
        };
        if (day) {
            SUN.forEach((line, i)=>{
                for(let k = 0; k < line.length; k++){
                    const r = cy - 2 + i, c = cx - 5 + k;
                    const disc = i === 2 ? k > 1 && k < 9 : i % 2 === 1 && k > 2 && k < 8;
                    if (line[k] !== " ") put(r, c, line[k], disc, disc);
                }
            });
        } else if (up) {
            const k = Math.cos(2 * Math.PI * (age % 0.5));
            const shine = (x, y)=>x * x + y * y <= 1 && age < 0.5 === x > k * Math.sqrt(Math.max(0, 1 - y * y));
            const edge = k > 0.25 ? ")" : k < -0.25 ? "(" : "|";
            full = (1 - Math.cos(2 * Math.PI * age)) / 2;
            MOON.forEach((line, i)=>{
                for(let j = 0; j < line.length; j++){
                    if (line[j] === " ") continue;
                    const r = cy - 2 + i, c = cx - 5 + j;
                    const x = (j + 0.5 - 5) / 5, y = (i + 0.5 - 2.5) / 2.5;
                    if (line[j] !== "#") {
                        const s = 0.97 / Math.hypot(x, y);
                        if (shine(x * s, y * s)) put(r, c, line[j], false, true);
                        continue;
                    }
                    let on = 0;
                    for(let q = 0; q < 9; q++)if (shine(x + (q % 3 - 1) / 15, y + (Math.floor(q / 3) - 1) / 7.5)) on++;
                    if (on >= 6) put(r, c, maria.has(`${i},${j}`) ? "." : ":", true, true);
                    else if (on >= 2) put(r, c, edge, true, true);
                    else if (sky(r, c)) g[r][c] = " ";
                }
            });
        }
        for(let r = 0; r <= SHORE; r++)for(let c = 0; c < cols; c++)if (cloud[r][c]) g[r][c] = cloud[r][c];
        for (const [r, c, ch] of mirror)if (r < rows) g[r][c] = ch;
        for (const [r, c0, n, v] of ripples){
            const x = Math.floor(((c0 + v * t) % (cols + 4) + cols + 4) % (cols + 4)) - 2;
            let clear = true;
            for(let c = x - 1; c <= x + n; c++)if (g[r][c] !== undefined && g[r][c] !== " ") clear = false;
            if (clear) for(let c = Math.max(0, x); c < Math.min(cols, x + n); c++)g[r][c] = "-";
        }
        if (lit > 2) {
            const mid = cx + 0.5;
            for(let r = SHORE + 1; r < rows; r++){
                const w = 0.6 + (r - SHORE) * (0.15 + full * 0.45);
                for(let c = Math.floor(mid - w - 1); c <= mid + w + 1; c++){
                    if (c < 0 || c >= cols) continue;
                    const d = Math.abs(c + 0.5 - mid);
                    g[r][c] = d > w || hash(c * 31 + r, step) < 0.2 + 0.4 * (1 - full) ? " " : d < w * 0.5 && full > 0.5 ? "=" : "-";
                }
            }
        }
        return g.map((row)=>row.join("")).join("\n");
    };
}
