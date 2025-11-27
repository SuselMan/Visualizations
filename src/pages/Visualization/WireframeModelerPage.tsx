import { useMemo, useState } from 'react';
import { Button, ToggleDropdown, Toggle } from 'ui-kit';
import styles from './WireframeModelerPage.module.css';
import Wireframe3D from '@/visualizations/wireframe/Wireframe3D';

type ShapeKind = 'cube' | 'cylinder' | 'cone';

export default function WireframeModelerPage() {
  const [showIntersections, setShowIntersections] = useState(true);
  const [lastAction, setLastAction] = useState(0);
  const [mode, setMode] = useState<'camera' | 'translate' | 'rotate' | 'scale'>('camera');
  const [selected, setSelected] = useState<{ id: string | null; kind?: string }>({ id: null });

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
}


