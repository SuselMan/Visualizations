import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Rect, Line, Circle, Group } from 'react-konva';

export type Square = { x: number; y: number; size: number; color: string };

type Props = {
  width: number;
  height: number;
  squares: Square[];
  onSquaresChange: (squares: Square[], activeIdx?: number) => void;
  selectedIndex: number;
  onSelectIndex: (idx: number) => void;
  sensitivity: number;
  onSensitivityChange: (v: number) => void;
};

type Dragging =
  | null
  | 'light'
  | 'horizon'
  | 'projection'
  | { type: 'square'; index: number };

export default function LightShadowCanvas(props: Props) {
  const { width: W, height: H, squares, onSquaresChange, selectedIndex, onSelectIndex, sensitivity } = props;

  const [horizonY, setHorizonY] = useState(H / 2);
  const [light, setLight] = useState({ x: W * 0.7, y: H * 0.25 });
  const [projectionY, setProjectionY] = useState(horizonY);

  const circleBaseR = 10;
  const circleDynamicR = useMemo(() => {
    const minY = horizonY;
    const maxY = H - 10;
    const k = clamp((projectionY - minY) / (maxY - minY), 0, 1);
    return circleBaseR * (1 + sensitivity * k);
  }, [H, horizonY, projectionY, sensitivity]);

  const [dragging, setDragging] = useState<Dragging>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Delete') {
        if (!squares.length) return;
        if (selectedIndex < 0 || selectedIndex >= squares.length) return;
        const next = squares.slice();
        next.splice(selectedIndex, 1);
        onSquaresChange(next, Math.max(0, selectedIndex - 1));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onSquaresChange, selectedIndex, squares]);

  const proj = useMemo(() => ({ x: light.x, y: projectionY }), [light.x, projectionY]);

  const onMouseDown = useCallback((pos: { x: number; y: number }) => {
    if (hitCircle(pos.x, pos.y, light.x, light.y, circleDynamicR + 6)) {
      setDragging('light');
      dragOffset.current = { x: pos.x - light.x, y: pos.y - light.y };
      return;
    }
    if (hitCircle(pos.x, pos.y, proj.x, proj.y, circleDynamicR + 6)) {
      setDragging('projection');
      dragOffset.current = { x: 0, y: pos.y - projectionY };
      return;
    }
    if (Math.abs(pos.y - horizonY) <= 6) {
      setDragging('horizon');
      dragOffset.current = { x: 0, y: pos.y - horizonY };
      return;
    }
    const idx = hitSquareAt(pos.x, pos.y, squares);
    if (idx !== -1) {
      const s = squares[idx];
      const next = squares.slice();
      next.splice(idx, 1);
      next.push(s);
      onSquaresChange(next, next.length - 1);
      setDragging({ type: 'square', index: next.length - 1 });
      dragOffset.current = { x: pos.x - s.x, y: pos.y - s.y };
      return;
    }
  }, [circleDynamicR, horizonY, light.x, light.y, onSquaresChange, proj.x, proj.y, projectionY, squares]);

  const onMouseMove = useCallback((pos: { x: number; y: number }) => {
    if (!dragging) return;
    if (dragging === 'light') {
      const nx = clamp(pos.x - dragOffset.current.x, 10, W - 10);
      const ny = Math.min(pos.y - dragOffset.current.y, horizonY - 20);
      setLight({ x: nx, y: ny });
      return;
    }
    if (dragging === 'projection') {
      const ny = clamp(pos.y - dragOffset.current.y, horizonY, H - 10);
      setProjectionY(ny);
      return;
    }
    if (dragging === 'horizon') {
      const ny = clamp(pos.y - dragOffset.current.y, 20, H - 20);
      setHorizonY(ny);
      setLight((l: { x: number; y: number }) => ({ x: l.x, y: l.y >= ny - 20 ? ny - 20 : l.y }));
      setProjectionY((py: number) => (py < ny ? ny : py));
      return;
    }
    if (dragging.type === 'square') {
      const idx = dragging.index;
      const s = squares[idx];
      if (!s) return;
      const nx = clamp(pos.x - dragOffset.current.x, 10, W - s.size - 10);
      const ny = clamp(pos.y - dragOffset.current.y, 10, H - s.size - 10);
      const next = squares.slice();
      next[idx] = { ...s, x: nx, y: ny };
      onSquaresChange(next, idx);
      return;
    }
  }, [H, W, dragging, horizonY, onSquaresChange, squares]);

  const onMouseUp = useCallback(() => setDragging(null), []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Stage
        width={W}
        height={H}
        onMouseDown={(e: any) => onMouseDown(e.target.getStage()!.getPointerPosition()!)}
        onMouseMove={(e: any) => onMouseMove(e.target.getStage()!.getPointerPosition()!)}
        onMouseUp={onMouseUp}
        style={{ background: '#fff', border: '1px solid #ccc', borderRadius: 8, boxShadow: '0 2px 10px rgba(0,0,0,.1)' }}
      >
        <Layer>
          {/* horizon */}
          <Line points={[0, horizonY, W, horizonY]} stroke="#999" strokeWidth={2} />

          {/* light glow */}
          <Circle x={light.x} y={light.y} radius={circleDynamicR * 4} fillRadialGradientStartPoint={{ x: 0, y: 0 }} fillRadialGradientStartRadius={0} fillRadialGradientEndPoint={{ x: 0, y: 0 }} fillRadialGradientEndRadius={circleDynamicR * 4} fillRadialGradientColorStops={[0, 'rgba(255,255,200,0.9)', 1, 'rgba(255,255,200,0)']} />
          <Circle x={light.x} y={light.y} radius={circleDynamicR} fill="#fff9c4" stroke="#333" strokeWidth={2} />

          {/* projection marker */}
          <Circle x={proj.x} y={proj.y} radius={circleDynamicR} fill="#ffd6b0" stroke="#333" strokeWidth={2} />
          <Line points={[proj.x, horizonY, proj.x, H - 10]} stroke="#bbb" dash={[4, 4]} />

          {/* squares and their shadows (base layer) */}
          {squares.map((s, i) => (
            <Group key={i}>
              {/* square */}
              <Rect x={s.x} y={s.y} width={s.size} height={s.size} fill={s.color} stroke={i === selectedIndex ? '#000' : '#333'} strokeWidth={i === selectedIndex ? 3 : 2} onMouseDown={() => onSelectIndex(i)} />
              {/* selection handles */}
              {i === selectedIndex && (
                <Group>
                  {cornerPoints(s).map((p, k) => (
                    <Circle key={k} x={p.x} y={p.y} radius={3} fill="#333" />
                  ))}
                </Group>
              )}
              {/* shadow polygon */}
              {renderShadow(s, light, proj, W, H, circleDynamicR)}
            </Group>
          ))}
        </Layer>
        {/* top layer: rays always above squares */}
        <Layer>
          {squares.map((s, i) => (
            <Group key={`rays-${i}`}>
              {renderRays(s, light, proj)}
            </Group>
          ))}
        </Layer>
      </Stage>
    </div>
  );
}

