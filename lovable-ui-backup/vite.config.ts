import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    server: {
      proxy: {
        "/server": {
          target: "http://localhost:3000",
          changeOrigin: true,
        },
      },
    },
  },
});