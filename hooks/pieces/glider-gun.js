// glider-gun — from ascii.rest by bas3line, MIT License (see LICENSE)
export const meta = {
    name: "glider gun",
    category: "generative",
    note: "gosper's gun firing a glider every 30 generations",
    cols: 56,
    rows: 20,
    fps: 10
};
const GUN = [
    "........................o",
    "......................o.o",
    "............oo......oo............oo",
    "...........o...o....oo............oo",
    "oo........o.....o...oo",
    "oo........o...o.oo....o.o",
    "..........o.....o.......o",
    "...........o...o",
    "............oo"
];
const EATER = [
    "oo",
    "o",
    ".ooo",
    "...o"
];
const PERIOD = 30;
export default function gliderGun() {
    const { cols, rows, fps } = meta;
    const PAD = 4;
    const GX = 2, GY = 2;
    const K = 30;
    const W = cols + 2 * PAD + 8;
    const H = rows * 2 + 2 * PAD + 8;
    let cur = new Uint8Array(W * H);
    let nxt = new Uint8Array(W * H);
    const place = (shape, x0, y0)=>shape.forEach((row, y)=>[
                ...row
            ].forEach((c, x)=>c === "o" && (cur[(PAD + y0 + y) * W + PAD + x0 + x] = 1)));
    place(GUN, GX, GY);
    place(EATER, GX + 28 + K, GY + 15 + K);
    const step = ()=>{
        for(let y = 1; y < H - 1; y++){
            for(let x = 1; x < W - 1; x++){
                const i = y * W + x;
                const n = cur[i - W - 1] + cur[i - W] + cur[i - W + 1] + cur[i - 1] + cur[i + 1] + cur[i + W - 1] + cur[i + W] + cur[i + W + 1];
                nxt[i] = n === 3 || n === 2 && cur[i] ? 1 : 0;
            }
        }
        [cur, nxt] = [
            nxt,
            cur
        ];
    };
    const GLYPH = [
        " ",
        "▀",
        "▄",
        "█"
    ];
    const text = ()=>{
        const lines = [];
        for(let r = 0; r < rows; r++){
            let line = "";
            const a = (PAD + 2 * r) * W + PAD;
            for(let c = 0; c < cols; c++)line += GLYPH[cur[a + c] + 2 * cur[a + W + c]];
            lines.push(line);
        }
        return lines.join("\n");
    };
    for(let g = 0; g < 4 * (K + 40) + 60; g++)step();
    const cycle = [];
    for(let g = 0; g < PERIOD; g++){
        cycle.push(text());
        step();
    }
    return (t)=>cycle[Math.floor(t * fps + 1e-6) % PERIOD];
}
