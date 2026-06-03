import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'https://onowl-vibe-coder-production.up.railway.app/',
        changeOrigin: true,
        secure: false,
        timeout: 0, // No timeout for AI streams
        proxyTimeout: 0
      }
    }
  }
});
