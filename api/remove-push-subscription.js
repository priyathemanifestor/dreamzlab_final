// POST /api/remove-push-subscription
// Removes a browser's push subscription from Vercel KV — called when the
// user turns off push notifications.

import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { endpoint } = req.body || {};
  if (!endpoint) {
    res.status(400).json({ error: 'Missing endpoint.' });
    return;
  }

  try {
    await kv.hdel('push-subscriptions', endpoint);
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Could not remove subscription.', detail: String(e && e.message || e) });
  }
}
