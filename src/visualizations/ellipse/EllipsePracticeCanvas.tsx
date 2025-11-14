import { useMemo, useRef, useState } from 'react';
import { Stage, Layer, Line, Group } from 'react-konva';

type Pt = { x: number; y: number };

type Props = {
  width: number;
  height: number;
  onScore: (score: number) => void;
  seed?: number;
};

export default function EllipsePracticeCanvas({ width: W, height: H, onScore, seed }: Props) {
  const [quad, setQuad] = useState<Pt[]>(() => randomQuad(W, H, seed));
  const [stroke, setStroke] = useState<Pt[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  const Hmat = useMemo(() => homographyForUnitSquare(quad), [quad]);
  const expectedEllipse = useMemo(() => sampleProjectedCircle(Hmat, 240), [Hmat]); // polyline points

  const onPointerDown = (e: any) => {
    const pos = e.target.getStage()!.getPointerPosition()!;
    setIsDrawing(true);
    setStroke([pos]);
  };
  const onPointerMove = (e: any) => {
    if (!isDrawing) return;
    const pos = e.target.getStage()!.getPointerPosition()!;
    setStroke(prev => {
      const last = prev[prev.length - 1];
      if (!last) return [pos];
      const dx = pos.x - last.x, dy = pos.y - last.y;
      if (dx * dx + dy * dy < 2) return prev;
      return [...prev, pos];
    });
  };
  const onPointerUp = () => {
    setIsDrawing(false);
    if (stroke.length > 8) {
      const score = scoreStrokeAgainstCurve(stroke, expectedEllipse);
      onScore(score);
    } else {
      onScore(0);
    }
  };

  return (
    <Stage
      width={W}
      height={H}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{ background: '#fff', border: '1px solid #ccc', borderRadius: 8, boxShadow: '0 2px 10px rgba(0,0,0,.1)', touchAction: 'none' }}
    >
      <Layer>
        {/* square in perspective (quad) */}
        <Line
          points={quad.flatMap(p => [p.x, p.y])}
          closed
          fill="#f2f6ff"
          stroke="#2a5bd7"
          strokeWidth={2}
        />
        {/* expected ellipse (dashed) */}
        <Line
          points={expectedEllipse.flatMap(p => [p.x, p.y])}
          stroke="#c62828"
          strokeWidth={2}
          dash={[8, 6]}
          closed
        />
        {/* user's stroke */}
        {stroke.length > 1 && (
          <Line
            points={stroke.flatMap(p => [p.x, p.y])}
            stroke="#2e7d32"
            strokeWidth={3}
            lineCap="round"
            lineJoin="round"
          />
        )}
      </Layer>
    </Stage>
  );
}

// ===== Geometry helpers =====

function randomQuad(W: number, H: number, seed?: number): Pt[] {
  const rnd = mulberry32(typeof seed === 'number' ? seed : Date.now());
  const margin = 60;
  const pts = [
    { x: margin + rnd() * (W / 2 - margin), y: margin + rnd() * (H / 2 - margin) },
    { x: W - margin - rnd() * (W / 2 - margin), y: margin + rnd() * (H / 2 - margin) },
    { x: W - margin - rnd() * (W / 2 - margin), y: H - margin - rnd() * (H / 2 - margin) },
    { x: margin + rnd() * (W / 2 - margin), y: H - margin - rnd() * (H / 2 - margin) },
  ];
  return pts;
}

function homographyForUnitSquare(dst: Pt[]) {
  // src unit square corners in order: (-0.5,-0.5), (0.5,-0.5), (0.5,0.5), (-0.5,0.5)
  const src = [
    { x: -0.5, y: -0.5 },
    { x: 0.5, y: -0.5 },
    { x: 0.5, y: 0.5 },
    { x: -0.5, y: 0.5 },
  ];
  return computeHomography(src, dst);
}

function sampleProjectedCircle(H: number[], samples: number): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i < samples; i++) {
    const t = (i / samples) * Math.PI * 2;
    const x = 0.5 * Math.cos(t);
    const y = 0.5 * Math.sin(t);
    pts.push(applyH(H, { x, y }));
  }
  return pts;
}

function applyH(H: number[], p: Pt): Pt {
  const x = p.x, y = p.y;
  const X = H[0] * x + H[1] * y + H[2];
  const Y = H[3] * x + H[4] * y + H[5];
  const W = H[6] * x + H[7] * y + H[8];
  const iw = W !== 0 ? 1 / W : 1;
  return { x: X * iw, y: Y * iw };
}

