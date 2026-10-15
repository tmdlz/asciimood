// tunnel — from ascii.rest by bas3line, MIT License (see LICENSE)
export const meta = {
    name: "tunnel",
    category: "effects",
    note: "flying down a tiled tube that bends and twists",
    cols: 64,
    rows: 24,
    fps: 30
};
const RAMP = " .,:;-=+*#%@";
const F = 18;
const AROUND = 10;
const ALONG = 0.55;
const DIM = 0.35;
const MORTAR = 0.1;
const GAP = 0.07;
const SPEED = 2.4;
const TWIST = 0.06;
const FOG = 2.8;
const BEND = 3;
const KEY = 0.12;
const SHARP = 0.7;
const wrap = (x)=>x - Math.floor(x);
const wave = (x, w)=>2 * (Math.abs(wrap((x - w / 2) / 2) - 0.5) - Math.abs(wrap((x + w / 2) / 2) - 0.5)) / w;
const ridge = (x, g)=>Math.floor(x + g) * 2 * g + Math.min(wrap(x + g), 2 * g);
const pulse = (x, w, g)=>(ridge(x + w / 2, g) - ridge(x - w / 2, g)) / w;
export default function tunnel() {
    const { cols, rows } = meta;
    const out = new Array(cols * rows);
    const W = cols + 1, H = rows + 1;
    const U = new Float64Array(W * H), V = new Float64Array(W * H), Z = new Float64Array(W * H), L = new Float64Array(W * H);
    const TAU = 2 * Math.PI;
    const turn = (d)=>d - AROUND * Math.round(d / AROUND);
    return (t, { paper = false } = {})=>{
        const ax = 0.42 * Math.sin(t * 0.55), ay = 0.26 * Math.sin(t * 0.9 + 1);
        const spin = t * 0.06;
        for(let r = 0; r < H; r++){
            for(let c = 0; c < W; c++){
                const sx = (c + 0.5 - cols / 2) / F;
                const sy = -((r + 0.5 - rows / 2) * 2) / F;
                let z = 1 / Math.max(1e-3, Math.hypot(sx, sy)), dx = sx, dy = sy;
                for(let k = 0; k < 4; k++){
                    const lean = 1 - Math.exp(-z / BEND);
                    dx = sx - ax * lean;
                    dy = sy - ay * lean;
                    z = Math.min(60, 1 / Math.max(1e-3, Math.hypot(dx, dy)));
                }
                const k = c + r * W;
                U[k] = (Math.atan2(dy, dx) / TAU + spin + z * TWIST) * AROUND;
                V[k] = z * ALONG + t * SPEED * ALONG;
                Z[k] = z;
                L[k] = Math.exp(-z / FOG) * (1 - KEY + KEY * (dx - dy) * z * Math.SQRT1_2);
            }
        }
        for(let r = 0; r < rows; r++){
            for(let c = 0; c < cols; c++){
                const k = c + r * W, z = Z[k];
                const wu = SHARP * Math.max(Math.abs(turn(U[k + 1] - U[k])), Math.abs(turn(U[k + W] - U[k])), 0.01);
                const wv = SHARP * Math.max(Math.abs(V[k + 1] - V[k]), Math.abs(V[k + W] - V[k]), 0.01);
                const light = 0.5 - 0.5 * wave(U[k], wu) * wave(V[k], wv);
                const gu = Math.min(GAP, z * AROUND / (4 * Math.PI * F)), gv = Math.min(GAP, z * z * ALONG / F);
                const mortar = 1 - (1 - pulse(U[k], wu, gu)) * (1 - pulse(V[k], wv, gv));
                const b = ((DIM + (1 - DIM) * light) * (1 - mortar) + MORTAR * mortar) * L[k] * 1.25;
                const i = Math.min(RAMP.length - 1, Math.round(Math.max(0, b) ** 0.8 * (RAMP.length - 1)));
                out[c + r * cols] = RAMP[paper ? RAMP.length - 1 - i : i];
            }
        }
        const lines = [];
        for(let r = 0; r < rows; r++)lines.push(out.slice(r * cols, (r + 1) * cols).join(""));
        return lines.join("\n");
    };
}
