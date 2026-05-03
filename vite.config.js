import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/allowance-mvp/",
  plugins: [react()],
  server: {
    port: 4090,
    open: true
  },
  build: {
    target: "es2020",
    minify: "esbuild",
    sourcemap: false
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.js"]
  },
  define: {
    "import.meta.env.VITE_APP_VERSION": JSON.stringify(process.env.npm_package_version || "1.0.0")
  }
});
