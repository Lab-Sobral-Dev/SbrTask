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
  test: {
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    globals: true,
  },
});
