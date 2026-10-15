// gyroscope — from ascii.rest by bas3line, MIT License (see LICENSE)
export const meta = {
    name: "gyroscope",
    category: "shapes",
    note: "gimbals swing round a spinning rotor whose axle holds still",
    cols: 60,
    rows: 32,
    fps: 30
};
const RAMP = ".,-:;=+*#%@";
const TAU = Math.PI * 2;
const rx = (a)=>{
    const c = Math.cos(a), s = Math.sin(a);
    return [
        1,
        0,
        0,
        0,
        c,
        -s,
        0,
        s,
        c
    ];
};
const ry = (a)=>{
    const c = Math.cos(a), s = Math.sin(a);
    return [
        c,
        0,
        s,
        0,
        1,
        0,
        -s,
        0,
        c
    ];
};
const mul = (A, B)=>{
    const M = [];
    for(let i = 0; i < 3; i++)for(let j = 0; j < 3; j++)M.push(A[i * 3] * B[j] + A[i * 3 + 1] * B[3 + j] + A[i * 3 + 2] * B[6 + j]);
    return M;
};
const unit = (x, y, z)=>{
    const m = Math.hypot(x, y, z);
    return [
        x / m,
        y / m,
        z / m
    ];
};
export default function gyroscope() {
    const { cols, rows } = meta;
    const K2 = 8;
    const K1 = 22 * K2;
    const RO = 1, RM = 0.74, RI = 0.5, TUBE = 0.065;
    const ROTOR = 0.35, HALF = 0.07, RIM = 0.26;
    const axle = unit(-0.55, 0.42, -0.72);
    const view = rx(-0.3);
    const L = unit(-0.5, 0.8, -0.6);
    const H = unit(L[0], L[1], L[2] - 1);
    const out = new Array(cols * rows);
    const depth = new Float32Array(cols * rows);
    const part = new Uint8Array(cols * rows);
    const gap = [];
    const N = 14;
    const CV = [], SV = [];
    for(let j = 0; j < N; j++)CV.push(Math.cos(j / N * TAU)), SV.push(Math.sin(j / N * TAU));
    let W = view;
    let id = 0;
    let gain = 1;
    let paper = false;
    const plot = (x, y, z, nx, ny, nz, k = 1)=>{
        const X = W[0] * x + W[1] * y + W[2] * z;
        const Y = W[3] * x + W[4] * y + W[5] * z;
        const Z = W[6] * x + W[7] * y + W[8] * z;
        const ooz = 1 / (K2 + Z);
        const col = Math.floor(cols / 2 + K1 * ooz * X);
        const row = Math.floor(rows / 2 - 2 - K1 * 0.5 * ooz * Y);
        if (col < 0 || col >= cols || row < 0 || row >= rows) return;
        const c = col + row * cols;
        if (ooz <= depth[c]) return;
        depth[c] = ooz;
        part[c] = id;
        let NX = W[0] * nx + W[1] * ny + W[2] * nz;
        let NY = W[3] * nx + W[4] * ny + W[5] * nz;
        let NZ = W[6] * nx + W[7] * ny + W[8] * nz;
        const m = (NZ > 0 ? -1 : 1) / Math.hypot(NX, NY, NZ);
        NX *= m, NY *= m, NZ *= m;
        const diff = ((NX * L[0] + NY * L[1] + NZ * L[2] + 1) / 2) ** 2;
        const spec = Math.max(0, NX * H[0] + NY * H[1] + NZ * H[2]) ** 24;
        const near = 0.55 + 0.45 * Math.min(1, Math.max(0, 0.5 - 0.6 * Z));
        const i = Math.round(Math.min(1, (0.08 + 0.7 * diff + 0.45 * spec) * near * k * gain) * (RAMP.length - 1));
        out[c] = RAMP[paper ? RAMP.length - 1 - i : i];
    };
    const ring = (R, steps)=>{
        for(let i = 0; i < steps; i++){
            const cu = Math.cos(i / steps * TAU), su = Math.sin(i / steps * TAU);
            for(let j = 0; j < N; j++){
                const h = R + TUBE * CV[j];
                plot(h * cu, h * su, TUBE * SV[j], CV[j] * cu, CV[j] * su, SV[j]);
            }
        }
    };
    const pin = (ax, a, b, r)=>{
        gain = 1.5;
        const n = Math.ceil(Math.abs(b - a) / 0.02);
        for(let i = 0; i <= n; i++){
            const s = a + (b - a) * i / n;
            for(let j = 0; j < N; j++){
                if (ax === 0) plot(s, r * CV[j], r * SV[j], 0, CV[j], SV[j]);
                else plot(r * CV[j], s, r * SV[j], CV[j], 0, SV[j]);
            }
        }
        gain = 1;
    };
    const disc = (y, r, h)=>{
        for(let k = 0; k < 120; k++){
            const ca = Math.cos(k / 120 * TAU), sa = Math.sin(k / 120 * TAU);
            for(let p = 0; p <= r; p += 0.02)plot(p * ca, y + h, p * sa, 0.12 * ca * (p / r), 1, 0.12 * sa * (p / r));
            for(let s = -h; s <= h; s += 0.02)plot(r * ca, y + s, r * sa, ca, 0, sa);
        }
    };
    const rotor = ()=>{
        for(let k = 0; k < 160; k++){
            const th = k / 160 * TAU;
            const ca = Math.cos(th), sa = Math.sin(th);
            const spoke = Math.min(th, TAU - th) < 0.22;
            for(let p = 0; p <= ROTOR + 1e-9; p += 0.012){
                const f = p / ROTOR;
                const bev = f > 1 - RIM ? 0.9 * (f - 1 + RIM) / RIM : 0;
                const shade = spoke && f > 0.3 && f < 0.95 ? 0.35 : 1.35;
                plot(HALF, p * ca, p * sa, 1, bev * ca, bev * sa, shade);
                plot(-HALF, p * ca, p * sa, -1, bev * ca, bev * sa, shade);
            }
            for(let x = -HALF; x <= HALF + 1e-9; x += 0.02)plot(x, ROTOR * ca, ROTOR * sa, 0, ca, sa);
        }
        id = 0;
        pin(0, -HALF - 0.05, HALF + 0.05, 0.065);
        pin(0, -RI - 0.1, RI + 0.1, 0.05);
        pin(0, RI - 0.06, RI + 0.04, 0.07);
        pin(0, -RI - 0.04, -RI + 0.06, 0.07);
    };
    return (t, env = {})=>{
        paper = !!env.paper;
        out.fill(" ");
        depth.fill(0);
        part.fill(0);
        const a = 0.9 * Math.sin((t / 8 - 1 / 12) * TAU);
        const ca = Math.cos(a), sa = Math.sin(a);
        const wx = ca * axle[0] - sa * axle[2];
        const wy = axle[1];
        const wz = sa * axle[0] + ca * axle[2];
        const c = Math.acos(Math.max(-1, Math.min(1, wx)));
        const b = Math.atan2(wy, -wz);
        const Mo = mul(view, ry(a));
        const Mm = mul(Mo, rx(b));
        const Mi = mul(Mm, ry(c));
        const Mr = mul(Mi, rx(t * 1.25 * TAU));
        W = view;
        id = 0;
        pin(1, RO, RO + 0.13, 0.04);
        pin(1, RO + 0.13, RO + 0.2, 0.07);
        pin(1, -RO - 0.13, -RO, 0.04);
        pin(1, -1.4, -RO - 0.1, 0.055);
        disc(-1.42, 0.12, 0.02);
        disc(-1.46, 0.38, 0.025);
        W = Mo;
        pin(0, RM, RO, 0.032);
        pin(0, -RO, -RM, 0.032);
        id = 1;
        ring(RO, 400);
        W = Mm;
        id = 0;
        pin(1, RI, RM, 0.032);
        pin(1, -RM, -RI, 0.032);
        id = 2;
        ring(RM, 320);
        W = Mi;
        id = 3;
        ring(RI, 240);
        W = Mr;
        id = 4;
        rotor();
        gap.length = 0;
        for(let k = 0; k < cols * rows; k++){
            if (!part[k]) continue;
            const x = k % cols;
            for (const n of [
                x > 0 ? k - 1 : -1,
                x < cols - 1 ? k + 1 : -1
            ])if (n >= 0 && n < cols * rows && part[n] && part[n] !== part[k] && depth[n] > depth[k] + 0.0008) gap.push(k);
        }
        for (const k of gap)out[k] = " ";
        const lines = [];
        for(let r = 0; r < rows; r++)lines.push(out.slice(r * cols, (r + 1) * cols).join(""));
        return lines.join("\n");
    };
}
