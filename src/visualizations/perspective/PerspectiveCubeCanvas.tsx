import { useCallback, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Line, Circle, Group } from 'react-konva';

export type PerspectiveMode = 'two-point' | 'three-point';

type Props = {
  width: number;
  height: number;
  focal: number;
  mode: PerspectiveMode;
  cubes: Array<{
    rotationDeg: { x: number; y: number; z: number };
    position: { x: number; y: number; z: number };
  }>;
  selectedIndex?: number;
  onSelectIndex?: (index: number) => void;
  onCubesChange?: (next: Props['cubes']) => void;
  onlySelectedExtensions?: boolean;
  onChangeHorizon: (y: number) => void;
  horizonY: number;
};

export default function PerspectiveCubeCanvas(props: Props) {
  const { width: W, height: H, focal: f, mode, cubes, selectedIndex = 0, onSelectIndex, onCubesChange, onlySelectedExtensions = false, horizonY, onChangeHorizon } = props;
  const cubeList = Array.isArray(cubes) ? cubes : [];
  const cx = W / 2;
  // 3-point: make vanishing line coincide with horizonY.
  // For Rx(pitch): horizonY = cy - f * tan(pitch). Choose cy = H/2, so pitch = atan((H/2 - horizonY)/f).
  const camPitch = Math.atan(((H / 2) - horizonY) / (f || 1e-6));
  const cyProj = H / 2;
  const cyDraw = horizonY;

  const [dragging, setDragging] = useState<null | 'horizon' | { type: 'cube'; index: number; ctrl: boolean; start: { x: number; y: number }; pos0: { x: number; y: number; z: number } }>(null);
  const dragOffsetY = useRef(0);

  const size = 150;
  const half = size / 2;

  function buildObjectRotation(rotationDeg: { x: number; y: number; z: number }) {
    const rx = mode === 'two-point' ? 0 : toRad(rotationDeg.x);
    const ry = toRad(rotationDeg.y);
    const rz = mode === 'two-point' ? 0 : toRad(rotationDeg.z);
    return { rx, ry, rz };
  }

  const unitCube = useMemo(() => ([
    [-half, -half, -half], [half, -half, -half], [half, half, -half], [-half, half, -half],
    [-half, -half,  half], [half, -half,  half], [half, half,  half], [-half, half,  half],
  ] as Array<[number, number, number]>), [half]);

  const edges: Array<[number, number]> = [
    [0,1],[1,2],[2,3],[3,0], // back
    [4,5],[5,6],[6,7],[7,4], // front
    [0,4],[1,5],[2,6],[3,7], // sides
  ];

  const Rc = useMemo(() => Rx(camPitch), [camPitch]);

  const onMouseDown = useCallback((e: any) => {
    const pos = e.target.getStage()!.getPointerPosition()!;
    if (Math.abs(pos.y - horizonY) <= 6) {
      setDragging('horizon');
      dragOffsetY.current = pos.y - horizonY;
    }
  }, [horizonY]);

  const onMouseMove = useCallback((e: any) => {
    if (!dragging) return;
    const pos = e.target.getStage()!.getPointerPosition()!;
    if (dragging === 'horizon') {
      const ny = clamp(pos.y - dragOffsetY.current, 20, H - 20);
      onChangeHorizon(ny);
    } else if (dragging.type === 'cube') {
      if (!onCubesChange) return;
      const dx = pos.x - dragging.start.x;
      const dy = pos.y - dragging.start.y;
      const z = dragging.pos0.z || 1e-6;
      const scale = z / (f || 1);
      const idx = dragging.index;
      const next = cubeList.slice();
      const p0 = dragging.pos0;
      if (dragging.ctrl) {
        next[idx] = { ...next[idx], position: { x: p0.x + dx * scale, y: p0.y, z: p0.z + dy * scale } };
      } else {
        next[idx] = { ...next[idx], position: { x: p0.x + dx * scale, y: p0.y + dy * scale, z: p0.z } };
      }
      onCubesChange(next);
    }
  }, [H, dragging, onChangeHorizon, onCubesChange, cubeList, f]);

  const onMouseUp = useCallback(() => setDragging(null), []);

  // Precompute per-cube projected points and extended lines
  const cubesData = useMemo(() => {
    return cubeList.map((cube) => {
      const rot = buildObjectRotation(cube.rotationDeg);
      // Intrinsic XYZ (rotate around object's own axes X -> Y -> Z): R = Rx * Ry * Rz
      const Robj = multiplyMatrices(multiplyMatrices(Rx(rot.rx), Ry(rot.ry)), Rz(rot.rz));
      const vertices = unitCube.map(([x, y, z]) => {
        const world = applyTransform({ x, y, z }, Robj, cube.position);
        return applyRotation(world, Rc);
      });
      const projected = vertices.map(v => projectPoint(v, cx, cyProj, f));
      const extended = edges.map(([i, j]) => extendLineToRect(projected[i], projected[j], W, H));
      return { projected, extended };
    });
  }, [Rc, W, H, cx, cyProj, f, cubeList, unitCube]);

  return (
    <Stage width={W} height={H} onPointerDown={onMouseDown} onPointerMove={onMouseMove} onPointerUp={onMouseUp} style={{ background: '#fff', border: '1px solid #ccc', borderRadius: 8, boxShadow: '0 2px 10px rgba(0,0,0,.1)', touchAction: 'none' }}>
      <Layer>
        {/* horizon (drawn at user-controlled line) */}
        <Line points={[0, cyDraw, W, cyDraw]} stroke="#999" strokeWidth={2} />
      </Layer>
      {/* extended edges for each cube */}
      <Layer>
        {cubesData.map((cd, cubeIdx) => {
          if (onlySelectedExtensions && cubeIdx !== selectedIndex) return null;
          return (
            <Group key={`ext-cube-${cubeIdx}`}>
              {cd.extended.map((pts, idx) => (
                <Line key={`ext-${cubeIdx}-${idx}`} points={pts} stroke="#9aa6b2" strokeWidth={1} dash={[6,6]} />
              ))}
            </Group>
          );
        })}
      </Layer>
      {/* actual cube edges for each cube */}
      <Layer>
        {cubesData.map((cd, cubeIdx) => (
          <Group key={`edges-cube-${cubeIdx}`}>
            {edges.map(([i, j], idx) => (
              <Line key={`edge-${cubeIdx}-${idx}`} points={[cd.projected[i].x, cd.projected[i].y, cd.projected[j].x, cd.projected[j].y]} stroke={cubeIdx === selectedIndex ? "#222" : "#666"} strokeWidth={cubeIdx === selectedIndex ? 2 : 1.5} />
            ))}
          </Group>
        ))}
      </Layer>
      {/* interaction layer with invisible hit boxes for cubes */}
      <Layer>
        {cubesData.map((cd, cubeIdx) => {
          const xs = cd.projected.map(p => p.x);
          const ys = cd.projected.map(p => p.y);
          const minX = Math.min(...xs) - 8;
          const maxX = Math.max(...xs) + 8;
          const minY = Math.min(...ys) - 8;
          const maxY = Math.max(...ys) + 8;
          const w = Math.max(4, maxX - minX);
          const h = Math.max(4, maxY - minY);
          return (
            <Group key={`hit-${cubeIdx}`}>
              <Line
                points={[minX, minY, minX + w, minY, minX + w, minY + h, minX, minY + h, minX, minY]}
                closed
                fill="rgba(0,0,0,0.001)"
                listening
                onMouseDown={(e: any) => {
                  onSelectIndex && onSelectIndex(cubeIdx);
                  const pos = e.target.getStage()!.getPointerPosition()!;
                  const ctrl = !!(e.evt && (e.evt.ctrlKey || e.evt.metaKey));
                  setDragging({ type: 'cube', index: cubeIdx, ctrl, start: { x: pos.x, y: pos.y }, pos0: { ...cubeList[cubeIdx].position } });
                }}
              />
            </Group>
          );
        })}
      </Layer>
      <Layer>
        {/* handle for horizon hover */}
        <Circle x={W - 12} y={horizonY} radius={4} fill="#999" />
      </Layer>
    </Stage>
  );
}

