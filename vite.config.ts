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
        // 禁止上游返回压缩内容，避免 http-proxy 对 gzip/br 流处理不当
        // 导致 UTF-8 多字节字符截断（出现 ���）
        headers: { "accept-encoding": "identity" },
      },
      "/api/aliyun": {
        target: "https://dashscope.aliyuncs.com/compatible-mode/v1",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/aliyun/, ""),
        headers: { "accept-encoding": "identity" },
      },
    },
  },
});
