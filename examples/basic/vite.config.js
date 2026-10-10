import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  server: {
    port: 3000,
    host: true
  },
  resolve: {
    alias: {
      'giser-maptalks-drawtool': path.resolve(__dirname, '../../dist/giser-maptalks-drawtool.esm.js')
    },
    dedupe: ['maptalks']
  },
  optimizeDeps: {
    include: ['maptalks', 'maptalks-gl'],
    exclude: ['giser-maptalks-drawtool']
  }
});
