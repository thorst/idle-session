import { defineConfig } from 'vite';
import istanbul from 'vite-plugin-istanbul';

export default defineConfig({
  build: {
    lib: {
      entry: 'IdleSession.js',
      formats: ['es'],
      fileName: 'idle-session.min'
    },
    minify: 'esbuild'
  },
  plugins: process.env.VITE_COVERAGE === 'true' ? [
    istanbul({ include: ['IdleSession.js'], extension: ['.js'], requireEnv: false })
  ] : []
});
