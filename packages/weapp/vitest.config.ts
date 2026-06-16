import { defineConfig } from 'vitest/config';
import path from 'node:path';
import type { Plugin } from 'vite';

function stripTsTypesPlugin(): Plugin {
  return {
    name: 'strip-ts-types',
    enforce: 'pre',
    async transform(code, id) {
      if (!/\.(ts|tsx|mts|cts)$/.test(id)) return null;
      const { transformSync } = (await import('esbuild')) as typeof import('esbuild');
      const result = transformSync(code, {
        loader: id.endsWith('tsx') ? 'tsx' : 'ts',
        target: 'es2020',
        format: 'esm',
      });
      return { code: result.code, map: result.map };
    },
  };
}

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['__tests__/**/*.test.ts', 'src/**/__tests__/**/*.test.ts'],
    server: {
      deps: {
        inline: [/src\//, /@tarojs\//],
      },
    },
  },
  resolve: {
    alias: [
      { find: '@/db/database', replacement: path.resolve(__dirname, 'src/db/database') },
      { find: '@/hooks', replacement: path.resolve(__dirname, 'src/hooks') },
      { find: '@/store/moodStore', replacement: path.resolve(__dirname, 'src/store/moodStore') },
      { find: '@/components', replacement: path.resolve(__dirname, 'src/components') },
      { find: '@/pages', replacement: path.resolve(__dirname, 'src/pages') },
      { find: '@', replacement: path.resolve(__dirname, 'src') + '/' },
      { find: '@moodly/shared', replacement: path.resolve(__dirname, '../shared/src/index.ts') },
    ],
  },
  esbuild: {
    target: 'es2020',
  },
  ssr: {
    noExternal: true,
  },
  plugins: [stripTsTypesPlugin()],
});
