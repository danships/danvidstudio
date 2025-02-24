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
    },
    include: ['src/**/*.test.ts'],
  },
});
