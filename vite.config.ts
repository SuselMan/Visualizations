import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
  base: '/Visualizations/',
  plugins: [react(), svgr()],
  resolve: {
    alias: {
      '@': path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'src'),
      'ui-kit': path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'external/ui-kit'),
    },
  },
});


