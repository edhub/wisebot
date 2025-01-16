import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    proxy: {
      '/api/deepseek': {
        target: 'https://api.deepseek.com/chat/completions',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api\/deepseek/, '')
      }
    },
  }
});
