import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        'node_modules/**',
        'dist/**',
        'src/demo/**',
        'src/debug/**',
        'src/**/*.d.ts',
        'src/**/*.test.ts',
        'tests/**',
        'scripts/**',
      ],
      reporter: ['text', 'json', 'html', 'json-summary'],
      thresholds: {
        lines: 85.58,
        functions: 86.25,
        branches: 84.49,
        statements: 85.58,
      },
    },
    include: ['src/**/*.test.ts'],
  },
});
