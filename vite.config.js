import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  base: process.env.VITE_BASE_PATH || "/allowance-mvp/",
  plugins: [react()],
  server: {
    port: 4090,
    open: true
  },
  build: {
    target: "es2020",
    minify: "esbuild",
    sourcemap: mode !== "production"
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.js"]
  },
  define: {
    "import.meta.env.VITE_APP_VERSION": JSON.stringify(process.env.npm_package_version || "1.0.0")
  }
}));
