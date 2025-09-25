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
        filename: "sw.js",
        registerType: "autoUpdate",
        injectRegister: "auto",
        manifest: {
          name: "TrainBook",
          short_name: "TrainBook",
          description:
            "TrainBook helps you log workouts, set daily fitness goals, and track your progress with ease.",
          start_url: base,
          scope: base,
          display: "standalone",
          background_color: "#e1d9ff",
          theme_color: "#6842ff",
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
          skipWaiting: true,
          clientsClaim: true,
          cleanupOutdatedCaches: true,

          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.mode === "navigate",
              handler: "NetworkFirst",
              options: {
                cacheName: "html",
                networkTimeoutSeconds: 4,
                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 }, // mild caching
              },
            },
          ],

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
