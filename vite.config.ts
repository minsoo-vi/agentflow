import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import express from 'express';
import path from 'path';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import { createReportRouter } from './server/reportRoutes';
import { createPostgresRouter } from './server/postgresRoutes';
import { createMongoRouter } from './server/mongoRoutes';

const agentflowApiPlugin = (): Plugin => ({
  name: 'agentflow-api',
  configureServer(viteServer) {
    const app = express();

    app.use('/reports', createReportRouter());
    app.use('/postgres', createPostgresRouter());
    app.use('/mongo', createMongoRouter());

    viteServer.middlewares.use('/api', app);
  },
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    // 기본 node_modules/.vite 는 Docker/root 등으로 소유가 꼬이면 EACCES unlink 가 납니다.
    cacheDir: path.resolve(__dirname, '.vite-cache'),
    plugins: [react(), tailwindcss(), agentflowApiPlugin()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.TAVILY_API_KEY': JSON.stringify(env.TAVILY_API_KEY),
      'process.env.AF_TAVILY_MAX_QUERY_CHARS': JSON.stringify(env.AF_TAVILY_MAX_QUERY_CHARS ?? ''),
      'process.env.AF_TAVILY_SUMMARIZE_INPUT_CHARS': JSON.stringify(env.AF_TAVILY_SUMMARIZE_INPUT_CHARS ?? ''),
      'process.env.AF_REPORT_CONTEXT_CHARS': JSON.stringify(env.AF_REPORT_CONTEXT_CHARS ?? ''),
      'import.meta.env.VITE_LANGFUSE_PUBLIC_KEY': JSON.stringify(env.VITE_LANGFUSE_PUBLIC_KEY ?? ''),
      'import.meta.env.VITE_LANGFUSE_SECRET_KEY': JSON.stringify(env.VITE_LANGFUSE_SECRET_KEY ?? ''),
      'import.meta.env.VITE_LANGFUSE_BASE_URL': JSON.stringify(env.VITE_LANGFUSE_BASE_URL ?? ''),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        '/tavily-api': {
          target: 'https://api.tavily.com',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/tavily-api/, ''),
        },
      },
    },
  };
});