function renderRays(s: Square, light: { x: number; y: number }, proj: { x: number; y: number }) {
  const TL = { x: s.x, y: s.y };
  const TR = { x: s.x + s.size, y: s.y };
  const BR = { x: s.x + s.size, y: s.y + s.size };
  const BL = { x: s.x, y: s.y + s.size };

  const L1 = { a: { x: light.x, y: light.y }, b: TL };
  const L2 = { a: { x: light.x, y: light.y }, b: TR };
  const G1 = { a: { x: proj.x, y: proj.y }, b: BL };
  const G2 = { a: { x: proj.x, y: proj.y }, b: BR };

  const far = 2000;
  const rays = [
    rayPoints(L1.a, L1.b, far),
    rayPoints(L2.a, L2.b, far),
    rayPoints(G1.a, G1.b, far),
    rayPoints(G2.a, G2.b, far),
  ];

  return (
    <>
      {rays.map((pts, i) => (
        <Line key={i} points={pts} strokeLinearGradientStartPoint={{ x: pts[0], y: pts[1] }} strokeLinearGradientEndPoint={{ x: pts[2], y: pts[3] }} strokeLinearGradientColorStops={[0, 'rgba(40,40,40,0.55)', 0.3, 'rgba(40,40,40,0.35)', 0.7, 'rgba(40,40,40,0.12)', 1, 'rgba(40,40,40,0)']} strokeWidth={1} />
      ))}
    </>
  );
}

