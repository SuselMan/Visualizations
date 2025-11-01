import { Link } from 'react-router-dom';
import { Card, Button } from 'ui-kit';

export default function Home() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, width: '100%' }}>
      <Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontWeight: 600 }}>Light + Squares Shadows</div>
          <div style={{ color: '#555' }}>Interactive visualization of light, horizon, and shadows.</div>
          <div>
            <Link to="/visualizations/light-shadow">
              <Button>Open</Button>
            </Link>
          </div>
        </div>
      </Card>
      <Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontWeight: 600 }}>Perspective Cube (2/3‑point)</div>
          <div style={{ color: '#555' }}>Cube with XYZ rotations, draggable horizon, and vanishing lines.</div>
          <div>
            <Link to="/visualizations/perspective-cube">
              <Button>Open</Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}


