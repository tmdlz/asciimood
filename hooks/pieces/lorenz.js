// lorenz — from ascii.rest by bas3line, MIT License (see LICENSE)
export const meta = {
    name: "lorenz attractor",
    category: "physics",
    note: "one lorenz trajectory looping both wings, older loops fading",
    cols: 60,
    rows: 22,
    fps: 30
};
const RAMP = " .:-=+*";
const DT = 0.004;
const RATE = 125;
const TRAIL = 2400;
const LEAD = 26;
const TILT = 0.3;
const FACE = 2.36;
const SWAY = 0.6;
const SWAY_T = 48;
const KNEE = 0.8;
const AGE = 1.5;
const FAR = 0.3;
const PASS = 0.06;
export default function lorenz() {
    const { cols, rows } = meta;
    const pts = new Float32Array(TRAIL * 3);
    let x = 1, y = 1, z = 1, head = 0;
    const f = (x, y, z)=>[
            10 * (y - x),
            x * (28 - z) - y,
            x * y - 8 / 3 * z
        ];
    const step = ()=>{
        const [a1, b1, c1] = f(x, y, z);
        const [a2, b2, c2] = f(x + DT / 2 * a1, y + DT / 2 * b1, z + DT / 2 * c1);
        const [a3, b3, c3] = f(x + DT / 2 * a2, y + DT / 2 * b2, z + DT / 2 * c2);
        const [a4, b4, c4] = f(x + DT * a3, y + DT * b3, z + DT * c3);
        x += DT / 6 * (a1 + 2 * a2 + 2 * a3 + a4);
        y += DT / 6 * (b1 + 2 * b2 + 2 * b3 + b4);
        z += DT / 6 * (c1 + 2 * c2 + 2 * c3 + c4);
        pts[head * 3] = x;
        pts[head * 3 + 1] = y;
        pts[head * 3 + 2] = z;
        head = (head + 1) % TRAIL;
    };
    for(let i = 0; i < 24000; i++)step();
    const ct = Math.cos(TILT), st = Math.sin(TILT);
    const halfH = (rows - 3) / 2, halfW = cols / 2 - 2.5;
    const k = 4 * halfH / 33.5, mid = 1.3;
    const ease = (a)=>{
        const m = Math.abs(a);
        return m <= KNEE ? a : Math.sign(a) * (KNEE + (1 - KNEE) * Math.tanh((m - KNEE) / (1 - KNEE)));
    };
    const ink = new Float32Array(cols * rows);
    const tip = new Uint8Array(cols * rows);
    let last = 0, owed = 0;
    return (t)=>{
        owed += Math.min(Math.max(t - last, 0), 0.1) * RATE;
        last = t;
        for(; owed >= 1; owed--)step();
        const turn = FACE + SWAY * Math.sin(2 * Math.PI * t / SWAY_T);
        const c = Math.cos(turn), s = Math.sin(turn);
        ink.fill(0);
        tip.fill(0);
        let sum = 0;
        for(let n = 0; n < TRAIL; n++){
            const v = pts[n * 3] * s + pts[n * 3 + 1] * c;
            sum += v * v;
        }
        const deep = 1 / (3 * Math.sqrt(sum / TRAIL));
        let hc = 0, prev = -1;
        for(let n = 0; n < TRAIL; n++){
            const i = (head + n) % TRAIL * 3;
            const u = pts[i] * c - pts[i + 1] * s;
            const v = pts[i] * s + pts[i + 1] * c;
            const h = (pts[i + 2] - 25) * ct - v * st;
            const col = Math.round(cols / 2 - 0.5 + ease(u * k / halfW) * halfW);
            const row = Math.round(rows / 2 - 0.5 - ease((h - mid) * k * 0.5 / halfH) * halfH);
            if (col < 0 || col >= cols || row < 0 || row >= rows) continue;
            const q = row * cols + col;
            const age = n / TRAIL, near = Math.min(1, Math.max(0, 0.5 - v * deep));
            const w = Math.pow(age, AGE) * (FAR + (1 - FAR) * near * near);
            if (q !== prev) ink[q] = Math.max(ink[q], w) + (ink[q] > 0 ? PASS : 0);
            prev = q;
            if (n >= TRAIL - LEAD) tip[q] = 1;
            hc = q;
        }
        let out = "";
        for(let r = 0; r < rows; r++){
            if (r) out += "\n";
            for(let q = 0; q < cols; q++){
                const i = r * cols + q;
                if (i === hc) out += "@";
                else if (tip[i]) out += "#";
                else out += RAMP[Math.min(RAMP.length - 1, Math.floor(ink[i] * RAMP.length))];
            }
        }
        return out;
    };
}
