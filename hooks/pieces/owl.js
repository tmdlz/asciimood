// owl — from ascii.rest by bas3line, MIT License (see LICENSE)
export const meta = {
    name: "owl",
    category: "creatures",
    note: "an owl on a branch, blinking slowly and turning its head",
    cols: 41,
    rows: 24,
    fps: 12
};
const LOOP = 12;
const CX = 20;
const TURNS = [
    [
        2,
        2.5,
        0,
        -2
    ],
    [
        4.4,
        5.1,
        -2,
        0
    ],
    [
        7.4,
        7.9,
        0,
        2
    ],
    [
        9.8,
        10.5,
        2,
        0
    ]
];
const BLINKS = [
    0.6,
    6.1,
    6.9,
    11.2
];
const BLINK = 0.7;
const HEADS = [
    {
        top: [
            "          /\\                 /\\",
            "         /  \\_.--'''''''--._/  \\",
            "        /                       \\"
        ],
        eyes: [
            [
                11,
                0
            ],
            [
                22,
                0
            ]
        ],
        beak: 20
    },
    {
        top: [
            "           /\\                 /\\",
            "         _/  \\_.--'''''''--._/  \\",
            "        /                        |"
        ],
        eyes: [
            [
                12,
                0
            ],
            [
                24,
                1
            ]
        ],
        beak: 22
    },
    {
        top: [
            "            /\\                  /|",
            "         _./  \\_.--''''''''--._/ |",
            "        /                        |"
        ],
        eyes: [
            [
                13,
                0
            ],
            [
                26,
                1
            ]
        ],
        beak: 24
    }
];
const EYES = [
    [
        " .----. ",
        "/ .--. \\",
        "| (@@) |",
        "\\ `--' /",
        " `----' "
    ],
    [
        " .--. ",
        "/.--.\\",
        "|(@@)|",
        "\\`--'/",
        " `--' "
    ]
];
const HALF = [
    "       (\\",
    "      /  \\.",
    "     /  ( (\\",
    "    |  ( ( (|",
    "    |  ( ( ( \\",
    "    |  \\\\\\\\\\  \\",
    "    |  \\\\\\\\ \\  \\",
    "     \\  \\\\\\\\ \\  \\",
    "      \\  \\\\\\\\ \\  \\",
    "       `. \\\\\\\\ \\  `.",
    "         `-.\\\\\\ \\____"
];
const FLIP = {
    "/": "\\",
    "\\": "/",
    "(": ")",
    ")": "(",
    "`": "'"
};
const BODY = HALF.map((l)=>{
    l = l.padEnd(21);
    return l + [
        ...l.slice(0, 20)
    ].reverse().map((c)=>FLIP[c] || c).join("");
});
const BRANCH = [
    "=-==-===-==-==-=====-=-=====-==-=-==-=-=)",
    " `-.__.-'~~`--.__.--'   `--.__.-'~`-.__/ "
];
const STARS = [
    [
        2,
        1
    ],
    [
        5,
        0
    ],
    [
        1,
        5
    ],
    [
        37,
        0
    ],
    [
        39,
        3
    ],
    [
        36,
        6
    ],
    [
        39,
        11
    ]
];
const ease = (x)=>x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
const poseAt = (u)=>{
    let p = 0;
    for (const [a, b, from, to] of TURNS)if (u >= a) p = from + (to - from) * ease((u - a) / (b - a));
    return Math.round(p);
};
const lidAt = (u)=>{
    for (const s of BLINKS){
        const d = u - s;
        if (d >= 0 && d < BLINK) return d < 0.3 ? ease(d / 0.25) : 1 - ease((d - 0.3) / (BLINK - 0.3));
    }
    return 0;
};
export default function owl() {
    const { cols, rows } = meta;
    const blank = ()=>Array.from({
            length: rows
        }, ()=>new Array(cols).fill(" "));
    const grid = blank();
    const put = (x, y, s)=>{
        for(let i = 0; i < s.length; i++)if (x + i >= 0 && x + i < cols) grid[y][x + i] = s[i];
    };
    BODY.forEach((l, j)=>put(0, 9 + j, l));
    const span = (r, lo = 0, hi = cols - 1)=>{
        let a = CX, b = CX;
        while(a > lo && grid[r][a - 1] === " ")a--;
        while(b < hi && grid[r][b + 1] === " ")b++;
        return [
            a,
            b
        ];
    };
    for(let r = 10; r < 19; r++){
        const gap = r < 13 ? 4 : r < 16 ? 3 : 2, off = r & 1 ? Math.floor(gap / 2) : 0;
        const [a, b] = span(r);
        for(let c = a + 1; c < b; c++)if (((c - CX + off) % gap + gap) % gap === 0) grid[r][c] = "v";
    }
    for(let c = 10; c <= 30; c += 2)grid[9][c] = c & 2 ? "'" : "`";
    put(0, 20, BRANCH[0]);
    put(0, 21, BRANCH[1]);
    put(CX - 7, 20, "mm");
    put(CX + 6, 20, "mm");
    put(CX - 2, 21, "|||||");
    put(CX - 2, 22, "'''''");
    const base = grid.map((r)=>r.slice());
    const mirror = (s)=>[
            ...s.padEnd(cols)
        ].reverse().map((c)=>c === "`" ? c : FLIP[c] || c).join("");
    const pose = (k)=>{
        const h = HEADS[Math.abs(k)];
        if (k >= 0) return h;
        const eyes = h.eyes.map(([x, e])=>[
                cols - x - EYES[e][0].length,
                e
            ]).reverse();
        return {
            top: h.top.map(mirror),
            eyes,
            beak: cols - 1 - h.beak
        };
    };
    return (t)=>{
        const u = (t % LOOP + LOOP) % LOOP;
        const head = pose(poseAt(u)), lid = lidAt(u);
        for(let r = 0; r < rows; r++)for(let c = 0; c < cols; c++)grid[r][c] = base[r][c];
        STARS.forEach(([c, r], i)=>grid[r][c] = Math.sin(u * (2 * Math.PI / LOOP) * (i % 3 + 1) + i * 2) > 0.6 ? "+" : ".");
        head.top.forEach((l, j)=>[
                ...l
            ].forEach((c, i)=>c !== " " && (grid[1 + j][i] = c)));
        for(let r = 4; r < 9; r++)grid[r][7] = "|", grid[r][33] = "|";
        const [[x0, e0], [x1, e1]] = head.eyes;
        const eyeAt = (r, c)=>r >= 4 && c >= x0 && c < x1 + EYES[e1][0].length && (r > 4 || c < x0 + EYES[e0][0].length || c >= x1);
        for(let r = 3; r < 9; r++){
            const [a, b] = span(r, 6, 34);
            for(let c = a + 1; c < b; c++){
                if (r + c & 1 || eyeAt(r, c)) continue;
                grid[r][c] = (c >> 1) + r & 1 ? "'" : "`";
            }
        }
        for (const [x, e] of head.eyes){
            const eye = EYES[e].slice();
            const n = eye[0].length, m = n - 4;
            if (lid > 0.2) eye[1] = eye[1].slice(0, 2) + "_".repeat(m) + eye[1].slice(n - 2);
            if (lid > 0.6) eye[2] = eye[2].slice(0, 2) + "-".repeat(m) + eye[2].slice(n - 2);
            for(let j = 0; j < 5; j++)put(x, 4 + j, eye[j]);
        }
        grid[7][head.beak] = "V";
        return grid.map((r)=>r.join("")).join("\n");
    };
}
