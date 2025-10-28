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
    // Environment
    environment: 'jsdom',

    // Setup files
    setupFiles: ['./src/test/setup.ts'],

    // Fix JSDOM compatibility for Node.js 18+
    environmentOptions: {
      jsdom: {
        resources: 'usable',
        // Fix for Node.js 18+ compatibility
        beforeParse(window) {
          // Mock URL constructor for JSDOM
          if (!window.URL) {
            window.URL = class URL {
              constructor(url: string, base?: string) {
                const parsed = new URL(url, base);
                Object.assign(this, parsed);
              }
            } as unknown as typeof URL;
          }
        },
      },
    },

    // Test patterns
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.git'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'dist/',
      ],
      thresholds: {
        statements: 70,
        branches: 70,
        functions: 70,
        lines: 70,
      },
    },

    // UI configuration
    ui: true,

    // Globals
    globals: true,

    // Timeout
    testTimeout: 10000,

    // Hook timeout
    hookTimeout: 10000,
  },
});
