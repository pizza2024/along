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
      { find: '@', replacement: path.resolve(__dirname, '../src') + '/' },
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
