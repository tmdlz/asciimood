// twisted-ring — from ascii.rest by bas3line, MIT License (see LICENSE)
export const meta = {
    name: "twisted ring",
    category: "shapes",
    note: "a square ring twisted three quarters, so it has one face",
    cols: 46,
    rows: 21,
    fps: 30
};
const FACE = ".:+*#@";
const ASPECT = 0.5;
const R = 0.75, AP = 0.22;
const TWIST = 3;
const TILT = 0.92, EYE = 6, SCALE = 9.2;
const LIFT = 0.5;
const SPIN = 0.32, P0 = 0.4;
const LAPS = 720, ACROSS = 14;
const unit = (v)=>v.map((c)=>c / Math.hypot(...v));
const LIGHT = unit([
    -0.5,
    0.75,
    0.6
]);
const HALF = unit([
    LIGHT[0],
    LIGHT[1],
    LIGHT[2] + 1
]);
export default function twistedRing() {
    const { cols, rows } = meta;
    const W = cols * 2, H = rows * 2;
    const depth = new Float32Array(W * H);
    const tone = new Uint8Array(W * H);
    const ink = new Array(cols * rows);
    const near = new Float32Array(cols * rows);
    const ct = Math.cos(TILT), st = Math.sin(TILT);
    const lines = new Array(rows);
    const P = [
        0,
        0,
        0,
        0,
        0,
        0
    ], Q = [
        0,
        0,
        0
    ];
    return (t, { paper = false } = {})=>{
        const p = P0 + SPIN * t, cs = Math.cos(p), ss = Math.sin(p);
        const place = (ca, sa, qr, qy)=>{
            const x = (R + qr) * ca, z = (R + qr) * sa;
            const wx = cs * x + ss * z, z1 = -ss * x + cs * z;
            const wy = ct * qy - st * z1, wz = st * qy + ct * z1;
            const ooz = 1 / (EYE - wz), k = SCALE * EYE * ooz;
            P[0] = 2 * (cols / 2 + k * wx / ASPECT);
            P[1] = 2 * (rows / 2 - LIFT - k * wy);
            P[2] = ooz, P[3] = wx, P[4] = wy, P[5] = wz;
        };
        const normal = (ca, sa, n)=>{
            const ox = Math.cos(n) * ca, oz = Math.cos(n) * sa, z1 = -ss * ox + cs * oz;
            Q[0] = cs * ox + ss * oz, Q[1] = ct * Math.sin(n) - st * z1, Q[2] = st * Math.sin(n) + ct * z1;
        };
        const toward = ()=>-Q[0] * P[3] - Q[1] * P[4] + Q[2] * (EYE - P[5]) > 0;
        depth.fill(0);
        for(let i = 0; i < LAPS; i++){
            const a = i / LAPS * 2 * Math.PI - Math.PI, ca = Math.cos(a), sa = Math.sin(a);
            for(let f = 0; f < 4; f++){
                const n = TWIST * a / 4 + (2 * f + 1) * Math.PI / 4, cn = Math.cos(n), sn = Math.sin(n);
                normal(ca, sa, n);
                const d = Math.max(0, Q[0] * LIGHT[0] + Q[1] * LIGHT[1] + Q[2] * LIGHT[2]);
                const h = Q[0] * HALF[0] + Q[1] * HALF[1] + Q[2] * HALF[2];
                const k = h > 0.998 ? 5 : d < 0.2 ? 0 : d < 0.45 ? 1 : d < 0.7 ? 2 : d < 0.9 ? 3 : 4;
                for(let j = 0; j <= ACROSS; j++){
                    const s = 2 * j / ACROSS - 1;
                    place(ca, sa, AP * (cn - s * sn), AP * (sn + s * cn));
                    if (!toward()) continue;
                    const c = Math.floor(P[0]), r = Math.floor(P[1]);
                    if (c < 0 || c >= W || r < 0 || r >= H) continue;
                    const o = r * W + c;
                    if (P[2] > depth[o]) depth[o] = P[2], tone[o] = k;
                }
            }
        }
        ink.fill("");
        near.fill(0);
        const D = AP * Math.SQRT2, N = LAPS * 2;
        for(let f = 0; f < 4; f++){
            let px = 0, py = 0;
            for(let i = 0; i <= N; i++){
                const a = i / N * 2 * Math.PI - Math.PI, m = TWIST * a / 4 + f * Math.PI / 2;
                const ca = Math.cos(a), sa = Math.sin(a);
                place(ca, sa, D * Math.cos(m), D * Math.sin(m));
                const dx = P[0] - px, dy = P[1] - py;
                px = P[0], py = P[1];
                if (!i) continue;
                normal(ca, sa, m - Math.PI / 4);
                if (!toward()) continue;
                normal(ca, sa, m + Math.PI / 4);
                if (!toward()) continue;
                const c = Math.floor(px), r = Math.floor(py), o = r * W + c;
                if (c < 0 || c >= W || r < 0 || r >= H || !depth[o] || P[2] < depth[o] - 0.0025) continue;
                const cell = (r >> 1) * cols + (c >> 1);
                if (P[2] <= near[cell]) continue;
                near[cell] = P[2];
                const ang = Math.atan2(Math.abs(dy), Math.abs(dx) * ASPECT);
                ink[cell] = ang < 0.42 ? "-" : ang > 1.2 ? "|" : dx * dy < 0 ? "/" : "\\";
            }
        }
        for(let r = 0; r < rows; r++){
            let line = "";
            for(let c = 0; c < cols; c++){
                if (ink[r * cols + c]) {
                    line += ink[r * cols + c];
                    continue;
                }
                const o = 2 * r * W + 2 * c;
                let hits = 0, best = -1;
                for (const q of [
                    o,
                    o + 1,
                    o + W,
                    o + W + 1
                ]){
                    if (!depth[q]) continue;
                    hits++;
                    if (best < 0 || depth[q] > depth[best]) best = q;
                }
                line += hits < 2 ? " " : FACE[paper ? FACE.length - 1 - tone[best] : tone[best]];
            }
            lines[r] = line;
        }
        return lines.join("\n");
    };
}
