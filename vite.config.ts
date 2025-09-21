import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isProd = mode === "production";
  const base = isProd ? "/train-book/" : "/";

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: "autoUpdate",
        manifest: {
          name: "TrainBook",
          short_name: "TrainBook",
          description: "Your workouts & progress",
          start_url: base,
          scope: base,
          display: "standalone",
          background_color: "#A4CEA6",
          theme_color: "#228b22",
          icons: [
            { src: "icons/pwa-192.png", sizes: "192x192", type: "image/png" },
            { src: "icons/pwa-512.png", sizes: "512x512", type: "image/png" },
            {
              src: "icons/maskable-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        workbox: {
          navigateFallback: isProd ? "/train-book/index.html" : "/index.html",
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
    server: {
      port: 5177,
    },
    base: mode === "production" ? "/train-book/" : "/",
  };
});
