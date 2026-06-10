import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@vue3-invoice/api-sdk': fileURLToPath(new URL('./packages/api-sdk/src/index.ts', import.meta.url)),
      '@vue3-invoice/platform-api': fileURLToPath(new URL('./packages/invoice-platform-api/src/index.ts', import.meta.url))
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts'
  }
});
