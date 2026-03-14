import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/auth': { target: 'http://localhost:3001', changeOrigin: true },
      '/documents': { target: 'http://localhost:3001', changeOrigin: true },
      '/chat': { target: 'http://localhost:3001', changeOrigin: true },
      '/settings': { target: 'http://localhost:3001', changeOrigin: true },
    },
  },
});
