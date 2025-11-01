import { useState } from 'react';
import { Button, Input, Toggle, ToggleDropdown } from 'ui-kit';
import styles from './PerspectiveCubePage.module.css';
import PerspectiveCubeCanvas, { type PerspectiveMode } from '@/visualizations/perspective/PerspectiveCubeCanvas';

export default function PerspectiveCubePage() {
  const [horizonY, setHorizonY] = useState(540/2);
  const mode: PerspectiveMode = 'three-point';
  const [focal, setFocal] = useState(800);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cubes, setCubes] = useState([
    { rotationDeg: { x: 0, y: 0, z: 0 }, position: { x: 0, y: 0, z: 800 } },
  ]);
  const [onlySelectedExtensions, setOnlySelectedExtensions] = useState(false);

  const current = cubes[selectedIndex];
  const hasCurrent = Boolean(current);

  const width = 960;
  const height = 540;

  function updateRotation(axis: 'x' | 'y' | 'z', value: number) {
    setCubes(prev => {
      const next = prev.slice();
      const c = { ...next[selectedIndex] };
      c.rotationDeg = { ...c.rotationDeg, [axis]: value } as any;
      next[selectedIndex] = c;
      return next;
    });
  }

  function updatePosition(axis: 'x' | 'y' | 'z', value: number) {
    setCubes(prev => {
      const next = prev.slice();
      const c = { ...next[selectedIndex] };
      c.position = { ...c.position, [axis]: value } as any;
      next[selectedIndex] = c;
      return next;
    });
  }

  function resetCurrent() {
    setCubes(prev => {
      const next = prev.slice();
      next[selectedIndex] = { rotationDeg: { x: 0, y: 0, z: 0 }, position: { x: 0, y: 0, z: 800 } };
      return next;
    });
  }

  function addCube() {
    setCubes(prev => {
      const idx = prev.length;
      const nx = -200 + (idx % 5) * 100;
      const ny = 75;
      const nz = 700 + (idx % 4) * 80;
      const next = [...prev, { rotationDeg: { x: 0, y: 0, z: 0 }, position: { x: nx, y: ny, z: nz } }];
      setSelectedIndex(next.length - 1);
      return next;
    });
  }

  function removeSelected() {
    setCubes(prev => {
      if (!prev.length) return prev;
      const next = prev.slice();
      next.splice(selectedIndex, 1);
      setSelectedIndex(prev.length > 1 ? Math.max(0, selectedIndex - 1) : 0);
      return next;
    });
  }

  return (
    <div className={styles.root}>
      <PerspectiveCubeCanvas
        width={width}
        height={height}
        focal={focal}
        mode={mode}
        cubes={cubes}
        selectedIndex={selectedIndex}
        onSelectIndex={setSelectedIndex}
        onCubesChange={setCubes}
        onlySelectedExtensions={onlySelectedExtensions}
        horizonY={horizonY}
        onChangeHorizon={setHorizonY}
      />
      <div className={styles.panel}>
        <div className={styles.row}>
          <Button type="secondary" onClick={addCube}>Add cube</Button>
          <Button type="danger" onClick={removeSelected} disabled={!hasCurrent}>Delete</Button>
        </div>
        <div className={styles.rowCol}>
          <div className={styles.label}>Current cube</div>
          <ToggleDropdown
            options={cubes.map((_, i) => String(i))}
            current={cubes.length ? String(selectedIndex) : ''}
            onChange={((opt: string) => setSelectedIndex(Number(opt))) as any}
            voc={Object.fromEntries(cubes.map((_, i) => [String(i), `Cube ${i+1}`]))}
            placeholder="Select cube"
          />
        </div>
        <div className={styles.rowCol}>
          <div className={styles.label}>Vanishing lines</div>
          <div className={styles.row}>
            <span>Selected only</span>
            <Toggle checked={onlySelectedExtensions} callback={() => setOnlySelectedExtensions(!onlySelectedExtensions)} />
            <span>All cubes</span>
          </div>
        </div>

        <div className={styles.rowCol}>
          <label>
            Focal length (f)
            <Input type="number" value={String(focal)} onChange={(e: any) => setFocal(clampNum(Number(e.target.value), 100, 4000))} inputClasses={styles.narrowInput} />
          </label>
        </div>

        {hasCurrent ? (
          <div className={styles.rowCol}>
            <div className={styles.label}>Rotations (XYZ)</div>
            <label>
              X
              <input type="range" min={0} max={360} step={1} value={current!.rotationDeg.x} onChange={(e) => updateRotation('x', Number(e.target.value))} />
            </label>
            <label>
              Y
              <input type="range" min={0} max={360} step={1} value={current!.rotationDeg.y} onChange={(e) => updateRotation('y', Number(e.target.value))} />
            </label>
            <label>
              Z
              <input type="range" min={0} max={360} step={1} value={current!.rotationDeg.z} onChange={(e) => updateRotation('z', Number(e.target.value))} />
            </label>
          </div>
        ) : (
          <div className={styles.hint}>Кубов нет. Добавьте куб, чтобы изменить параметры.</div>
        )}

        {hasCurrent && (
          <div className={styles.rowCol}>
            <div className={styles.label}>Position (x,y,z)</div>
            <div className={styles.row}>
              <Input type="number" value={String(current!.position.x)} onChange={(e: any) => updatePosition('x', Number(e.target.value))} inputClasses={styles.narrowInput} />
              <Input type="number" value={String(current!.position.y)} onChange={(e: any) => updatePosition('y', Number(e.target.value))} inputClasses={styles.narrowInput} />
              <Input type="number" value={String(current!.position.z)} onChange={(e: any) => updatePosition('z', Number(e.target.value))} inputClasses={styles.narrowInput} />
            </div>
          </div>
        )}

        <div className={styles.row}>
          <Button type="secondary" onClick={() => { if (hasCurrent) resetCurrent(); setFocal(800); }} disabled={!hasCurrent}>Reset</Button>
        </div>

        
      </div>
    </div>
  );
}

function clampNum(v: number, a: number, b: number) { return Math.max(a, Math.min(b, v)); }



