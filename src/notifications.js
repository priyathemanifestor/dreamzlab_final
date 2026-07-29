// Local (client-triggered) notifications — no server involved. These use
// the real Notification API, routed through the service worker registration
// when available (more reliable on mobile/installed-PWA contexts than the
// plain `new Notification()` constructor, which many mobile browsers block).
//
// This only fires when the app is actually opened — see notes in the README
// about the difference between this and true push (which needs a server).

export function isNotificationSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getPermission() {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission; // 'granted' | 'denied' | 'default'
}

export async function requestNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported';
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch (e) {
    return 'denied';
  }
}

export async function showLocalNotification(title, options) {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return false;
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, options);
        return true;
      }
    }
    // Fallback for browsers without an active service worker registration
    new Notification(title, options);
    return true;
  } catch (e) {
    return false;
  }
}
