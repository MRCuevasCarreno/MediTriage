// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "https://localhost:7290",
        changeOrigin: true,
        secure: false, // cert de desarrollo self-signed
        // /api/auth/me -> https://localhost:7290/auth/me
        // /api/admin/stats -> https://localhost:7290/admin/stats
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
