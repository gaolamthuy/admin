import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.git', 'tests/e2e/**'],
    globals: true,
    testTimeout: 5000,
    hookTimeout: 5000,
    // Disable UI for run mode
    ui: false,
    // Simple reporter
    reporters: ['verbose'],
  },
});
