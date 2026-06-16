import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: { environment: 'node', globals: true },
  resolve: {
    alias: {
      '@moodly/shared': new URL('./src/', import.meta.url).pathname,
    },
  },
});
