import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    allowedHosts: ['enrico-unthrust-clare.ngrok-free.dev'],
    proxy: {
      "/api": {
        target: "https://enrico-unthrust-clare.ngrok-free.dev",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
