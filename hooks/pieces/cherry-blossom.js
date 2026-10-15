// cherry-blossom — from ascii.rest by bas3line, MIT License (see LICENSE)
export const meta = {
    name: "cherry blossom",
    category: "nature",
    note: "a flowering cherry branch shedding petals on the wind",
    cols: 64,
    rows: 20,
    fps: 15
};
const LOOP = 24;
const GUST = 12, BLOW = 4.5;
const PETALS = 14;
const WOOD = [
    "",
    "",
    "______",
    "      `----.___",
    "______         `---.__  |             /",
    "      `----.___       `-|.__      \\  /",
    "             | `---.___     `-.__  \\/",
    "             |         `--.__    `-.__                 /",
    "                             `-._     `--.___         /",
    "                                 \\           `---.___/",
    "                                  \\ \\                \\",
    "                                   ) )                \\",
    "                                  / /                  \\",
    "                                 / /",
    "                                ( (",
    "                                 \\ \\",
    "                                    \\_"
];
const OPEN = [
    " _(_)_",
    "(_)@(_)",
    " (_)(_)"
];
const FLOWERS = [
    [
        OPEN,
        1,
        21,
        1,
        [
            2,
            4,
            3
        ]
    ],
    [
        [
            "    _",
            " _(_)",
            "(_)@",
            " (_)"
        ],
        1,
        31,
        1,
        [
            3,
            1,
            3
        ]
    ],
    [
        [
            " _ _",
            "(_@_)"
        ],
        2,
        37,
        2,
        [
            0,
            3,
            1
        ]
    ],
    [
        [
            " .-.",
            "(_@_)",
            " '|'"
        ],
        4,
        54,
        1,
        [
            0,
            1,
            3
        ]
    ],
    [
        [
            " _(_)",
            "(_)@(_)",
            "    (_)"
        ],
        12,
        56,
        2,
        [
            0,
            1,
            4
        ]
    ],
    [
        OPEN,
        16,
        30,
        0,
        [
            2,
            1,
            3
        ]
    ],
    [
        [
            " _ _",
            "(_@_)",
            " (_)"
        ],
        15,
        38,
        0,
        [
            2,
            1,
            3
        ]
    ],
    [
        [
            "(_)(_)",
            " (@)"
        ],
        8,
        11,
        1,
        [
            0,
            3,
            3
        ]
    ],
    [
        [
            "o"
        ],
        19,
        34,
        1,
        null
    ]
];
const TUMBLE = [
    "o",
    "°",
    "-",
    "~",
    "-",
    "°"
];
const hash = (a, b)=>{
    let h = Math.imul(a, 0x27d4eb2d) ^ Math.imul(b, 0x165667b1);
    h = Math.imul(h ^ h >>> 15, 0x85ebca6b);
    h = Math.imul(h ^ h >>> 13, 0xc2b2ae35);
    return ((h ^ h >>> 16) >>> 0) / 4294967296;
};
const gust = (t)=>{
    const x = ((t - 1) % GUST + GUST) % GUST;
    return x < BLOW ? Math.sin(Math.PI * x / BLOW) ** 2 : 0;
};
const blown = (t)=>{
    const n = Math.floor((t - 1) / GUST), x = t - 1 - n * GUST;
    return n * BLOW * 0.5 + (x < BLOW ? x / 2 - BLOW / (2 * Math.PI) * Math.sin(2 * Math.PI * x / BLOW) : BLOW / 2);
};
export default function cherryBlossom() {
    const { cols, rows } = meta;
    const wood = Array.from({
        length: rows
    }, (_, r)=>(WOOD[r] || "").padEnd(cols).split(""));
    const inside = (r, c)=>r >= 0 && r < rows && c >= 0 && c < cols;
    const shake = (k, t)=>{
        const flex = FLOWERS[k][3];
        return Math.round(Math.min(flex, flex * gust(t) * (0.8 + 0.35 * Math.sin(t * 8.5 + k * 2.3))));
    };
    const from = [
        0,
        1,
        3,
        2,
        7,
        0,
        4,
        1,
        3,
        7,
        2,
        0,
        5,
        6
    ];
    const petals = Array.from({
        length: PETALS
    }, (_, i)=>({
            t0: i % 2 ? Math.floor(i / 2) % 2 * GUST + 1.2 + hash(i, 2) * 2.2 : hash(i, 1) * LOOP,
            flower: from[i % from.length],
            fall: 0.42 + hash(i, 5) * 0.22,
            drag: 0.8 + hash(i, 6) * 0.5,
            spin: 1.2 + hash(i, 8) * 0.8,
            ph: hash(i, 9) * 6.3
        }));
    return (t)=>{
        const u = (t % LOOP + LOOP) % LOOP;
        const g = wood.map((row)=>row.slice());
        const loose = new Set();
        for (const p of petals)if ((u - p.t0 + LOOP) % LOOP < 3) loose.add(p.flower);
        FLOWERS.forEach(([art, r0, c0, , slot], k)=>{
            const dc = shake(k, t);
            art.forEach((line, i)=>{
                for(let j = line.search(/\S/); j < line.length; j++){
                    const gap = loose.has(k) && slot && i === slot[0] && j >= slot[1] && j < slot[1] + slot[2];
                    if (inside(r0 + i, c0 + j + dc) && line[j] !== " ") g[r0 + i][c0 + j + dc] = gap ? " " : line[j];
                }
            });
        });
        for (const p of petals){
            const [, r0, c0, , slot] = FLOWERS[p.flower];
            for(let k = 0; k < 2; k++){
                const age = (u - p.t0 + LOOP) % LOOP + k * LOOP;
                const x = c0 + slot[1] + 1 + shake(p.flower, t - age) + p.drag * (0.16 * age + 2.2 * (blown(t) - blown(t - age))) + 1.1 * Math.sin(age * 0.9 + p.ph);
                const y = r0 + slot[0] + 0.5 + p.fall * age + 0.3 * Math.sin(age * 1.9 + p.ph);
                const c = Math.floor(x), r = Math.floor(y);
                if (r >= rows || c >= cols) continue;
                if (!inside(r, c) || g[r][c] !== " ") continue;
                g[r][c] = TUMBLE[Math.floor(age * p.spin + p.ph) % TUMBLE.length];
            }
        }
        return g.map((row)=>row.join("")).join("\n");
    };
}
