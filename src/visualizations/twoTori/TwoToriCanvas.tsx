import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Type aliases for three.js classes (avoids namespace export issues in strict builds)
type Vector3 = InstanceType<typeof THREE.Vector3>;
type Mesh = InstanceType<typeof THREE.Mesh>;
type BufferGeometry = InstanceType<typeof THREE.BufferGeometry>;
type BufferAttribute = InstanceType<typeof THREE.BufferAttribute>;
type Scene = InstanceType<typeof THREE.Scene>;
type PerspectiveCamera = InstanceType<typeof THREE.PerspectiveCamera>;
type WebGLRenderer = InstanceType<typeof THREE.WebGLRenderer>;
type LineSegments = InstanceType<typeof THREE.LineSegments>;
type Material = InstanceType<typeof THREE.Material>;
type Object3D = InstanceType<typeof THREE.Object3D>;

const N_U = 48;
const N_V = 24;
const PAN_SENSITIVITY = 0.008;

export type ShapeKind = 'cube' | 'cone' | 'cylinder' | 'torus' | 'pyramid';

export type TwoToriState = {
  shape1: ShapeKind;
  shape2: ShapeKind;
  R1: number;
  r1: number;
  pos1: [number, number, number];
  rot1x: number;
  rot1y: number;
  rot1z: number;
  R2: number;
  r2: number;
  pos2: [number, number, number];
  rot2x: number;
  rot2y: number;
  rot2z: number;
  zoom: number;
};

type Props = {
  width?: number;
  height?: number;
  state: TwoToriState;
  onZoomChange?: (zoom: number) => void;
  showOnlyIntersection?: boolean;
};

function sdTorusLocal(p: Vector3, R: number, r: number): number {
  const q = [Math.sqrt(p.x * p.x + p.y * p.y) - R, p.z];
  return Math.sqrt(q[0] * q[0] + q[1] * q[1]) - r;
}

function sdBox(p: Vector3, half: number): number {
  const ax = Math.abs(p.x) - half;
  const ay = Math.abs(p.y) - half;
  const az = Math.abs(p.z) - half;
  const qx = Math.max(ax, 0);
  const qy = Math.max(ay, 0);
  const qz = Math.max(az, 0);
  const outside = Math.sqrt(qx * qx + qy * qy + qz * qz);
  const inside = Math.min(Math.max(ax, Math.max(ay, az)), 0);
  return outside + inside;
}

function sdCylinder(p: Vector3, r: number, h: number): number {
  const d = Math.sqrt(p.x * p.x + p.z * p.z) - r;
  const e = Math.abs(p.y) - h;
  const d2 = Math.max(d, 0) ** 2;
  const e2 = Math.max(e, 0) ** 2;
  return Math.min(Math.max(d, e), 0) + Math.sqrt(d2 + e2);
}

function sdCone(p: Vector3, r: number, h: number): number {
  const q = Math.sqrt(p.x * p.x + p.z * p.z);
  const halfH = h * 0.5;
  const L = Math.sqrt(h * h + r * r);
  const side = (h * q + r * (p.y - halfH)) / L;
  const cap = -p.y - halfH;
  return Math.max(side, cap);
}

function sdfForShape(shape: ShapeKind, p: Vector3, R: number, r: number): number {
  switch (shape) {
    case 'torus':
      return sdTorusLocal(p, R, r);
    case 'cube': {
      const half = R * 0.5;
      return sdBox(p, half);
    }
    case 'cylinder':
      return sdCylinder(p, R, r);
    case 'cone':
      return sdCone(p, R, 2 * r);
    case 'pyramid':
      return sdCone(p, R * Math.SQRT2, 2 * r);
    default:
      return sdTorusLocal(p, R, r);
  }
}

function worldToLocal(point: Vector3, mesh: Mesh): Vector3 {
  const inv = new THREE.Matrix4().copy(mesh.matrixWorld).invert();
  return point.clone().applyMatrix4(inv);
}

function getMeshIndices(geom: BufferGeometry): number[] {
  const index = geom.index;
  if (index) {
    return Array.from((index as BufferAttribute).array);
  }
  const pos = geom.attributes.position;
  const idx: number[] = [];
  for (let k = 0; k < pos.count; k += 3) idx.push(k, k + 1, k + 2);
  return idx;
}

function getTorusIndices(geom: BufferGeometry): number[] {
  const idx: number[] = [];
  const w = N_V + 1;
  for (let i = 0; i < N_U; i++) {
    for (let j = 0; j < N_V; j++) {
      const a = i * w + j;
      const b = a + 1;
      const c = (i + 1) * w + j;
      const d = c + 1;
      idx.push(a, b, d, a, d, c);
    }
  }
  return idx;
}

function makeGeometry(shape: ShapeKind, R: number, r: number): BufferGeometry {
  switch (shape) {
    case 'cube':
      return new THREE.BoxGeometry(R, R, R);
    case 'cylinder':
      return new THREE.CylinderGeometry(R, R, 2 * r, 32);
    case 'cone':
      return new THREE.ConeGeometry(R, 2 * r, 32);
    case 'pyramid':
      return new THREE.ConeGeometry(R * Math.SQRT2, 2 * r, 4);
    case 'torus':
    default:
      return new THREE.TorusGeometry(R, Math.min(R - 0.05, r), N_V, N_U);
  }
}

