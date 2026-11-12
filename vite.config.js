import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // 相对路径：Cloudflare 根路径部署和 GitHub Pages 子路径 /ghic/ 都兼容
  base: "./",
  plugins: [vue(), tailwindcss()],
});
