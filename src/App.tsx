import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Home from './pages/Home';
import LightShadowPage from './pages/Visualization/LightShadowPage';
import PerspectiveCubePage from './pages/Visualization/PerspectiveCubePage';
import EllipsePracticePage from './pages/Visualization/EllipsePracticePage';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/visualizations/light-shadow" element={<LightShadowPage />} />
        <Route path="/visualizations/perspective-cube" element={<PerspectiveCubePage />} />
        <Route path="/visualizations/ellipse-practice" element={<EllipsePracticePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}


