import { Link } from 'react-router-dom';
import { Card } from 'ui-kit';
import styles from './Home.module.css';
import cubeImg from '@/public/cube.png';
import shadowsImg from '@/public/shadows.png';

export default function Home() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, width: '100%' }}>
      <Link to="/visualizations/light-shadow" style={{ textDecoration: 'none', color: 'inherit' }}>
        <Card className={styles.clickable}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <img className={styles.thumb} src={shadowsImg} alt="Light + Squares Shadows preview" />
            <div style={{ fontWeight: 600 }}>Light + Squares Shadows</div>
            <div style={{ color: '#555' }}>Interactive visualization of light, horizon, and shadows.</div>
          </div>
        </Card>
      </Link>
      <Link to="/visualizations/perspective-cube" style={{ textDecoration: 'none', color: 'inherit' }}>
        <Card className={styles.clickable}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <img className={styles.thumb} src={cubeImg} alt="Perspective Cube preview" />
            <div style={{ fontWeight: 600 }}>Perspective Cube (2/3‑point)</div>
            <div style={{ color: '#555' }}>Cube with XYZ rotations, draggable horizon, and vanishing lines.</div>
          </div>
        </Card>
      </Link>
      <Link to="/visualizations/ellipse-practice" style={{ textDecoration: 'none', color: 'inherit' }}>
        <Card className={styles.clickable}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontWeight: 600 }}>Ellipse in Perspective</div>
            <div style={{ color: '#555' }}>Draw an ellipse inside a perspective square; get accuracy score vs expected.</div>
          </div>
        </Card>
      </Link>
      <Link to="/visualizations/wireframe-3d" style={{ textDecoration: 'none', color: 'inherit' }}>
        <Card className={styles.clickable}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontWeight: 600 }}>Wireframe 3D (Cube / Cylinder / Cone)</div>
            <div style={{ color: '#555' }}>Add and transform shapes; rotate camera; see intersection curves in red.</div>
          </div>
        </Card>
      </Link>
    </div>
  );
}


