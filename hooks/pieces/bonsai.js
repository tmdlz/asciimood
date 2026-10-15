// bonsai — from ascii.rest by bas3line, MIT License (see LICENSE)
export const meta = {
    name: "bonsai",
    category: "nature",
    note: "a potted tree that sheds its leaves and leafs out again",
    cols: 52,
    rows: 19,
    fps: 10
};
const LOOP = 26;
const AUTUMN = [
    3,
    8.5
], FADE = 2.5;
const SPRING = [
    14,
    18.5
], GROW = 2.5;
const DROP = 0.24;
const RAMP = " .,:;*%&@";
const PADS = [
    {
        x: 27,
        y: 3,
        w: 7,
        h: 2.2,
        fan: [
            2,
            27
        ]
    },
    {
        x: 15,
        y: 5,
        w: 7.5,
        h: 1.3,
        fan: [
            6,
            15
        ]
    },
    {
        x: 39,
        y: 6,
        w: 7,
        h: 1.3,
        fan: [
            7,
            39
        ]
    },
    {
        x: 11,
        y: 9,
        w: 6.5,
        h: 1.3,
        fan: [
            10,
            11
        ]
    },
    {
        x: 40,
        y: 11,
        w: 6,
        h: 1.3,
        fan: [
            12,
            40
        ]
    }
];
const TRUNK = [
    [
        15,
        24,
        3
    ],
    [
        14,
        24,
        3
    ],
    [
        13,
        25,
        3
    ],
    [
        12,
        26,
        2
    ],
    [
        11,
        26,
        2
    ],
    [
        10,
        25,
        2
    ],
    [
        9,
        24,
        2
    ],
    [
        8,
        24,
        1
    ],
    [
        7,
        24,
        1
    ],
    [
        6,
        25,
        1
    ],
    [
        5,
        26,
        1
    ],
    [
        4,
        26,
        1
    ],
    [
        3,
        27,
        1
    ]
];
const WOOD = [
    [
        12,
        28,
        "___________"
    ],
    [
        11,
        19,
        "\\______"
    ],
    [
        10,
        13,
        "______"
    ],
    [
        8,
        25,
        "_____/"
    ],
    [
        7,
        31,
        "______"
    ],
    [
        7,
        19,
        "\\____"
    ],
    [
        6,
        17,
        "__"
    ]
];
const POT = [
    [
        15,
        6,
        ".________________/   \\________________."
    ],
    [
        16,
        7,
        "\\___________________________________/"
    ],
    [
        17,
        9,
        "`\"\"\"`                       `\"\"\"`"
    ]
];
const SOIL = [
    14,
    7,
    43
];
const hash = (a, b)=>{
    let h = Math.imul(a * 374761393 + b * 668265263, 1274126177);
    h = Math.imul(h ^ h >>> 13, 1103515245);
    return ((h ^ h >>> 16) >>> 0) / 4294967296;
};
export default function bonsai() {
    const { cols, rows } = meta;
    const wood = Array.from({
        length: rows
    }, ()=>Array(cols).fill(" "));
    const put = (r, c, s)=>[
            ...s
        ].forEach((ch, i)=>ch !== " " && (wood[r][c + i] = ch));
    POT.forEach(([r, c, s])=>put(r, c, s));
    TRUNK.forEach(([r, c, w], i)=>{
        const below = TRUNK[i - 1];
        const shift = below ? c + w / 2 - (below[1] + below[2] / 2) : 0;
        put(r, c, (shift > 0.2 ? "/" : shift < -0.2 ? "\\" : "|").repeat(w));
    });
    WOOD.forEach(([r, c, s])=>put(r, c, s));
    for (const { fan: [r, c] } of PADS){
        put(r, c - 1, "\\|/");
        put(r - 1, c - 2, "\\   /");
    }
    const leaves = [];
    PADS.forEach((p, n)=>{
        for(let r = Math.ceil(p.y - p.h); r <= p.y + 1; r++){
            for(let c = Math.floor(p.x - p.w); c <= Math.ceil(p.x + p.w); c++){
                const dx = (c - p.x) / p.w, dy = (r - p.y) / p.h;
                const rho = r <= p.y ? Math.hypot(dx, dy) : Math.max(Math.abs(dx) / 0.85, 0.72);
                if (rho > 1) continue;
                const h = hash(r * 97 + n, c);
                const mass = Math.min(1, (1 - (r <= p.y ? Math.hypot(dx, dy * 0.85) : rho)) * 2.6) * (0.85 + 0.3 * h);
                const lit = Math.max(0, Math.min(1, 0.5 - 0.35 * dx - 0.55 * (r <= p.y ? dy : 1.1)));
                leaves.push({
                    r,
                    c,
                    h,
                    pad: n,
                    under: r > p.y,
                    day: mass * (0.5 + 0.5 * lit),
                    night: mass * (0.5 + 0.5 * (1 - lit)),
                    turn: AUTUMN[0] + (AUTUMN[1] - AUTUMN[0]) * (0.7 * (1 - rho) + 0.3 * h),
                    bud: SPRING[0] + (SPRING[1] - SPRING[0]) * Math.min(1, 0.75 * rho + 0.25 * h)
                });
            }
        }
    });
    const falls = [];
    const fall = (l, t0, k, until)=>{
        const drift = (hash(k, 7) - 0.5) * 1.2, phase = hash(k, 9) * 6.3;
        const path = [];
        for(let r = l.r + 1, i = 0; r < rows; r++, i++){
            const c = Math.round(l.c + drift * i * DROP + Math.sin(i * 0.9 + phase));
            path.push([
                r,
                c
            ]);
            if (r === SOIL[0] && c >= SOIL[1] && c <= SOIL[2]) break;
        }
        const lands = path[path.length - 1][0] === SOIL[0];
        falls.push({
            t0,
            path,
            lie: lands ? ((until ?? t0 + path.length * DROP + 3) - t0 + LOOP) % LOOP : 0
        });
    };
    const under = PADS.map((_, n)=>leaves.filter((l)=>l.pad === n && l.under && l.day > 0.15));
    [
        [
            -1.2,
            0
        ],
        [
            0.5,
            0
        ],
        [
            2.0,
            1
        ],
        [
            3.0,
            0
        ],
        [
            22.6,
            1
        ],
        [
            24.4,
            3
        ]
    ].forEach(([t0, n], k)=>{
        const from = under[n];
        fall(from[Math.floor(hash(k, 1) * from.length)], (t0 + LOOP) % LOOP, k);
    });
    under.flat().filter((l)=>hash(l.r, l.c * 3) < 0.22).forEach((l, k)=>fall(l, l.turn + FADE * 0.8, k + 10, SPRING[0] + 3 * hash(k, 3)));
    const grid = Array.from({
        length: rows
    }, ()=>Array(cols));
    return (t, { paper = false } = {})=>{
        const u = (t % LOOP + LOOP) % LOOP;
        for(let r = 0; r < rows; r++)for(let c = 0; c < cols; c++)grid[r][c] = wood[r][c];
        const gust = Math.max(0, Math.sin(u / LOOP * Math.PI * 8)) ** 3;
        for (const l of leaves){
            let f = 1;
            if (u >= l.turn && u < SPRING[0]) f = Math.max(0, 1 - (u - l.turn) / FADE);
            else if (u >= SPRING[0] && u < l.bud) f = 0;
            else if (u >= l.bud && u < l.bud + GROW) f = (u - l.bud) / GROW;
            if (f <= 0) continue;
            const stir = gust * 0.12 * Math.sin(u * 5 - l.c * 0.5 + l.h * 3);
            const i = Math.round(Math.max(0, Math.min(1, (paper ? l.night : l.day) * f + stir)) * (RAMP.length - 1));
            if (i > 0) grid[l.r][l.c] = RAMP[i];
        }
        for (const f of falls){
            const age = (u - f.t0 + LOOP) % LOOP;
            const step = Math.floor(age / DROP);
            const [r, c] = f.path[Math.min(step, f.path.length - 1)];
            if (grid[r][c] !== " ") continue;
            if (step < f.path.length) grid[r][c] = step & 1 ? "'" : ",";
            else if (age < f.lie) grid[r][c] = ",";
        }
        return grid.map((row)=>row.join("")).join("\n");
    };
}
