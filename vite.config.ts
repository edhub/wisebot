import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    proxy: {
      "/api/deepseek": {
        target: "https://api.deepseek.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/deepseek/, ""),
      },
      "/api/aliyun": {
        target: "https://dashscope.aliyuncs.com/compatible-mode/v1",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/aliyun/, ""),
      },
    },
  },
});
