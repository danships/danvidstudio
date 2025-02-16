import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import path from 'node:path';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'DanVidStudio',
      fileName: 'danvidstudio',
      formats: ['es'],
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
  },
  plugins: [
    dts({
      exclude: ['**/*.test.ts', '**/test/**', 'src/demo/**'],
      tsconfigPath: 'tsconfig.build.json',
    }),
  ],
  server: {
    open: '/src/demo/index.html',
  },
  publicDir: 'public',
});
