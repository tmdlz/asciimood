// falling-sand — from ascii.rest by bas3line, MIT License (see LICENSE)
export const meta = {
    name: "falling sand",
    category: "physics",
    note: "sand pouring into a heap, then draining through the shelf",
    cols: 55,
    rows: 22,
    fps: 20
};
const STEPS = 4;
const RATE = 0.92;
const LAYER = 150;
const WARM = 290;
function mulberry32(seed) {
    let s = seed | 0;
    return ()=>{
        s = s + 0x6d2b79f5 | 0;
        let t = Math.imul(s ^ s >>> 15, 1 | s);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}
export default function fallingSand() {
    const { cols, rows } = meta;
    const W = cols, H = rows * 2;
    const SHELF = H - 2;
    const MID = (W - 1) / 2, END = 5;
    const OPEN = MID - END + 0.5;
    const NOZZLE = 5;
    const rand = mulberry32(7);
    const grid = new Uint8Array(W * H);
    const moved = new Int32Array(W * H).fill(-9);
    let step = 0, phase = "pour", clock = 0, slide = 0, shade = 0, poured = 0, spilled = 0, held = 0;
    const solid = (x, y)=>y >= SHELF && x >= END && x <= W - 1 - END && Math.abs(x - MID) >= slide;
    const free = (x, y)=>y < H && (x < 0 || x >= W || !grid[y * W + x] && !solid(x, y));
    const move = (a, x, y)=>{
        if (x >= 0 && x < W) {
            grid[y * W + x] = grid[a];
            moved[y * W + x] = step;
        }
        grid[a] = 0;
    };
    const tick = ()=>{
        step++;
        let top = H;
        held = 0;
        for(let y = H - 1; y >= 0; y--){
            const flip = step + y & 1;
            for(let i = 0; i < W; i++){
                const x = flip ? W - 1 - i : i, a = y * W + x;
                if (!grid[a] || moved[a] === step) continue;
                held++;
                if (y === H - 1) {
                    grid[a] = 0;
                    spilled++;
                    continue;
                }
                if (free(x, y + 1)) {
                    move(a, x, y + 1);
                    continue;
                }
                const d = rand() < 0.5 ? -1 : 1;
                if (free(x + d, y + 1)) move(a, x + d, y + 1);
                else if (free(x - d, y + 1)) move(a, x - d, y + 1);
                else if (rand() < 0.35 && free(x + d, y) && free(x + 2 * d, y + 1)) move(a, x + d, y);
                else if (moved[a] < step - 2 && y < top) top = y;
            }
        }
        if (rand() < RATE && free(MID, NOZZLE)) {
            grid[NOZZLE * W + MID] = 1 + shade;
            moved[NOZZLE * W + MID] = step;
        }
        if (++poured % LAYER === 0) shade ^= 1;
        if (phase === "pour" && (spilled > 50 || top < NOZZLE + 10)) phase = "hold", clock = 0;
        else if (phase === "hold" && ++clock > 40) phase = "open";
        else if (phase === "open") {
            slide = Math.min(OPEN, slide + 0.35);
            if (slide === OPEN && held < 110) phase = "close", spilled = 0;
        } else if (phase === "close") {
            slide = Math.max(0, slide - 0.5);
            if (!slide) phase = "pour";
        }
    };
    for(let i = 0; i < WARM; i++)tick();
    let last = 0;
    return (t)=>{
        const n = Math.min(12, Math.max(0, Math.round((t - last) * meta.fps)));
        last += n / meta.fps;
        for(let i = 0; i < n * STEPS; i++)tick();
        const lines = [];
        const rests = (x, y)=>y < H && (solid(x, y) || x >= 0 && x < W && grid[y * W + x] && moved[y * W + x] < step - 2);
        const air = (x, y)=>grid[y * W + x] && moved[y * W + x] >= step - 2 && !rests(x, y + 1) && !rests(x - 1, y + 1) && !rests(x + 1, y + 1);
        for(let r = 0; r < rows; r++){
            let line = "";
            for(let c = 0; c < W; c++){
                const a = 2 * r * W + c, b = a + W;
                if (solid(c, 2 * r)) {
                    line += "▀";
                    continue;
                }
                const fa = air(c, 2 * r), fb = air(c, 2 * r + 1);
                const sa = grid[a] && !fa, sb = grid[b] && !fb;
                if (c === MID && (fa || fb) && !sa && !sb) line += "┊";
                else if (sa && (sb || fb)) line += grid[a] === 1 ? "█" : "▓";
                else if (sb && fa) line += "█";
                else if (sa) line += "▀";
                else if (sb) line += "▄";
                else if (fa && fb) line += ":";
                else if (fa) line += "'";
                else if (fb) line += ".";
                else line += " ";
            }
            lines.push(line);
        }
        const p = MID - 2, fill = "░";
        const put = (r, at, s)=>lines[r] = lines[r].slice(0, at) + s + lines[r].slice(at + s.length);
        put(0, p - 1, "│" + fill.repeat(5) + "│");
        put(1, p - 1, "╰╮" + fill.repeat(3) + "╭╯");
        put(2, p, " ╰" + fill + "╯ ");
        put(rows - 1, END - 1, "▐");
        put(rows - 1, W - END, "▌");
        return lines.join("\n");
    };
}