function computeIntersection(
  mesh1: Mesh,
  mesh2: Mesh,
  shape2: ShapeKind,
  R2: number,
  r2: number
): Vector3[][] {
  const geom1 = mesh1.geometry;
  const pos1 = geom1.attributes.position;
  const index = geom1.index ? (geom1.index as BufferAttribute).array : null;
  const worldVerts: Vector3[] = [];
  for (let i = 0; i < pos1.count; i++) {
    const v = new THREE.Vector3(pos1.getX(i), pos1.getY(i), pos1.getZ(i));
    v.applyMatrix4(mesh1.matrixWorld);
    worldVerts.push(v);
  }
  const sdf = worldVerts.map((v) => {
    const local = worldToLocal(v, mesh2);
    return sdfForShape(shape2, local, R2, r2);
  });

  const points: Vector3[] = [];
  const seen = new Set<string>();
  function addEdge(i: number, j: number) {
    const key = i < j ? `${i},${j}` : `${j},${i}`;
    if (seen.has(key)) return;
    seen.add(key);
    const s1 = sdf[i];
    const s2 = sdf[j];
    if (s1 * s2 > 0) return;
    const denom = s1 - s2;
    if (Math.abs(denom) < 1e-9) return;
    const t = Math.max(0, Math.min(1, s1 / denom));
    const pt = new THREE.Vector3().lerpVectors(worldVerts[i], worldVerts[j], t);
    points.push(pt);
  }
  const indices = getMeshIndices(geom1);
  for (let k = 0; k < indices.length; k += 3) {
    addEdge(indices[k], indices[k + 1]);
    addEdge(indices[k + 1], indices[k + 2]);
    addEdge(indices[k + 2], indices[k]);
  }

  const maxStep = 0.75;
  const chains: Vector3[][] = [];
  const used = new Set<number>();
  function buildChain(start: number): Vector3[] | null {
    const chain = [points[start]];
    used.add(start);
    let remaining = points.map((_, idx) => idx).filter((i) => !used.has(i));
    while (remaining.length) {
      const last = chain[chain.length - 1];
      let best = remaining[0];
      let bestD = last.distanceTo(points[best]);
      for (const i of remaining) {
        const d = last.distanceTo(points[i]);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      }
      if (bestD > maxStep) break;
      chain.push(points[best]);
      used.add(best);
      remaining = remaining.filter((i) => !used.has(i));
    }
    return chain.length >= 2 ? chain : null;
  }
  for (let i = 0; i < points.length; i++) {
    if (used.has(i)) continue;
    const c = buildChain(i);
    if (c) chains.push(c);
  }
  return chains;
}

