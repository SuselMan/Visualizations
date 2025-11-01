import { useMemo, useState } from 'react';
import { Button, Input, ToggleDropdown } from 'ui-kit';
import styles from './LightShadowPage.module.css';
import LightShadowCanvas, { type Square } from '@/visualizations/lightShadow/LightShadowCanvas';

const MAX_SQUARES = 20;

export default function LightShadowPage() {
  const [squares, setSquares] = useState<Square[]>([ 
    { x: 960*0.25, y: 540*0.68, size: 100, color: '#cfe8ff' },
    { x: 960*0.55, y: 540*0.63, size: 100, color: '#ffe7cf' },
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [sensitivity, setSensitivity] = useState(2.5);

  const countText = useMemo(() => `Squares: ${squares.length} / ${MAX_SQUARES}`, [squares.length]);

  const addSquare = () => {
    if (squares.length >= MAX_SQUARES) return;
    const idx = squares.length;
    const size = 100;
    const nx = clamp(40 + idx*18, 10, 960 - size - 10);
    const ny = clamp(540/2 + 30 + (idx%5)*18, 10, 540 - size - 10);
    const palette = ["#cfe8ff","#ffe7cf","#e6ffd4","#ffd6f3","#f9ffcf","#d0f0ff","#ffd0d0","#e6e1ff","#d8ffd8","#ffeed6"];
    const color = palette[idx % palette.length];
    const next = [...squares, { x: nx, y: ny, size, color }];
    setSquares(next);
    setSelectedIndex(next.length - 1);
  };

  const deleteSelected = () => {
    if (!squares.length) return;
    if (selectedIndex < 0 || selectedIndex >= squares.length) return;
    const next = squares.slice();
    next.splice(selectedIndex, 1);
    setSquares(next);
    setSelectedIndex(Math.max(0, selectedIndex - 1));
  };

  const setSizeForSelected = (v: number) => {
    if (!squares[selectedIndex]) return;
    const next = squares.slice();
    next[selectedIndex] = { ...next[selectedIndex], size: clamp(v, 10, 300) };
    setSquares(next);
  };

  return (
    <div className={styles.root}>
      <LightShadowCanvas
        width={960}
        height={540}
        squares={squares}
        onSquaresChange={(ns, activeIdx) => { setSquares(ns); if (typeof activeIdx === 'number') setSelectedIndex(activeIdx); }}
        selectedIndex={selectedIndex}
        onSelectIndex={setSelectedIndex}
        sensitivity={sensitivity}
        onSensitivityChange={setSensitivity}
      />
      <div className={styles.panel}>
        <div className={styles.row}>
          <Button onClick={addSquare} disabled={squares.length >= MAX_SQUARES}>Add square</Button>
          <Button onClick={deleteSelected} type="secondary" disabled={!squares.length}>Delete selected</Button>
        </div>
        <div className={styles.rowCol}>
          <label>
            Current square
            <ToggleDropdown
              className={styles.dropdown}
              options={squares.map((_, i) => String(i))}
              current={String(selectedIndex)}
              onChange={((opt: string) => setSelectedIndex(Number(opt))) as any}
              placeholder="Select square"
              voc={Object.fromEntries(squares.map((_, i) => [String(i), `Square ${i+1}`]))}
            />
          </label>
        </div>
        <div className={styles.rowCol}>
          <label>
            Selected size
            <Input type="number" value={String(squares[selectedIndex]?.size ?? 100)} onChange={(e: any) => setSizeForSelected(Number(e.target.value))} inputClasses={styles.narrowInput} />
          </label>
        </div>
        <div className={styles.rowCol}>
          <label>
            Circle growth sensitivity
            <div className={styles.row}>
              <input type="range" min={0} max={4} step={0.1} value={sensitivity} onChange={(e) => setSensitivity(Number(e.target.value))} />
              <span className={styles.mono}>{sensitivity.toFixed(1)}×</span>
            </div>
          </label>
        </div>
        <div className={styles.hint}>{countText}</div>
      </div>
    </div>
  );
}

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}


