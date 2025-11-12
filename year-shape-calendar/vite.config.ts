import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  // Cloudflare Pages uses root path, GitHub Pages uses /year-shape/
  base: process.env.CF_PAGES ? '/' : 
        (process.env.VITE_BASE_URL || 
         (process.env.NODE_ENV === 'production' ? '/year-shape/' : '/')),
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});

