import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    proxy: {
      // REST API
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },

      // Socket.IO / WebSocket
      "/socket.io": {
        target: "http://localhost:5000",
        changeOrigin: true,
        ws: true,
      },
    },
  },
});