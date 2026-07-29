// POST /api/pair-buddy
// Links two push subscriptions bidirectionally using a code one of them
// generated via /api/get-buddy-code. Each subscription can have at most
// one buddy (simple 1:1 pairing, not a followers list).

import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { endpoint, code } = req.body || {};
  if (!endpoint || !code) {
    res.status(400).json({ error: 'Missing endpoint or code.' });
    return;
  }

  try {
    const buddyEndpoint = await kv.hget('buddy-codes', code.trim().toUpperCase());
    if (!buddyEndpoint) {
      res.status(404).json({ error: "That code doesn't match anyone. Double-check it with your friend." });
      return;
    }
    if (buddyEndpoint === endpoint) {
      res.status(400).json({ error: "That's your own code — get your friend's instead." });
      return;
    }

    const [myRaw, buddyRaw] = await Promise.all([
      kv.hget('push-subscriptions', endpoint),
      kv.hget('push-subscriptions', buddyEndpoint),
    ]);
    if (!myRaw) { res.status(404).json({ error: 'Subscribe to push notifications first.' }); return; }
    if (!buddyRaw) { res.status(404).json({ error: "Your friend's subscription isn't active anymore." }); return; }

    const myRecord = typeof myRaw === 'string' ? JSON.parse(myRaw) : myRaw;
    const buddyRecord = typeof buddyRaw === 'string' ? JSON.parse(buddyRaw) : buddyRaw;

    myRecord.buddyEndpoint = buddyEndpoint;
    buddyRecord.buddyEndpoint = endpoint;

    await Promise.all([
      kv.hset('push-subscriptions', { [endpoint]: JSON.stringify(myRecord) }),
      kv.hset('push-subscriptions', { [buddyEndpoint]: JSON.stringify(buddyRecord) }),
    ]);

    res.status(200).json({ ok: true, paired: true });
  } catch (e) {
    res.status(500).json({ error: 'Could not pair with that code.', detail: String(e && e.message || e) });
  }
}
