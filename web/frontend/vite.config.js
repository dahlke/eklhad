import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { configDefaults } from 'vitest/config';

export default defineConfig(() => ({
    build: {
      outDir: 'build',
    },
    plugins: [react()],
    optimizeDeps: {
      esbuildOptions: {
        loader: {
          '.js': 'jsx',
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/setupTests.js', // Similar to CRA's setupTests.js
      exclude: [...configDefaults.exclude, 'node_modules/'], // Exclude node_modules from test runs
    },
}));
