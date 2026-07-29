// Custom service worker source for vite-plugin-pwa's injectManifest
// strategy. Handles two things beyond the default PWA install behavior:
// real Web Push delivery, and focusing/opening the app when a notification
// is tapped.

// Required placeholder for vite-plugin-pwa's injectManifest build step —
// it replaces this with the actual precache manifest array at build time.
// We don't use it for caching here (kept intentionally simple), but the
// build step needs to find this reference.
self.__WB_MANIFEST;

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
