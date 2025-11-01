import { Link } from 'react-router-dom';
import { Card } from 'ui-kit';
import styles from './Home.module.css';

export default function Home() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, width: '100%' }}>
      <Link to="/visualizations/light-shadow" style={{ textDecoration: 'none', color: 'inherit' }}>
        <Card className={styles.clickable}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontWeight: 600 }}>Light + Squares Shadows</div>
            <div style={{ color: '#555' }}>Interactive visualization of light, horizon, and shadows.</div>
          </div>
        </Card>
      </Link>
      <Link to="/visualizations/perspective-cube" style={{ textDecoration: 'none', color: 'inherit' }}>
        <Card className={styles.clickable}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontWeight: 600 }}>Perspective Cube (2/3‑point)</div>
            <div style={{ color: '#555' }}>Cube with XYZ rotations, draggable horizon, and vanishing lines.</div>
          </div>
        </Card>
      </Link>
    </div>
  );
}


