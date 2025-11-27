import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
  base: '/Visualizations/',
  plugins: [react(), svgr()],
  optimizeDeps: {
    include: [
      'three',
      'three/examples/jsm/controls/OrbitControls.js',
      'three/examples/jsm/controls/TransformControls.js',
      'three-mesh-bvh',
      'three-bvh-csg',
    ],
  },
  resolve: {
    dedupe: ['three'],
    alias: {
      'three': path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'node_modules/three'),
      '@': path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'src'),
      'ui-kit': path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'external/ui-kit'),
    },
  },
});