function computeHomography(src: Pt[], dst: Pt[]) {
  // Solve for H (3x3) with DLT (8 equations)
  const A: number[][] = [];
  for (let i = 0; i < 4; i++) {
    const xs = src[i].x, ys = src[i].y, xd = dst[i].x, yd = dst[i].y;
    A.push([-xs, -ys, -1, 0, 0, 0, xs * xd, ys * xd, xd]);
    A.push([0, 0, 0, -xs, -ys, -1, xs * yd, ys * yd, yd]);
  }
  // Solve A * h = 0 via least squares (use simple SVD substitute with eigen of AtA)
  const At = transpose(A);
  const AtA = multiply(At, A);
  const eigVec = smallestEigenVector(AtA);
  return eigVec;
}

function transpose(M: number[][]) {
  const r = M.length, c = M[0].length;
  const T = Array.from({ length: c }, () => Array(r).fill(0));
  for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) T[j][i] = M[i][j];
  return T;
}
function multiply(A: number[][], B: number[][]) {
  const r = A.length, k = A[0].length, c = B[0].length;
  const R = Array.from({ length: r }, () => Array(c).fill(0));
  for (let i = 0; i < r; i++) {
    for (let j = 0; j < c; j++) {
      let s = 0;
      for (let t = 0; t < k; t++) s += A[i][t] * B[t][j];
      R[i][j] = s;
    }
  }
  return R;
}
function smallestEigenVector(M: number[][]): number[] {
  // Power iteration on inverse using simple gradient descent substitute
  // For stability, use Jacobi iterations approximation (not exact SVD but ok for 8x8)
  // Fallback: numeric approach with regularization
  const n = M.length;
  let v = Array(n).fill(0).map((_, i) => (i === n - 1 ? 1 : 0));
  const I = identity(n);
  const alpha = 1e-3;
  for (let it = 0; it < 2000; it++) {
    // gradient step: v = v - alpha * M * v; then normalize
    const Mv = matVec(M, v);
    const nv = v.map((vi, idx) => vi - alpha * Mv[idx]);
    const norm = Math.hypot(...nv);
    if (norm < 1e-12) break;
    v = nv.map(x => x / norm);
  }
  // reshape to 3x3
  const h = v;
  if (h.length !== 9) {
    // fallback vector
    const z = Array(9).fill(0);
    z[8] = 1;
    return z;
  }
  return h;
}
function identity(n: number) {
  const I = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) I[i][i] = 1;
  return I;
}
function matVec(M: number[][], v: number[]) {
  return M.map(row => row.reduce((s, a, i) => s + a * v[i], 0));
}

function scoreStrokeAgainstCurve(stroke: Pt[], curve: Pt[]) {
  if (stroke.length < 2 || curve.length < 2) return 0;
  // downsample stroke to N points
  const N = 200;
  const samp = resamplePolyline(stroke, N);
  const maxDim = Math.max(...curve.map(p => p.x)) - Math.min(...curve.map(p => p.x));
  const scale = Math.max(60, maxDim); // normalization
  let total = 0;
  for (let i = 0; i < samp.length; i++) {
    const d = pointToPolylineDist(samp[i], curve);
    total += d;
  }
  const avg = total / samp.length;
  const normalized = Math.min(1, Math.max(0, 1 - avg / (scale * 0.03))); // within ~3% of width
  return Math.round(normalized * 100);
}
function resamplePolyline(pts: Pt[], N: number) {
  const L = polylineLength(pts);
  if (L < 1e-6) return pts;
  const step = L / (N - 1);
  const res: Pt[] = [pts[0]];
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    const seg = Math.hypot(b.x - a.x, b.y - a.y);
    let t = 0;
    while (acc + seg * (1 - t) >= step) {
      const remain = step - acc;
      const ratio = remain / seg;
      const nx = a.x + (b.x - a.x) * (t + ratio);
      const ny = a.y + (b.y - a.y) * (t + ratio);
      res.push({ x: nx, y: ny });
      acc = 0;
      t += ratio;
    }
    acc += seg * (1 - t);
  }
  if (res.length < N) res.push(pts[pts.length - 1]);
  return res;
}
function polylineLength(pts: Pt[]) {
  let L = 0;
  for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  return L;
}
function pointToPolylineDist(p: Pt, curve: Pt[]) {
  let best = Infinity;
  for (let i = 1; i < curve.length; i++) {
    const d = pointToSegmentDist(p, curve[i - 1], curve[i]);
    if (d < best) best = d;
  }
  return best;
}
function pointToSegmentDist(p: Pt, a: Pt, b: Pt) {
  const abx = b.x - a.x, aby = b.y - a.y;
  const apx = p.x - a.x, apy = p.y - a.y;
  const ab2 = abx * abx + aby * aby;
  const t = ab2 > 0 ? Math.max(0, Math.min(1, (apx * abx + apy * aby) / ab2)) : 0;
  const nx = a.x + t * abx, ny = a.y + t * aby;
  return Math.hypot(p.x - nx, p.y - ny);
}

// simple seeded rng
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}


