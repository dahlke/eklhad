import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
  return {
    build: {
      outDir: 'build',
    },
    plugins: [react()],
    optimizeDeps: {
      esbuildOptions: {
        loader: {
          '.js': 'jsx'
        },
      }
    }
  };
});

/*
// craco.config.js
module.exports = {
    style: {
        postcss: {
            plugins: [
                require("tailwindcss"),
                require("postcss-nested"),
                require("autoprefixer"),
            ],
        },
    },
}
*/