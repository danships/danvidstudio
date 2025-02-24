import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import path from 'node:path';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'DanVidStudio',
      fileName: (format) => `danvidstudio.${format}.js`,
      formats: ['es', 'cjs'],
    },
    outDir: 'out',
    rollupOptions: {
      external: ['pixi.js'],
      output: {
        globals: {
          'pixi.js': 'PIXI',
        },
      },
    },
    sourcemap: true,
  },
  plugins: [
    dts({
      exclude: ['**/*.test.ts', '**/test/**', 'src/demo/**', 'tests/**'],
      tsconfigPath: 'tsconfig.build.json',
      rollupTypes: true,
    }),
  ],
  server: {
    open: process.env['INTEGRATION_TEST'] === 'true' ? 'tests/integration/index.html' : '/src/demo/index.html',
  },
});
