import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Home from './pages/Home';
import LightShadowPage from './pages/Visualization/LightShadowPage';
import PerspectiveCubePage from './pages/Visualization/PerspectiveCubePage';
import WireframeModelerPage from './pages/Visualization/WireframeModelerPage';
import TwoToriPage from './pages/Visualization/TwoToriPage';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/visualizations/light-shadow" element={<LightShadowPage />} />
        <Route path="/visualizations/perspective-cube" element={<PerspectiveCubePage />} />
        <Route path="/visualizations/wireframe-3d" element={<WireframeModelerPage />} />
        <Route path="/visualizations/two-tori" element={<TwoToriPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}