export default function TwoToriCanvas({ width: W = 960, height: H = 540, state, onZoomChange, showOnlyIntersection }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<Scene | null>(null);
  const cameraRef = useRef<PerspectiveCamera | null>(null);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const torus1Ref = useRef<Mesh | null>(null);
  const torus2Ref = useRef<Mesh | null>(null);
  const curveLineRef = useRef<LineSegments | null>(null);
  const stateRef = useRef(state);
  const sizeRef = useRef({ w: W, h: H });
  const camAngleX = useRef(0.35);
  const camAngleY = useRef(0.8);
  const camTarget = useRef(new THREE.Vector3(0, 0, 0));
  const isDrag = useRef(false);
  const isPan = useRef(false);
  const prevMouse = useRef({ x: 0, y: 0 });
  stateRef.current = state;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const { w, h } = sizeRef.current;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x262830);

    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
    camera.position.set(0, 0, state.zoom);

    const light = new THREE.DirectionalLight(0xffffff, 0.9);
    light.position.set(2, 3, 5);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x444444));

    const geom1 = makeGeometry(state.shape1, state.R1, state.r1);
    const mat1 = new THREE.MeshPhongMaterial({
      color: 0x3399dd,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
    });
    const torus1 = new THREE.Mesh(geom1, mat1);
    const geom2 = makeGeometry(state.shape2, state.R2, state.r2);
    const mat2 = new THREE.MeshPhongMaterial({
      color: 0xe6a020,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
    });
    const torus2 = new THREE.Mesh(geom2, mat2);
    scene.add(torus1);
    scene.add(torus2);

    const curveGeom = new THREE.BufferGeometry();
    const curveLine = new THREE.LineSegments(
      curveGeom,
      new THREE.LineBasicMaterial({ color: 0xff0000 })
    );
    scene.add(curveLine);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(w, h);
    container.appendChild(renderer.domElement);

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    torus1Ref.current = torus1;
    torus2Ref.current = torus2;
    curveLineRef.current = curveLine;

    const animate = () => {
      requestAnimationFrame(animate);
      if (!cameraRef.current || !sceneRef.current || !rendererRef.current) return;
      const r = stateRef.current.zoom;
      const dx = r * Math.cos(camAngleX.current) * Math.sin(camAngleY.current);
      const dy = r * Math.sin(camAngleX.current);
      const dz = r * Math.cos(camAngleX.current) * Math.cos(camAngleY.current);
      camera.position.set(
        camTarget.current.x + dx,
        camTarget.current.y + dy,
        camTarget.current.z + dz
      );
      camera.lookAt(camTarget.current);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      container.removeChild(renderer.domElement);
      renderer.dispose();
      geom1.dispose();
      geom2.dispose();
      (mat1 as Material).dispose();
      (mat2 as Material).dispose();
      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
      torus1Ref.current = null;
      torus2Ref.current = null;
      curveLineRef.current = null;
    };
  }, []);

  useEffect(() => {
    const torus1 = torus1Ref.current;
    const torus2 = torus2Ref.current;
    const curveLine = curveLineRef.current;
    if (!torus1 || !torus2 || !curveLine) return;

    torus1.position.set(state.pos1[0], state.pos1[1], state.pos1[2]);
    (torus1 as Object3D).rotation.order = 'YXZ';
    torus1.rotation.x = (state.rot1x * Math.PI) / 180;
    torus1.rotation.y = (state.rot1y * Math.PI) / 180;
    torus1.rotation.z = (state.rot1z * Math.PI) / 180;

    torus2.position.set(state.pos2[0], state.pos2[1], state.pos2[2]);
    (torus2 as Object3D).rotation.order = 'YXZ';
    torus2.rotation.x = (state.rot2x * Math.PI) / 180;
    torus2.rotation.y = (state.rot2y * Math.PI) / 180;
    torus2.rotation.z = (state.rot2z * Math.PI) / 180;

    const r1 = state.shape1 === 'torus' ? Math.min(state.R1 - 0.05, state.r1) : state.r1;
    const r2 = state.shape2 === 'torus' ? Math.min(state.R2 - 0.05, state.r2) : state.r2;
    torus1.geometry.dispose();
    (torus1 as Mesh).geometry = makeGeometry(state.shape1, state.R1, r1);
    torus2.geometry.dispose();
    (torus2 as Mesh).geometry = makeGeometry(state.shape2, state.R2, r2);

    // hide or show solids based on flag, but always keep them in the scene for intersection
    const hide = !!showOnlyIntersection;
    torus1.visible = !hide;
    torus2.visible = !hide;

    torus1.updateMatrixWorld(true);
    torus2.updateMatrixWorld(true);
    const chains = computeIntersection(torus1, torus2, state.shape2, state.R2, r2);
    const positions: number[] = [];
    for (const chain of chains) {
      for (let i = 0; i < chain.length - 1; i++) {
        positions.push(chain[i].x, chain[i].y, chain[i].z);
        positions.push(chain[i + 1].x, chain[i + 1].y, chain[i + 1].z);
      }
    }
    if (positions.length === 0) positions.push(0, 0, 0, 0, 0, 0);
    curveLine.geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3)
    );
    curveLine.geometry.attributes.position.needsUpdate = true;
    curveLine.geometry.setDrawRange(0, positions.length / 3);
  }, [state]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      if (e.ctrlKey || e.metaKey) {
        isPan.current = true;
        isDrag.current = false;
      } else {
        isPan.current = false;
        isDrag.current = true;
      }
      prevMouse.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - prevMouse.current.x;
      const dy = e.clientY - prevMouse.current.y;
      prevMouse.current = { x: e.clientX, y: e.clientY };
      if (isPan.current && cameraRef.current) {
        cameraRef.current.updateMatrixWorld();
        const right = new THREE.Vector3().setFromMatrixColumn(
          cameraRef.current.matrixWorld,
          0
        );
        const up = new THREE.Vector3().setFromMatrixColumn(
          cameraRef.current.matrixWorld,
          1
        );
        const k = PAN_SENSITIVITY * stateRef.current.zoom;
        camTarget.current.add(
          right.multiplyScalar(-dx * k).add(up.multiplyScalar(dy * k))
        );
      } else if (isDrag.current) {
        camAngleY.current += dx * 0.005;
        camAngleX.current += dy * 0.005;
        camAngleX.current = Math.max(-1.2, Math.min(1.2, camAngleX.current));
      }
    };

    const onMouseUp = () => {
      isDrag.current = false;
      isPan.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      if (!container.contains(e.target as Node)) return;
      e.preventDefault();
      const newZoom = Math.max(
        2,
        Math.min(25, state.zoom - e.deltaY * 0.02)
      );
      onZoomChange?.(newZoom);
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('wheel', onWheel);
    };
  }, [state.zoom, onZoomChange]);

  useEffect(() => {
    const container = containerRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    if (!container || !camera || !renderer) return;

    const onResize = () => {
      const rect = container.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      sizeRef.current = { w, h };
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const ro = new ResizeObserver(onResize);
    ro.observe(container);
    onResize();
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        touchAction: 'none',
        display: 'block',
      }}
    />
  );
}