function renderShadow(s: Square, light: { x: number; y: number }, proj: { x: number; y: number }, W: number, H: number, minLightDist: number) {
  const TL = { x: s.x, y: s.y };
  const TR = { x: s.x + s.size, y: s.y };
  const BR = { x: s.x + s.size, y: s.y + s.size };
  const BL = { x: s.x, y: s.y + s.size };

  const L1 = { a: { x: light.x, y: light.y }, b: TL };
  const L2 = { a: { x: light.x, y: light.y }, b: TR };
  const G1 = { a: { x: proj.x, y: proj.y }, b: BL };
  const G2 = { a: { x: proj.x, y: proj.y }, b: BR };

  // Ray-ray intersection; ignore intersections inside light circle to avoid degenerate cases
  const P_left = rayRayIntersection(L1.a, L1.b, G1.a, G1.b, minLightDist, 0);
  const P_right = rayRayIntersection(L2.a, L2.b, G2.a, G2.b, minLightDist, 0);

  if (P_left && P_right) {
    return (
      <Line points={[BL.x, BL.y, BR.x, BR.y, P_right.x, P_right.y, P_left.x, P_left.y]} closed fill="rgba(0,0,0,0.2)" />
    );
  }
  // Fallback: extend shadow from square base to canvas edge using projection rays intersections
  const I_left = rayRectIntersection(G1.a, G1.b, W, H);
  const I_right = rayRectIntersection(G2.a, G2.b, W, H);
  if (!I_left && !I_right) return null;
  const poly: number[] = [BL.x, BL.y, BR.x, BR.y];
  if (I_right) poly.push(I_right.point.x, I_right.point.y);
  // insert corner if needed between right and left intersections
  if (I_right && I_left && I_right.edge !== I_left.edge) {
    const corner = cornerBetweenEdges(I_right.edge, I_left.edge, W, H);
    if (corner) poly.push(corner.x, corner.y);
  }
  if (I_left) poly.push(I_left.point.x, I_left.point.y);
  return <Line points={poly} closed fill="rgba(0,0,0,0.2)" />;
}

function rayPoints(a: { x: number; y: number }, b: { x: number; y: number }, length: number) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  if (len < 1e-6) return [a.x, a.y, a.x, a.y];
  const nx = dx / len;
  const ny = dy / len;
  return [a.x, a.y, a.x + nx * length, a.y + ny * length];
}

function cornerPoints(s: Square) {
  return [
    { x: s.x, y: s.y },
    { x: s.x + s.size, y: s.y },
    { x: s.x + s.size, y: s.y + s.size },
    { x: s.x, y: s.y + s.size },
  ];
}

function hitCircle(x: number, y: number, cx: number, cy: number, r: number) {
  return (x - cx) * (x - cx) + (y - cy) * (y - cy) < r * r;
}

function hitSquareAt(x: number, y: number, squares: Square[]) {
  for (let i = squares.length - 1; i >= 0; i--) {
    const s = squares[i];
    if (x > s.x && x < s.x + s.size && y > s.y && y < s.y + s.size) return i;
  }
  return -1;
}

function lineLineIntersection(p1: { x: number; y: number }, p2: { x: number; y: number }, p3: { x: number; y: number }, p4: { x: number; y: number }) {
  const x1 = p1.x, y1 = p1.y;
  const x2 = p2.x, y2 = p2.y;
  const x3 = p3.x, y3 = p3.y;
  const x4 = p4.x, y4 = p4.y;
  const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(den) < 1e-9) return null as { x: number; y: number } | null;
  const px = ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) / den;
  const py = ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) / den;
  if (!isFinite(px) || !isFinite(py)) return null;
  return { x: px, y: py };
}

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

