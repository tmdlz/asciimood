// epicycles — from ascii.rest by bas3line, MIT License (see LICENSE)
export const meta = {
    name: "epicycles",
    category: "generative",
    note: "a chain of turning circles whose tip traces a star",
    cols: 60,
    rows: 24,
    fps: 30
};
const TERMS = 16;
const PERIOD = 10;
const TRAIL = 0.9;
const FADE = 0.8;
const SAMPLES = 2400;
const ASPECT = 0.5;
const RIMS = [
    1
];
const JOINT = 1.5;
const PHASE = 0.12;
function star(n) {
    const v = [];
    for(let j = 0; j < 10; j++){
        const a = Math.PI / 2 + j * Math.PI / 5;
        const r = j % 2 ? 0.4 : 1;
        v.push([
            r * Math.cos(a),
            r * Math.sin(a)
        ]);
    }
    const pts = [];
    for(let i = 0; i < n; i++){
        const d = i / n * 10;
        const j = Math.floor(d), f = d - j;
        const [a, b] = [
            v[j],
            v[(j + 1) % 10]
        ];
        pts.push([
            a[0] + (b[0] - a[0]) * f,
            a[1] + (b[1] - a[1]) * f
        ]);
    }
    return pts;
}
function pen(dx, dy, f = 0.5) {
    let a = Math.atan2(dy, dx) * 180 / Math.PI;
    if (a < 0) a += 180;
    const flat = Math.min(a, 180 - a);
    if (flat < 8) return f < 0.62 ? "-" : "_";
    if (flat < 42) return f < 0.3 ? "'" : f < 0.68 ? "-" : "_";
    return a < 80 ? "/" : a < 100 ? "|" : "\\";
}
export default function epicycles() {
    const { cols, rows } = meta;
    const pts = star(500);
    const N = pts.length;
    const terms = [];
    for(let k = -40; k <= 40; k++){
        let re = 0, im = 0;
        for(let n = 0; n < N; n++){
            const a = -2 * Math.PI * k * n / N;
            const [x, y] = pts[n];
            re += x * Math.cos(a) - y * Math.sin(a);
            im += x * Math.sin(a) + y * Math.cos(a);
        }
        terms.push({
            k,
            re: re / N,
            im: im / N,
            r: Math.hypot(re, im) / N
        });
    }
    terms.sort((a, b)=>b.r - a.r);
    const chain = terms.slice(0, TERMS);
    const sum = (theta, upto)=>{
        let x = 0, y = 0;
        for(let j = 0; j < upto; j++){
            const { k, re, im } = chain[j];
            const c = Math.cos(k * theta), s = Math.sin(k * theta);
            x += re * c - im * s;
            y += re * s + im * c;
        }
        return [
            x,
            y
        ];
    };
    const path = [];
    let x0 = 1, x1 = -1, y0 = 1, y1 = -1;
    for(let i = 0; i < SAMPLES; i++){
        const [x, y] = sum(i / SAMPLES * 2 * Math.PI, TERMS);
        path.push([
            x,
            y
        ]);
        x0 = Math.min(x0, x), x1 = Math.max(x1, x), y0 = Math.min(y0, y), y1 = Math.max(y1, y);
    }
    const S = Math.min((cols - 8) / (x1 - x0), (rows - 2.3) / ASPECT / (y1 - y0));
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    const toCol = (x)=>cols / 2 + (x - mx) * S;
    const toRow = (y)=>rows / 2 - (y - my) * S * ASPECT;
    const P = path.map(([x, y])=>[
            toCol(x),
            toRow(y)
        ]);
    const cells = [], figure = new Set();
    const add = (c, r, i, g)=>{
        const last = cells[cells.length - 1];
        if (last && last.c === c && last.r === r) return;
        for(let p = last; p && Math.max(Math.abs(c - p.c), Math.abs(r - p.r)) > 1; p = cells[cells.length - 1])cells.push({
            c: p.c + Math.sign(c - p.c),
            r: p.r + Math.sign(r - p.r),
            i,
            g
        });
        cells.push({
            c,
            r,
            i,
            g
        });
    };
    for(let i = 0; i < SAMPLES; i++){
        const [ax, ay] = P[i], [bx, by] = P[(i + 1) % SAMPLES];
        const [px, py] = P[(i - 2 + SAMPLES) % SAMPLES], [nx, ny] = P[(i + 3) % SAMPLES];
        const steep = Math.abs(by - ay) > Math.abs(bx - ax);
        const [a, b] = steep ? [
            ay,
            by
        ] : [
            ax,
            bx
        ];
        for(let k = Math.ceil(Math.min(a, b) - 0.5); k + 0.5 < Math.max(a, b); k++){
            const s = (k + 0.5 - a) / (b - a), x = ax + (bx - ax) * s, y = ay + (by - ay) * s;
            const g = pen(nx - px, (py - ny) / ASPECT, y - Math.floor(y));
            steep ? add(Math.floor(x), k, i, g) : add(k, Math.floor(y), i, g);
        }
    }
    while(cells.length > 1 && cells[0].c === cells[cells.length - 1].c && cells[0].r === cells[cells.length - 1].r)cells.pop();
    for (const p of cells)figure.add(p.at = p.c + p.r * cols);
    const grid = new Array(cols * rows);
    const put = (c, r, ch)=>{
        if (c >= 0 && c < cols && r >= 0 && r < rows) grid[c + r * cols] = ch;
    };
    const dot = (x, y)=>{
        const c = Math.floor(x), r = Math.floor(y);
        if (c >= 0 && c < cols && r >= 0 && r < rows && !figure.has(c + r * cols)) grid[c + r * cols] = "·";
    };
    return (t)=>{
        grid.fill(" ");
        const u = (t / PERIOD + PHASE) % 1;
        const head = u * SAMPLES;
        const theta = u * 2 * Math.PI;
        const joints = [
            [
                toCol(0),
                toRow(0)
            ]
        ];
        for(let j = 1; j <= TERMS; j++){
            const [x, y] = sum(theta, j);
            if (j === TERMS || chain[j - 1].r * S > JOINT) joints.push([
                toCol(x),
                toRow(y)
            ]);
        }
        for (const j of RIMS){
            const a = chain[j].r * S, b = a * ASPECT, [pc, pr] = joints[j];
            for(let c = Math.ceil(pc - a - 0.5); c + 0.5 < pc + a; c++){
                const u = (c + 0.5 - pc) / a, s = Math.sqrt(1 - u * u);
                if (b / a * Math.abs(u) <= s) dot(c + 0.5, pr - b * s), dot(c + 0.5, pr + b * s);
            }
            for(let r = Math.ceil(pr - b - 0.5); r + 0.5 < pr + b; r++){
                const v = (r + 0.5 - pr) / b, s = Math.sqrt(1 - v * v);
                if (a / b * Math.abs(v) <= s) dot(pc - a * s, r + 0.5), dot(pc + a * s, r + 0.5);
            }
        }
        for(let j = 0; j + 1 < joints.length; j++){
            const [ax, ay] = joints[j], [bx, by] = joints[j + 1];
            for(let s = 1, n = Math.round(Math.max(Math.abs(bx - ax), Math.abs(by - ay))); s < n; s++)dot(ax + (bx - ax) * s / n, ay + (by - ay) * s / n);
        }
        for (const { at, i, g } of cells){
            const age = (head - i + SAMPLES) % SAMPLES / SAMPLES / TRAIL;
            if (age <= 1) grid[at] = age < FADE ? g : age < 0.95 ? ":" : ".";
        }
        put(Math.floor(joints[0][0]), Math.floor(joints[0][1]), "+");
        for (const j of RIMS)put(Math.floor(joints[j][0]), Math.floor(joints[j][1]), "o");
        const [tc, tr] = joints[joints.length - 1];
        put(Math.floor(tc), Math.floor(tr), "@");
        const lines = [];
        for(let r = 0; r < rows; r++)lines.push(grid.slice(r * cols, (r + 1) * cols).join(""));
        return lines.join("\n");
    };
}
