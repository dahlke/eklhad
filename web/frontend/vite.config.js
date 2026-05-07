import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { configDefaults } from 'vitest/config';

export default defineConfig(() => ({
    build: {
      outDir: 'build',
      commonjsOptions: {
        include: [/react-map-gl/, /node_modules/],
      },
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('mapbox-gl') || id.includes('react-map-gl')) return 'mapbox-gl';
            if (id.includes('react-dom') || id.includes('react/')) return 'vendor-react';
            if (id.includes('date-fns')) return 'vendor-date';
          },
        },
      },
      // Increase chunk size warning limit since mapbox-gl is inherently large
      chunkSizeWarningLimit: 1000,
    },
    plugins: [react()],
    optimizeDeps: {
      include: ['react-map-gl/mapbox', 'mapbox-gl'],
      rolldownOptions: {
        onwarn() {},
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/setupTests.js', // Similar to CRA's setupTests.js
      exclude: [...configDefaults.exclude, 'node_modules/'], // Exclude node_modules from test runs
    },
}));
