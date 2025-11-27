import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';

type ShapeKind = 'cube' | 'cylinder' | 'cone';
type Item = {
  id: string;
  kind: ShapeKind;
  mesh: any;
  wire: any;
};

type Props = {
  width: number;
  height: number;
  onSceneChange?: () => void;
  showIntersections?: boolean;
  mode?: 'camera' | 'translate' | 'rotate' | 'scale';
  onSelectionChange?: (sel: { id: string | null; kind?: string; pos?: { x: number; y: number; z: number }; rotDeg?: { x: number; y: number; z: number }; scale?: number }) => void;
};

export default function Wireframe3D({ width: W, height: H, onSceneChange, showIntersections = true, mode = 'camera', onSelectionChange }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const modeRef = useRef(mode);
  const sceneRef = useRef<any>(null);
  const rendererRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const orbitRef = useRef<any>(null);
  const transformRef = useRef<any>(null);
  const intersectionsGroupRef = useRef<any>(null);

  useEffect(() => {
    const container = containerRef.current!;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 5000);
    camera.position.set(500, 400, 600);
    camera.lookAt(0, 0, 0);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    const orbit = new OrbitControls(camera, renderer.domElement);
    orbit.enableDamping = true;
    orbit.dampingFactor = 0.05;
    orbit.enablePan = true;
    orbit.enableZoom = true;
    const transform = new TransformControls(camera, renderer.domElement);
    transform.setSize(1.2);
    (transform as any).addEventListener('dragging-changed', (e: any) => {
      // Keep orbit disabled in object modes; enable only in camera mode
      orbit.enabled = (modeRef.current === 'camera');
    });
    scene.add(transform);
    // ensure gizmo always visible on top
    (transform as any).traverse?.((obj: any) => {
      if (obj && obj.material) {
        obj.material.depthTest = false;
        obj.material.transparent = true;
        obj.material.opacity = 1.0;
        obj.renderOrder = 999;
      }
    });
    const grid = new THREE.GridHelper(2000, 40, 0xcccccc, 0xeaeaea);
    (grid.material as any).transparent = true;
    (grid.material as any).opacity = 0.6;
    scene.add(grid);
    const ambient = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambient);
    const intersectionsGroup = new THREE.Group();
    scene.add(intersectionsGroup);

    sceneRef.current = scene;
    rendererRef.current = renderer;
    cameraRef.current = camera;
    orbitRef.current = orbit;
    transformRef.current = transform;
    intersectionsGroupRef.current = intersectionsGroup;

    const animate = () => {
      orbit.update();
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      const cc = container.getBoundingClientRect();
      camera.aspect = cc.width / cc.height;
      camera.updateProjectionMatrix();
      renderer.setSize(cc.width, cc.height);
    };
    window.addEventListener('resize', onResize);
    onResize();

    return () => {
      window.removeEventListener('resize', onResize);
      container.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [W, H]);

  // add a shape
  function addShape(kind: ShapeKind) {
    const scene = sceneRef.current!;
    const material = new THREE.MeshBasicMaterial({ color: 0x1a1a1a, wireframe: false, transparent: true, opacity: 0, depthWrite: false });
    let geom: any;
    if (kind === 'cube') {
      geom = new THREE.BoxGeometry(100, 100, 100);
    } else if (kind === 'cylinder') {
      geom = new THREE.CylinderGeometry(60, 60, 140, 32, 1, false);
    } else {
      geom = new THREE.ConeGeometry(70, 140, 32, 1, false);
    }
    const mesh = new THREE.Mesh(geom, material);
    mesh.position.set((Math.random() - 0.5) * 300, 50, (Math.random() - 0.5) * 300);
    scene.add(mesh);
    const edges = new THREE.EdgesGeometry(geom);
    const lineMat = new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 2, depthTest: false, transparent: true, opacity: 0.95 });
    const wire = new THREE.LineSegments(edges, lineMat);
    mesh.add(wire);
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setItems(prev => [...prev, { id, kind, mesh, wire }]);
    setSelectedId(id);
    if (onSceneChange) onSceneChange();
  }

  // listen to external requests to add shapes
  useEffect(() => {
    const handler = (e: any) => {
      const kind = e?.detail?.kind as ShapeKind;
      if (kind === 'cube' || kind === 'cylinder' || kind === 'cone') addShape(kind);
    };
    window.addEventListener('wireframe-add-shape', handler);
    return () => window.removeEventListener('wireframe-add-shape', handler);
  }, []);

  // listen to external requests to set transforms
  useEffect(() => {
    const handler = (e: any) => {
      const detail = e?.detail || {};
      const id: string | null = detail.id ?? selectedId;
      if (!id) return;
      const item = items.find(i => i.id === id);
      if (!item) return;
      const m = item.mesh;
      if (detail.pos) {
        const p = detail.pos;
        m.position.set(Number(p.x) || 0, Number(p.y) || 0, Number(p.z) || 0);
      }
      if (detail.rotDeg) {
        const r = detail.rotDeg;
        m.rotation.set(
          ((Number(r.x) || 0) * Math.PI) / 180,
          ((Number(r.y) || 0) * Math.PI) / 180,
          ((Number(r.z) || 0) * Math.PI) / 180
        );
      }
      if (typeof detail.scale === 'number') {
        const s = detail.scale;
        m.scale.set(s, s, s);
      }
      m.updateMatrixWorld(true);
      setItems(prev => [...prev]); // trigger rerender/effect recompute
      if (onSceneChange) onSceneChange();
    };
    window.addEventListener('wireframe-set-transform', handler);
    return () => window.removeEventListener('wireframe-set-transform', handler);
  }, [items, selectedId, onSceneChange]);

  // selection + transform
  useEffect(() => {
    const transform = transformRef.current!;
    const orbit = orbitRef.current!;
    if (mode === 'camera') {
      transform.detach();
      (transform as any).enabled = false;
      transform.visible = false;
      if (orbit) orbit.enabled = true;
      return;
    }
    if (orbit) orbit.enabled = false;
    transform.detach();
    if (!selectedId) return;
    const item = items.find(i => i.id === selectedId);
    if (item) {
      transform.attach(item.mesh);
      transform.setMode(mode);
      (transform as any).showX = (transform as any).showY = (transform as any).showZ = true;
      (transform as any).enabled = true;
      transform.visible = true;
    }
  }, [selectedId, items, mode]);

  // sync orbit enabled with mode
  useEffect(() => {
    const orbit = orbitRef.current;
    if (orbit) orbit.enabled = (mode === 'camera');
  }, [mode]);

  // keyboard: 1 translate, 2 rotate, 3 scale
  useEffect(() => {
    const tf = transformRef.current!;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '1') tf.setMode('translate');
      else if (e.key === '2') tf.setMode('rotate');
      else if (e.key === '3') tf.setMode('scale');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // recompute intersection edges
  useEffect(() => {
    if (!showIntersections) {
      // clear any intersection lines
      const ig = intersectionsGroupRef.current!;
      while (ig.children.length) ig.remove(ig.children[0]);
      return;
    }
    const scene = sceneRef.current!;
    const ig = intersectionsGroupRef.current!;
    while (ig.children.length) ig.remove(ig.children[0]);
    // dynamic import to avoid bundling issues if optional
    async function compute() {
      try {
        const csg: any = await import('three-bvh-csg');
        for (let i = 0; i < items.length; i++) {
          for (let j = i + 1; j < items.length; j++) {
            const srcA = items[i].mesh;
            const srcB = items[j].mesh;
            const a = srcA.clone(true);
            const b = srcB.clone(true);
            a.material = new THREE.MeshBasicMaterial({ color: 0xffffff });
            b.material = new THREE.MeshBasicMaterial({ color: 0xffffff });
            a.updateMatrixWorld(true);
            b.updateMatrixWorld(true);
            a.updateMatrix();
            b.updateMatrix();
            const inter = csg.intersect ? csg.intersect(a, b) : (csg.CSG ? csg.CSG.intersect(a, b) : null);
            if (inter && (inter as any).geometry) {
              (inter as any).updateMatrixWorld?.(true);
              const g = (inter as any).geometry.clone();
              g.applyMatrix4((inter as any).matrixWorld ?? new THREE.Matrix4());
              const edges = new THREE.EdgesGeometry(g);
              const mat = new THREE.LineBasicMaterial({ color: 0xff2d2d, linewidth: 3, depthTest: false, transparent: true, opacity: 1 });
              const line = new THREE.LineSegments(edges, mat);
              (line as any).renderOrder = 998;
              ig.add(line);
            }
          }
        }
      } catch (e) {
        // ignore if csg not available
      }
    }
    compute();
  }, [items, showIntersections]);

  // click to select
  useEffect(() => {
    const container = containerRef.current!;
    const scene = sceneRef.current!;
    const camera = cameraRef.current!;
    const raycaster = new THREE.Raycaster();
    // increase tolerance to hit wire lines
    (raycaster.params as any).Line = { threshold: 6 };
    const onClick = (e: MouseEvent) => {
      const canvas = rendererRef.current?.domElement as HTMLElement | undefined;
      const rect = canvas ? canvas.getBoundingClientRect() : (e.target as HTMLElement).getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
      // test both wires and meshes for robust picking
      const targets: any[] = [];
      for (const it of items) {
        targets.push(it.wire);
        targets.push(it.mesh);
      }
      const hits = raycaster.intersectObjects(targets, true);
      if (hits.length) {
        const root = findRootMesh(hits[0].object);
        const found = items.find(i => i.mesh === root);
        if (found) {
          setSelectedId(found.id);
          const m = found.mesh;
          onSelectionChange &&
            onSelectionChange({
              id: found.id,
              kind: found.kind,
              pos: { x: m.position.x, y: m.position.y, z: m.position.z },
              rotDeg: { x: (m.rotation.x * 180) / Math.PI, y: (m.rotation.y * 180) / Math.PI, z: (m.rotation.z * 180) / Math.PI },
              scale: m.scale?.x ?? 1
            });
        } else {
          onSelectionChange && onSelectionChange({ id: null });
        }
      }
    };
    container.addEventListener('click', onClick);
    return () => container.removeEventListener('click', onClick);
  }, [items]);

  return <div ref={containerRef} style={{ width: W, height: H }} />;
}

function findRootMesh(o: any): any {
  let cur: any = o;
  while (cur && !(cur as any).isMesh) {
    cur = cur.parent;
  }
  return cur as any;
}


