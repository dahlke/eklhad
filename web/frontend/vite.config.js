import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { configDefaults } from 'vitest/config';

export default defineConfig(() => ({
    build: {
      outDir: 'build',
      commonjsOptions: {
        include: [/react-map-gl/, /node_modules/],
      },
    },
    plugins: [react()],
    optimizeDeps: {
      include: ['react-map-gl/mapbox', 'mapbox-gl'],
      esbuildOptions: {
        loader: {
          '.js': 'jsx',
          // TODO
          '.ts': 'tsx',
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
