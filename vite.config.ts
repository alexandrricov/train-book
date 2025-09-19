import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const isProd = mode === "production";

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["icons/icon.svg"], // additional assets, if any
        manifest: {
          name: "TrainBook",
          short_name: "TrainBook",
          description: "Your workouts & progress.",
          start_url: isProd ? "/train-book/" : "/",
          scope: isProd ? "/train-book/" : "/",
          display: "standalone",
          background_color: "#0ea5e9",
          theme_color: "#0ea5e9",
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
          // basic offline support for SPA + cache strategy
          navigateFallback: isProd ? "/train-book/index.html" : "/index.html",
          runtimeCaching: [
            // Example: cache Google Fonts
            {
              urlPattern: /^https:\/\/fonts\.(?:gstatic|googleapis)\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "google-fonts",
                expiration: {
                  maxEntries: 20,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
              },
            },
            // Example: cache images
            {
              urlPattern: ({ request }) => request.destination === "image",
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "images",
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                },
              },
            },
            // Example: your backend API (if any)
            // {
            //   urlPattern: /\/api\/.*$/i,
            //   handler: "NetworkFirst",
            //   options: {
            //     cacheName: "api",
            //     networkTimeoutSeconds: 3,
            //     expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 },
            //   },
            // },
          ],
        },
        devOptions: {
          enabled: false, // you can set this to true to test SW in dev, but usually leave it as false
        },
      }),
    ],
    server: {
      port: 5177,
    },
    base: mode === "production" ? "/train-book/" : "/",
  };
});