// Math utils
function toRad(deg: number) { return (deg * Math.PI) / 180; }
function clamp(v: number, a: number, b: number) { return Math.max(a, Math.min(b, v)); }

type V3 = { x: number; y: number; z: number };
type M3 = [number, number, number, number, number, number, number, number, number];

function Rx(a: number): M3 {
  const c = Math.cos(a), s = Math.sin(a);
  return [1,0,0, 0,c,-s, 0,s,c];
}
function Ry(a: number): M3 {
  const c = Math.cos(a), s = Math.sin(a);
  return [c,0,s, 0,1,0, -s,0,c];
}
function Rz(a: number): M3 {
  const c = Math.cos(a), s = Math.sin(a);
  return [c,-s,0, s,c,0, 0,0,1];
}

function multiplyMatrices(A: M3, B: M3): M3 {
  const r: M3 = [0,0,0,0,0,0,0,0,0];
  r[0]=A[0]*B[0]+A[1]*B[3]+A[2]*B[6]; r[1]=A[0]*B[1]+A[1]*B[4]+A[2]*B[7]; r[2]=A[0]*B[2]+A[1]*B[5]+A[2]*B[8];
  r[3]=A[3]*B[0]+A[4]*B[3]+A[5]*B[6]; r[4]=A[3]*B[1]+A[4]*B[4]+A[5]*B[7]; r[5]=A[3]*B[2]+A[4]*B[5]+A[5]*B[8];
  r[6]=A[6]*B[0]+A[7]*B[3]+A[8]*B[6]; r[7]=A[6]*B[1]+A[7]*B[4]+A[8]*B[7]; r[8]=A[6]*B[2]+A[7]*B[5]+A[8]*B[8];
  return r;
}

