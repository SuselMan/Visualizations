import { useState, useCallback } from 'react';
import { Button, Input } from 'ui-kit';
import styles from './TwoToriPage.module.css';
import TwoToriCanvas, { type TwoToriState } from '@/visualizations/twoTori/TwoToriCanvas';

const defaultState: TwoToriState = {
  R1: 1.2,
  r1: 0.4,
  pos1: [0, 0, 0],
  rot1x: 0,
  rot1y: 0,
  R2: 1.2,
  r2: 0.4,
  pos2: [0, 0, 0],
  rot2x: 0,
  rot2y: 0,
  zoom: 6,
};

type TabId = 'torus1' | 'torus2' | 'camera';

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function SliderRow({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
}) {
  const displayValue = step < 1 ? value.toFixed(2) : String(value);
  return (
    <div className={styles.sliderRow}>
      <span className={styles.label} style={{ width: 120, flexShrink: 0 }}>
        {label}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <Input
        type="number"
        min={min}
        max={max}
        step={step}
        value={displayValue}
        onChange={(e) => {
          const v = Number((e.target as HTMLInputElement).value);
          if (!Number.isNaN(v)) onChange(clamp(v, min, max));
        }}
        inputClasses={styles.narrowInput}
      />
    </div>
  );
}

export default function TwoToriPage() {
  const [activeTab, setActiveTab] = useState<TabId>('torus1');
  const [state, setState] = useState<TwoToriState>(defaultState);

  const update = useCallback(<K extends keyof TwoToriState>(key: K, value: TwoToriState[K]) => {
    setState((s) => ({ ...s, [key]: value }));
  }, []);

  const updatePos1 = useCallback((i: 0 | 1 | 2, value: number) => {
    setState((s) => {
      const pos1 = [...s.pos1] as [number, number, number];
      pos1[i] = value;
      return { ...s, pos1 };
    });
  }, []);

  const updatePos2 = useCallback((i: 0 | 1 | 2, value: number) => {
    setState((s) => {
      const pos2 = [...s.pos2] as [number, number, number];
      pos2[i] = value;
      return { ...s, pos2 };
    });
  }, []);

  const handleZoomChange = useCallback((zoom: number) => {
    setState((s) => ({ ...s, zoom }));
  }, []);

  const step = 0.05;
  const stepRot = 1;

  return (
    <div className={styles.root}>
      <div className={styles.canvasWrap}>
        <TwoToriCanvas state={state} onZoomChange={handleZoomChange} />
      </div>
      <div className={styles.panel}>
        <div className={styles.rowCol}>
          <div className={styles.label}>Параметры</div>
          <div className={styles.row}>
            <Button
              type={activeTab === 'torus1' ? 'active' : 'secondary'}
              onClick={() => setActiveTab('torus1')}
            >
              Тор 1
            </Button>
            <Button
              type={activeTab === 'torus2' ? 'active' : 'secondary'}
              onClick={() => setActiveTab('torus2')}
            >
              Тор 2
            </Button>
            <Button
              type={activeTab === 'camera' ? 'active' : 'secondary'}
              onClick={() => setActiveTab('camera')}
            >
              Камера
            </Button>
          </div>
        </div>

        {activeTab === 'torus1' && (
          <div className={styles.rowCol}>
            <SliderRow
              label="R (большой радиус)"
              min={0.2}
              max={3}
              step={step}
              value={state.R1}
              onChange={(v) => update('R1', clamp(v, 0.2, 3))}
            />
            <SliderRow
              label="r (малый радиус)"
              min={0.05}
              max={1.5}
              step={step}
              value={state.r1}
              onChange={(v) => update('r1', Math.min(state.R1 - 0.05, clamp(v, 0.05, 1.5)))}
            />
            <SliderRow
              label="Положение X"
              min={-3}
              max={3}
              step={step}
              value={state.pos1[0]}
              onChange={(v) => updatePos1(0, v)}
            />
            <SliderRow
              label="Положение Y"
              min={-3}
              max={3}
              step={step}
              value={state.pos1[1]}
              onChange={(v) => updatePos1(1, v)}
            />
            <SliderRow
              label="Положение Z"
              min={-3}
              max={3}
              step={step}
              value={state.pos1[2]}
              onChange={(v) => updatePos1(2, v)}
            />
            <SliderRow
              label="Поворот X °"
              min={-180}
              max={180}
              step={stepRot}
              value={state.rot1x}
              onChange={(v) => update('rot1x', clamp(v, -180, 180))}
            />
            <SliderRow
              label="Поворот Y °"
              min={-180}
              max={180}
              step={stepRot}
              value={state.rot1y}
              onChange={(v) => update('rot1y', clamp(v, -180, 180))}
            />
          </div>
        )}

        {activeTab === 'torus2' && (
          <div className={styles.rowCol}>
            <SliderRow
              label="R (большой радиус)"
              min={0.2}
              max={3}
              step={step}
              value={state.R2}
              onChange={(v) => update('R2', clamp(v, 0.2, 3))}
            />
            <SliderRow
              label="r (малый радиус)"
              min={0.05}
              max={1.5}
              step={step}
              value={state.r2}
              onChange={(v) => update('r2', Math.min(state.R2 - 0.05, clamp(v, 0.05, 1.5)))}
            />
            <SliderRow
              label="Положение X"
              min={-3}
              max={3}
              step={step}
              value={state.pos2[0]}
              onChange={(v) => updatePos2(0, v)}
            />
            <SliderRow
              label="Положение Y"
              min={-3}
              max={3}
              step={step}
              value={state.pos2[1]}
              onChange={(v) => updatePos2(1, v)}
            />
            <SliderRow
              label="Положение Z"
              min={-3}
              max={3}
              step={step}
              value={state.pos2[2]}
              onChange={(v) => updatePos2(2, v)}
            />
            <SliderRow
              label="Поворот X °"
              min={-180}
              max={180}
              step={stepRot}
              value={state.rot2x}
              onChange={(v) => update('rot2x', clamp(v, -180, 180))}
            />
            <SliderRow
              label="Поворот Y °"
              min={-180}
              max={180}
              step={stepRot}
              value={state.rot2y}
              onChange={(v) => update('rot2y', clamp(v, -180, 180))}
            />
          </div>
        )}

        {activeTab === 'camera' && (
          <div className={styles.rowCol}>
            <SliderRow
              label="Zoom"
              min={2}
              max={25}
              step={0.5}
              value={state.zoom}
              onChange={(v) => update('zoom', clamp(v, 2, 25))}
            />
          </div>
        )}

        <p className={styles.hint}>
          Камера: ЛКМ + мышь — вращение. Ctrl (или Cmd) + ЛКМ + мышь — панорама. Колёсико — зум.
        </p>
      </div>
    </div>
  );
}
