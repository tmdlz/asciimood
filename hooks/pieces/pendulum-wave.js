// pendulum-wave — from ascii.rest by bas3line, MIT License (see LICENSE)
export const meta = {
    name: "pendulum wave",
    category: "physics",
    note: "a row of pendulums drifting in and out of step, from above",
    cols: 67,
    rows: 19,
    fps: 30
};
const N = 21;
const GAP = 3;
const CYCLE = 150;
const BASE = 60;
const BLUR = 0.07;
const T0 = 1.5 * CYCLE / (N - 1);
export default function pendulumWave() {
    const { cols, rows } = meta;
    const left = Math.floor((cols - (N - 1) * GAP - 1) / 2);
    const mid = (rows - 1) / 2;
    const right = left + (N - 1) * GAP;
    const rail = new Array(cols).fill(" ");
    for(let c = left - 1; c <= right + 1; c++)rail[c] = "─";
    rail[left - 1] = "╶";
    rail[right + 1] = "╴";
    const out = new Array(cols * rows);
    const row = (n, t)=>1 + (1 - Math.cos(2 * Math.PI * (BASE + n) * t / CYCLE)) * (rows - 3) / 2;
    return (time)=>{
        const t = time + T0;
        out.fill(" ");
        for(let c = 0; c < cols; c++)out[mid * cols + c] = rail[c];
        for(let n = 0; n < N; n++){
            const c = left + n * GAP;
            const now = Math.round(row(n, t));
            const then = Math.round(row(n, t - BLUR));
            const [a, b] = now < then ? [
                now + 1,
                then
            ] : [
                then,
                now - 1
            ];
            for(let r = a; r <= b; r++)if (r !== mid) out[r * cols + c] = Math.abs(r - now) === 1 ? ":" : "·";
            out[now * cols + c] = "o";
        }
        const lines = [];
        for(let r = 0; r < rows; r++)lines.push(out.slice(r * cols, (r + 1) * cols).join(""));
        return lines.join("\n");
    };
}
