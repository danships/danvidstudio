import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      exclude: ['node_modules/**', 'dist/**', 'src/demo/**', '**/*.d.ts', '**/*.test.ts', '**/*.config.ts'],
      reporter: ['text', 'json', 'html'],
    },
    include: ['src/**/*.{test,spec}.ts'],
  },
});
