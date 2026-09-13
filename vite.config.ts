import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      // "prompt" en vez de "autoUpdate": así onNeedRefresh sí se invoca y el usuario decide
      // cuándo recargar. Con autoUpdate el service worker recargaba solo, y un despliegue
      // a mitad de un formulario se llevaba por delante lo que estuviera escrito.
      registerType: "prompt",
      includeAssets: ["favicon.ico", "icon-192.png", "icon-512.png"],
      workbox: {
        navigateFallbackDenylist: [/^\/~oauth/],
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        // El bundle supera el límite por defecto de 2 MiB y quedaba fuera de la precarga,
        // dejando la app sin funcionar offline pese al aviso de "lista sin conexión".
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
      manifest: {
        name: "Plata Clara - Control Financiero",
        short_name: "Plata Clara",
        description: "Controla tus gastos, deudas y proyecciones financieras",
        theme_color: "#256CD0",
        background_color: "#eef4fc",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
