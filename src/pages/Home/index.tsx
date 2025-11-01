import { Link } from 'react-router-dom';
import { Card, Button } from 'ui-kit';

export default function Home() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, width: '100%' }}>
      <Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontWeight: 600 }}>Light + Squares Shadows</div>
          <div style={{ color: '#555' }}>Интерактивная визуализация света, горизонта и теней.</div>
          <div>
            <Link to="/visualizations/light-shadow">
              <Button>Открыть</Button>
            </Link>
          </div>
        </div>
      </Card>
      <Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontWeight: 600 }}>Perspective Cube (2/3 точки)</div>
          <div style={{ color: '#555' }}>Куб с поворотами по осям, перетаскиваемый горизонт, линии к точкам схода.</div>
          <div>
            <Link to="/visualizations/perspective-cube">
              <Button>Открыть</Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}


