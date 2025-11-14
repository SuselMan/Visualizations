import { useState } from 'react';
import { Button } from 'ui-kit';
import styles from './EllipsePracticePage.module.css';
import EllipsePracticeCanvas from '@/visualizations/ellipse/EllipsePracticeCanvas';

export default function EllipsePracticePage() {
  const [score, setScore] = useState<number>(0);
  const [seed, setSeed] = useState<number>(Date.now());

  const width = 960;
  const height = 540;

  return (
    <div className={styles.root}>
      <EllipsePracticeCanvas width={width} height={height} onScore={setScore} seed={seed} />
      <div className={styles.panel}>
        <div className={styles.rowCol}>
          <div className={styles.label}>Ellipse accuracy</div>
          <div className={styles.score}>{score}%</div>
        </div>
        <div className={styles.row}>
          <Button onClick={() => setSeed(Date.now())}>New square</Button>
          <Button type="secondary" onClick={() => setScore(0)}>Clear score</Button>
        </div>
        <div className={styles.rowCol}>
          <div className={styles.label}>How to</div>
          <div>Draw an ellipse that would fit a circle inside the shown square in perspective. Release to evaluate; dashed curve is the expected ellipse.</div>
        </div>
      </div>
    </div>
  );
}


