
import { defineConfig } from 'vite';

export default defineConfig({
  define: {
    // Shims process.env to ensure geminiService.ts works in the browser
    'process.env': {
      API_KEY: process.env.API_KEY
    }
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  },
  server: {
    port: 3000
  }
});
