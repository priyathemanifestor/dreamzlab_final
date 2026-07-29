// POST /api/save-push-subscription
// Stores a browser's push subscription in Vercel KV, keyed by its unique
// endpoint URL, along with the person's preferred delivery hour and a
// lightweight dream profile (title + category only) used to personalize
// the affirmation content. All of this stays in KV — nothing about it
// appears anywhere else.

import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { subscription, preferredHourLocal, timezoneOffsetMinutes, dreamProfile } = req.body || {};
  if (!subscription || typeof subscription.endpoint !== 'string') {
    res.status(400).json({ error: 'Invalid push subscription.' });
    return;
  }

  const record = {
    subscription,
    preferredHourLocal: Number.isInteger(preferredHourLocal) ? preferredHourLocal : 8,
    timezoneOffsetMinutes: typeof timezoneOffsetMinutes === 'number' ? timezoneOffsetMinutes : 0,
    dreamProfile: Array.isArray(dreamProfile) ? dreamProfile.slice(0, 20) : null, // cap size, defensive
    lastSentLocalDate: null,
  };

  try {
    await kv.hset('push-subscriptions', { [subscription.endpoint]: JSON.stringify(record) });
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Could not save subscription — is Vercel KV configured for this project?', detail: String(e && e.message || e) });
  }
}