// Ray-ray intersection with direction and minimal distances from origins
function rayRayIntersection(a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }, d: { x: number; y: number }, minDistA = 0, minDistC = 0) {
  const r = { x: b.x - a.x, y: b.y - a.y };
  const s = { x: d.x - c.x, y: d.y - c.y };
  const rxs = r.x * s.y - r.y * s.x;
  if (Math.abs(rxs) < 1e-9) return null; // parallel
  const cma = { x: c.x - a.x, y: c.y - a.y };
  const t = (cma.x * s.y - cma.y * s.x) / rxs;
  const u = (cma.x * r.y - cma.y * r.x) / rxs;
  if (!isFinite(t) || !isFinite(u)) return null;
  if (t < 0 || u < 0) return null; // must be forward rays
  const lenR = Math.hypot(r.x, r.y);
  const lenS = Math.hypot(s.x, s.y);
  const minT = (minDistA || 0) / (lenR || 1);
  const minU = (minDistC || 0) / (lenS || 1);
  if (t < minT || u < minU) return null; // too close to origins
  return { x: a.x + t * r.x, y: a.y + t * r.y };
}

type EdgeId = 'top' | 'right' | 'bottom' | 'left';

function rayRectIntersection(a: { x: number; y: number }, b: { x: number; y: number }, W: number, H: number): { point: { x: number; y: number }; edge: EdgeId } | null {
  const dir = { x: b.x - a.x, y: b.y - a.y };
  const candidates: Array<{ t: number; point: { x: number; y: number }; edge: EdgeId }> = [];
  const eps = 1e-9;

  if (Math.abs(dir.x) > eps) {
    // left edge x=0
    const tLeft = (0 - a.x) / dir.x;
    const yLeft = a.y + tLeft * dir.y;
    if (tLeft >= 0 && yLeft >= 0 && yLeft <= H) candidates.push({ t: tLeft, point: { x: 0, y: yLeft }, edge: 'left' });
    // right edge x=W
    const tRight = (W - a.x) / dir.x;
    const yRight = a.y + tRight * dir.y;
    if (tRight >= 0 && yRight >= 0 && yRight <= H) candidates.push({ t: tRight, point: { x: W, y: yRight }, edge: 'right' });
  }
  if (Math.abs(dir.y) > eps) {
    // top edge y=0
    const tTop = (0 - a.y) / dir.y;
    const xTop = a.x + tTop * dir.x;
    if (tTop >= 0 && xTop >= 0 && xTop <= W) candidates.push({ t: tTop, point: { x: xTop, y: 0 }, edge: 'top' });
    // bottom edge y=H
    const tBottom = (H - a.y) / dir.y;
    const xBottom = a.x + tBottom * dir.x;
    if (tBottom >= 0 && xBottom >= 0 && xBottom <= W) candidates.push({ t: tBottom, point: { x: xBottom, y: H }, edge: 'bottom' });
  }
  if (!candidates.length) return null;
  candidates.sort((p, q) => p.t - q.t);
  return { point: candidates[0].point, edge: candidates[0].edge };
}

function cornerBetweenEdges(eFrom: EdgeId, eTo: EdgeId, W: number, H: number): { x: number; y: number } | null {
  // handle common cases along canvas perimeter
  if ((eFrom === 'right' && eTo === 'bottom') || (eFrom === 'bottom' && eTo === 'right')) return { x: W, y: H };
  if ((eFrom === 'left' && eTo === 'bottom') || (eFrom === 'bottom' && eTo === 'left')) return { x: 0, y: H };
  if ((eFrom === 'right' && eTo === 'top') || (eFrom === 'top' && eTo === 'right')) return { x: W, y: 0 };
  if ((eFrom === 'left' && eTo === 'top') || (eFrom === 'top' && eTo === 'left')) return { x: 0, y: 0 };
  return null;
}


