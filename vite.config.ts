/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      port: 5173,
      strictPort: true, // the backend's ADMIN_ORIGINS lists exactly this port
      proxy: {
        // Same origin in development: the session cookie and API calls need no CORS.
        '/api': { target: env.DEV_API_TARGET || 'http://localhost:8000', changeOrigin: false },
      },
    },
    preview: { port: 5173, strictPort: true },
    build: { sourcemap: false },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/testing/setup.ts'],
      css: false,
      restoreMocks: true,
    },
  };
});
