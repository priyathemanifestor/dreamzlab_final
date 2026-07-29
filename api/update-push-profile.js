// POST /api/update-push-profile
// Refreshes the dream profile (title + category list) on an existing push
// subscription record, without needing to re-subscribe. Called client-side
// whenever dreams change while push is already enabled, so the personalized
// affirmation content stays current.

import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { endpoint, dreamProfile } = req.body || {};
  if (!endpoint) {
    res.status(400).json({ error: 'Missing endpoint.' });
    return;
  }

  try {
    const raw = await kv.hget('push-subscriptions', endpoint);
    if (!raw) {
      res.status(404).json({ error: 'No subscription found for that endpoint.' });
      return;
    }
    const record = typeof raw === 'string' ? JSON.parse(raw) : raw;
    record.dreamProfile = Array.isArray(dreamProfile) ? dreamProfile.slice(0, 20) : null;
    await kv.hset('push-subscriptions', { [endpoint]: JSON.stringify(record) });
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Could not update profile.', detail: String(e && e.message || e) });
  }
}
