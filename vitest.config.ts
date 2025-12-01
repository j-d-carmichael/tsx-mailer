import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    alias: {
      'tsx-mailer/jsx-runtime': path.resolve(__dirname, 'src/jsx-runtime.ts'),
      'tsx-mailer/jsx-dev-runtime': path.resolve(__dirname, 'src/jsx-runtime.ts'),
      'tsx-mailer': path.resolve(__dirname, 'src/index.ts'),
    },
  },
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'tsx-mailer',
  },
});
