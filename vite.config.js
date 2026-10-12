import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // GitHub Pages 部署在子路径 /ghic/ 下
  base: "/ghic/",
  plugins: [vue(), tailwindcss()],
});
