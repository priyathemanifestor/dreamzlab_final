// Plain, static service worker — deliberately NOT run through any bundler
// or build-time code injection. Files in /public are copied byte-for-byte
// by Vite, so nothing here can be silently altered or stripped by a build
// tool, unlike the previous approach (vite-plugin-pwa's injectManifest).
//
// Registered at a separate scope from the installability service worker
// vite-plugin-pwa generates (see src/push.js), so the two don't conflict —
// this one exists purely to receive push events, not to control page
// requests or do any caching.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = { title: '✨ DreamzLab', body: '' };
  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'dreamzlab-push',
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('/');
      return undefined;
    })
  );
});
