import { defineConfig } from 'vite';
export default defineConfig({ build: { outDir: 'dist', emptyOutDir: true }, server: { port: Number(process.env.PORT ?? 5174) }, preview: { port: Number(process.env.PORT ?? 5174) } });