function applyTransform(p: V3, R: M3, t: V3): V3 {
  return {
    x: R[0]*p.x + R[1]*p.y + R[2]*p.z + t.x,
    y: R[3]*p.x + R[4]*p.y + R[5]*p.z + t.y,
    z: R[6]*p.x + R[7]*p.y + R[8]*p.z + t.z,
  };
}

function applyRotation(p: V3, R: M3): V3 {
  return {
    x: R[0]*p.x + R[1]*p.y + R[2]*p.z,
    y: R[3]*p.x + R[4]*p.y + R[5]*p.z,
    z: R[6]*p.x + R[7]*p.y + R[8]*p.z,
  };
}

function projectPoint(p: V3, cx: number, cy: number, f: number) {
  // simple pinhole camera looking along -Z; assume p.z > 1 to avoid flip
  const z = p.z || 1e-6;
  return { x: cx + f * (p.x / z), y: cy + f * (p.y / z) };
}

function extendLineToRect(p1: { x: number; y: number }, p2: { x: number; y: number }, W: number, H: number) {
  const intersections: Array<{ x: number; y: number }> = [];
  const add = (pt: { x: number; y: number }) => {
    if (pt.x >= -1 && pt.x <= W+1 && pt.y >= -1 && pt.y <= H+1) intersections.push(pt);
  };
  const inter = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number) => {
    const den = (x1-x2)*(y3-y4) - (y1-y2)*(x3-x4);
    if (Math.abs(den) < 1e-9) return null;
    const px = ((x1*y2 - y1*x2)*(x3-x4) - (x1-x2)*(x3*y4 - y3*x4)) / den;
    const py = ((x1*y2 - y1*x2)*(y3-y4) - (y1-y2)*(x3*y4 - y3*x4)) / den;
    return { x: px, y: py };
  };
  const L = inter(p1.x, p1.y, p2.x, p2.y, 0,0, W,0); if (L) add(L);
  const R = inter(p1.x, p1.y, p2.x, p2.y, W,0, W,H); if (R) add(R);
  const B = inter(p1.x, p1.y, p2.x, p2.y, 0,H, W,H); if (B) add(B);
  const A = inter(p1.x, p1.y, p2.x, p2.y, 0,0, 0,H); if (A) add(A);
  if (intersections.length < 2) return [p1.x, p1.y, p2.x, p2.y];
  // pick two farthest apart to span canvas
  let best: [number, number] = [0,1];
  let bestD = -1;
  for (let i=0;i<intersections.length;i++) {
    for (let j=i+1;j<intersections.length;j++) {
      const dx = intersections[i].x - intersections[j].x;
      const dy = intersections[i].y - intersections[j].y;
      const d = dx*dx + dy*dy;
      if (d > bestD) { bestD = d; best = [i,j]; }
    }
  }
  const P = intersections[best[0]]; const Q = intersections[best[1]];
  return [P.x, P.y, Q.x, Q.y];
}


