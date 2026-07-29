// Client side of real Web Push — subscribes this browser to push, sends the
// subscription to the server to store (in Vercel KV), and can unsubscribe.
// Only active if VITE_VAPID_PUBLIC_KEY is set at build time (see README);
// otherwise isPushConfigured() returns false and the UI hides itself.

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export function isPushConfigured() {
  return Boolean(import.meta.env.VITE_VAPID_PUBLIC_KEY);
}

// Only sends category + title (not descriptions, not milestones) — enough
// to personalize an affirmation's topic, not a copy of your dream journal.
export function buildDreamProfile(dreams) {
  if (!dreams || dreams.length === 0) return null;
  return dreams.map((d) => ({ title: d.title, category: d.category }));
}

export function isPushSupported() {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;
}

// Registers (or reuses) the plain push-sw.js at its own scope, deliberately
// separate from the installability service worker vite-plugin-pwa manages
// at the root scope — this avoids the two ever conflicting or one
// silently replacing the other.
async function getPushRegistration() {
  if (!isPushSupported()) return null;
  const existing = await navigator.serviceWorker.getRegistration('/push-sw-scope/');
  if (existing) return existing;
  const reg = await navigator.serviceWorker.register('/push-sw.js', { scope: '/push-sw-scope/' });
  await navigator.serviceWorker.ready.catch(() => {}); // best-effort — not required for correctness here
  return reg;
}

export async function isPushSubscribed() {
  if (!isPushSupported()) return false;
  const reg = await getPushRegistration();
  if (!reg) return false;
  const sub = await reg.pushManager.getSubscription();
  return Boolean(sub);
}

export async function subscribeToPush(preferredHourLocal, dreamProfile) {
  if (!isPushConfigured()) throw new Error('Push notifications are not configured for this deployment.');
  if (!isPushSupported()) throw new Error('Push notifications are not supported in this browser.');

  const reg = await getPushRegistration();
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY),
  });

  const response = await fetch('/api/save-push-subscription', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subscription: sub,
      preferredHourLocal,
      timezoneOffsetMinutes: new Date().getTimezoneOffset(),
      dreamProfile: dreamProfile || null,
    }),
  });
  if (!response.ok) throw new Error('Subscribed locally, but could not save it to the server.');

  return sub;
}

// Call this whenever the person's dreams change while already subscribed,
// so the personalized affirmation content stays current — without needing
// them to re-subscribe. Silently no-ops if not currently subscribed.
export async function syncPushProfile(dreamProfile) {
  if (!isPushConfigured() || !isPushSupported()) return;
  const reg = await getPushRegistration();
  if (!reg) return;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;
  try {
    await fetch('/api/update-push-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: sub.endpoint, dreamProfile }),
    });
  } catch (e) { /* best-effort — a stale affirmation topic isn't worth surfacing an error for */ }
}

export async function unsubscribeFromPush() {
  if (!isPushSupported()) return;
  const reg = await getPushRegistration();
  if (!reg) return;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;

  try {
    await fetch('/api/remove-push-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    });
  } finally {
    await sub.unsubscribe();
  }
}

// --- Buddy nudges ---
// A lightweight pairing system (not a full accounts/friends system — there
// isn't one). One person gets a code, shares it with exactly one real
// friend out of band (text, etc.), the friend enters it, and from then on
// completing a milestone sends the paired buddy a real push notification.

async function currentEndpoint() {
  const reg = await getPushRegistration();
  if (!reg) return null;
  const sub = await reg.pushManager.getSubscription();
  return sub ? sub.endpoint : null;
}

// Returns { code, paired } or null if not currently subscribed to push.
export async function getBuddyCode() {
  const endpoint = await currentEndpoint();
  if (!endpoint) return null;
  const response = await fetch('/api/get-buddy-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || 'Could not get a buddy code.');
  }
  return response.json();
}

export async function pairWithBuddy(code) {
  const endpoint = await currentEndpoint();
  if (!endpoint) throw new Error('Enable push notifications first.');
  const response = await fetch('/api/pair-buddy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint, code }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || 'Could not pair with that code.');
  }
  return response.json();
}

export async function unpairBuddy() {
  const endpoint = await currentEndpoint();
  if (!endpoint) return;
  await fetch('/api/unpair-buddy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint }),
  }).catch(() => {});
}

// Fire-and-forget — call right after a milestone is marked done. Never
// throws, never surfaces an error; silently does nothing if push isn't
// configured/subscribed or there's no paired buddy.
export async function nudgeBuddy(dreamTitle, category) {
  if (!isPushConfigured() || !isPushSupported()) return;
  try {
    const endpoint = await currentEndpoint();
    if (!endpoint) return;
    await fetch('/api/nudge-buddy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint, dreamTitle, category }),
    });
  } catch (e) { /* best-effort — never worth surfacing to the person who just completed something */ }
}
