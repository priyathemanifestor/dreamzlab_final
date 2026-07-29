import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Plain generateSW (the default, well-tested strategy) — handles
      // installability (the manifest, "Add to Home Screen") only. Push
      // notifications are handled by a completely separate, plain,
      // unprocessed service worker at public/push-sw.js instead of trying
      // to inject custom code into this one — see that file for why.
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'DreamzLab',
        short_name: 'DreamzLab',
        description: 'Bring your dreams to reality — set intentions, build milestones, track progress.',
        theme_color: '#150f24',
        background_color: '#150f24',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
});
