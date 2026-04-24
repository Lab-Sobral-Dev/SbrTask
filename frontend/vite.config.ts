import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import eruda from 'vite-plugin-eruda';

export default defineConfig({
  plugins: [
    react(),
    eruda({
      forceEnableInProduction: false,
    }),
  ],
  server: {
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
      '/socket.io': { target: 'http://localhost:3001', changeOrigin: true, ws: true },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    globals: true,
  },
});
