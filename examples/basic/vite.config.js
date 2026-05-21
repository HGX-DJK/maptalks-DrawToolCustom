import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    host: true
  },
  resolve: {
    dedupe: ['maptalks']
  },
  optimizeDeps: {
    include: ['maptalks', 'maptalks-gl', 'giser-maptalks-drawtool']
  }
});
