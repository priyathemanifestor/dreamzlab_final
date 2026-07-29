// POST /api/unpair-buddy
// Removes the pairing on both sides.

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
    const raw = await kv.hget('push-subscriptions', endpoint);
    if (!raw) { res.status(404).json({ error: 'No subscription found.' }); return; }
    const record = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const buddyEndpoint = record.buddyEndpoint;

    record.buddyEndpoint = null;
    await kv.hset('push-subscriptions', { [endpoint]: JSON.stringify(record) });

    if (buddyEndpoint) {
      const buddyRaw = await kv.hget('push-subscriptions', buddyEndpoint);
      if (buddyRaw) {
        const buddyRecord = typeof buddyRaw === 'string' ? JSON.parse(buddyRaw) : buddyRaw;
        buddyRecord.buddyEndpoint = null;
        await kv.hset('push-subscriptions', { [buddyEndpoint]: JSON.stringify(buddyRecord) });
      }
    }

    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Could not unpair.', detail: String(e && e.message || e) });
  }
}
