import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

/** Builds only the answer-first shell in src/redesign/, for review as an Artifact. */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
  resolve: { alias: { '@': path.resolve(__dirname, '.') } },
  build: {
    outDir: 'dist-redesign',
    emptyOutDir: true,
    rollupOptions: { input: path.resolve(__dirname, 'redesign.html') },
  },
});
