import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // injectManifest (rather than the default generateSW) lets us ship a
      // custom service worker (src/sw.js) that handles real Web Push
      // notifications, not just offline caching.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
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
      injectManifest: {
        // No files need to be precached for this app to work (everything
        // renders fine online-first), so keep the precache list empty
        // rather than pulling in extra build complexity.
        globPatterns: [],
      },
    }),
  ],
});
