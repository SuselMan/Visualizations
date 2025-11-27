import { useMemo, useState } from 'react';
import { Button, ToggleDropdown, Toggle } from 'ui-kit';
import styles from './WireframeModelerPage.module.css';
import Wireframe3D from '@/visualizations/wireframe/Wireframe3D';

type ShapeKind = 'cube' | 'cylinder' | 'cone';

export default function WireframeModelerPage() {
  const [showIntersections, setShowIntersections] = useState(true);
  const [lastAction, setLastAction] = useState(0);
  const [mode, setMode] = useState<'camera' | 'translate' | 'rotate' | 'scale'>('camera');
  const [selected, setSelected] = useState<{ id: string | null; kind?: string; pos?: { x: number; y: number; z: number }; rotDeg?: { x: number; y: number; z: number }; scale?: number }>({ id: null });

  const width = 960;
  const height = 540;

  return (
    <div className={styles.root}>
      <div className={styles.canvasWrap}>
        <Wireframe3D
          width={width}
          height={height}
          showIntersections={showIntersections}
          onSceneChange={() => setLastAction(Date.now())}
          mode={mode}
          onSelectionChange={setSelected}
        />
      </div>
      <div className={styles.panel}>
        <div className={styles.rowCol}>
          <div className={styles.label}>Add shape</div>
          <div className={styles.row}>
            <Button type="secondary" onClick={() => dispatchAdd('cube')}>Cube</Button>
            <Button type="secondary" onClick={() => dispatchAdd('cylinder')}>Cylinder</Button>
            <Button type="secondary" onClick={() => dispatchAdd('cone')}>Cone</Button>
          </div>
        </div>
        <div className={styles.rowCol}>
          <div className={styles.label}>Mode</div>
          <div className={styles.row}>
            <Button type={mode === 'camera' ? 'active' : 'secondary'} onClick={() => setMode('camera')}>Camera</Button>
            <Button type={mode === 'translate' ? 'active' : 'secondary'} onClick={() => setMode('translate')}>Move</Button>
            <Button type={mode === 'rotate' ? 'active' : 'secondary'} onClick={() => setMode('rotate')}>Rotate</Button>
            <Button type={mode === 'scale' ? 'active' : 'secondary'} onClick={() => setMode('scale')}>Scale</Button>
          </div>
        </div>
        <div className={styles.rowCol}>
          <div className={styles.label}>Intersections</div>
          <div className={styles.row}>
            <span>Show</span>
            <Toggle checked={showIntersections} callback={() => setShowIntersections(!showIntersections)} />
          </div>
        </div>
        <div className={styles.rowCol}>
          <div className={styles.label}>Selected</div>
          <div>{selected.id ? `${selected.kind} (${selected.id})` : 'None'}</div>
          <div className={styles.row}>
            <Button type={mode === 'camera' ? 'active' : 'secondary'} onClick={() => setMode('camera')}>Camera</Button>
            <Button type={mode === 'translate' ? 'active' : 'secondary'} onClick={() => setMode('translate')} disabled={!selected.id}>Move</Button>
            <Button type={mode === 'rotate' ? 'active' : 'secondary'} onClick={() => setMode('rotate')} disabled={!selected.id}>Rotate</Button>
            <Button type={mode === 'scale' ? 'active' : 'secondary'} onClick={() => setMode('scale')} disabled={!selected.id}>Scale</Button>
          </div>
          {selected.id && (
            <>
              <div className={styles.label}>Position</div>
              <div className={styles.row}>
                <AxisSlider label="X" value={selected.pos?.x ?? 0} onChange={(v) => updateTransform({ pos: { x: v } })} />
                <AxisSlider label="Y" value={selected.pos?.y ?? 0} onChange={(v) => updateTransform({ pos: { y: v } })} />
                <AxisSlider label="Z" value={selected.pos?.z ?? 0} onChange={(v) => updateTransform({ pos: { z: v } })} />
              </div>
              <div className={styles.label}>Rotation (deg)</div>
              <div className={styles.row}>
                <AxisSlider label="X" min={-180} max={180} value={selected.rotDeg?.x ?? 0} onChange={(v) => updateTransform({ rotDeg: { x: v } })} />
                <AxisSlider label="Y" min={-180} max={180} value={selected.rotDeg?.y ?? 0} onChange={(v) => updateTransform({ rotDeg: { y: v } })} />
                <AxisSlider label="Z" min={-180} max={180} value={selected.rotDeg?.z ?? 0} onChange={(v) => updateTransform({ rotDeg: { z: v } })} />
              </div>
              <div className={styles.label}>Scale</div>
              <div className={styles.row}>
                <AxisSlider label="S" min={0.1} max={5} step={0.1} value={selected.scale ?? 1} onChange={(v) => updateTransform({ scale: v })} />
              </div>
            </>
          )}
        </div>
        <div className={styles.rowCol}>
          <div className={styles.label}>Controls</div>
          <div>Use Orbit to rotate/pan/zoom the camera. Select an object by click; gizmo shows axis handles for movement and rotation rings for each axis.</div>
        </div>
      </div>
    </div>
  );

  function dispatchAdd(kind: ShapeKind) {
    // This triggers Wireframe3D to add shape via onSceneChange (imperative API not exposed; we use custom event)
    window.dispatchEvent(new CustomEvent('wireframe-add-shape', { detail: { kind } }));
    setLastAction(Date.now());
  }

  function updateTransform(patch: { pos?: Partial<{ x: number; y: number; z: number }>; rotDeg?: Partial<{ x: number; y: number; z: number }>; scale?: number }) {
    if (!selected.id) return;
    const nextPos = { ...(selected.pos ?? { x: 0, y: 0, z: 0 }), ...(patch.pos ?? {}) };
    const nextRot = { ...(selected.rotDeg ?? { x: 0, y: 0, z: 0 }), ...(patch.rotDeg ?? {}) };
    const nextScale = typeof patch.scale === 'number' ? patch.scale : (selected.scale ?? 1);
    setSelected(prev => ({ ...prev, pos: nextPos, rotDeg: nextRot, scale: nextScale }));
    window.dispatchEvent(new CustomEvent('wireframe-set-transform', { detail: { id: selected.id, pos: nextPos, rotDeg: nextRot, scale: nextScale } }));
  }
}

function AxisSlider({ label, value, onChange, min = -500, max = 500, step = 1 }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
      <span style={{ width: 16 }}>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ flex: 1 }} />
      <span style={{ width: 60, textAlign: 'right' }}>{Number(value).toFixed(step < 1 ? 1 : 0)}</span>
    </div>
  );
}


