import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";

const redirectEnglishRoot = () => ({
  name: "redirect-english-root",
  configureServer(server) {
    server.middlewares.use((request, response, next) => {
      if (request.url === "/en") {
        response.statusCode = 302;
        response.setHeader("Location", "/en/");
        response.end();
        return;
      }
      next();
    });
  },
  configurePreviewServer(server) {
    server.middlewares.use((request, response, next) => {
      if (request.url === "/en") {
        response.statusCode = 302;
        response.setHeader("Location", "/en/");
        response.end();
        return;
      }
      next();
    });
  },
});

export default defineConfig({
  plugins: [redirectEnglishRoot(), react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        en: resolve(__dirname, "en/index.html"),
      },
    },
  },
});
