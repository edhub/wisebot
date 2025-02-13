import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    proxy: {
      '/api/aliyun': {
        target: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api\/aliyun/, '')
      }
    },
  }
});
