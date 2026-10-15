// rule-30 — from ascii.rest by bas3line, MIT License (see LICENSE)
export const meta = {
    name: "rule 30",
    category: "generative",
    note: "one cell grows a row at a time under rules 30, 90 and 110",
    cols: 64,
    rows: 20,
    fps: 8
};
const RULES = [
    [
        30,
        31,
        32
    ],
    [
        90,
        31,
        32
    ],
    [
        110,
        51,
        40
    ]
];
const GAP = 12;
const SPEED = 8;
export default function rule30() {
    const { cols, rows } = meta;
    const EXTRA = 48;
    const W = cols + 2 * EXTRA;
    const tape = [];
    for (const [rule, at, gens] of RULES){
        let cur = new Uint8Array(W);
        let nxt = new Uint8Array(W);
        cur[EXTRA + at] = 1;
        for(let g = 0; g < gens; g++){
            tape.push(cur.slice(EXTRA, EXTRA + cols));
            for(let i = 1; i < W - 1; i++)nxt[i] = rule >> (cur[i - 1] << 2 | cur[i] << 1 | cur[i + 1]) & 1;
            [cur, nxt] = [
                nxt,
                cur
            ];
        }
        for(let g = 0; g < GAP; g++)tape.push(new Uint8Array(cols));
    }
    const LOOP = tape.length / 2;
    const GLYPH = [
        " ",
        "▀",
        "▄",
        "█"
    ];
    return (t)=>{
        const top = Math.floor(t * SPEED) - 2;
        const lines = [];
        for(let r = 0; r < rows; r++){
            const k = ((top + r) % LOOP + LOOP) % LOOP;
            const a = tape[2 * k], b = tape[2 * k + 1];
            let line = "";
            for(let c = 0; c < cols; c++)line += GLYPH[a[c] + 2 * b[c]];
            lines.push(line);
        }
        return lines.join("\n");
    };
}
