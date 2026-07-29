// POST /api/get-buddy-code
// Generates (or returns the existing) short pairing code for a push
// subscription. Sharing this code with one real friend, who enters it via
// /api/pair-buddy, is how two real people link up for milestone nudges —
// there's no account system, so this code is the entire "identity."

import { kv } from '@vercel/kv';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I — avoids visual mix-ups when sharing

function randomCode(len = 6) {
  let out = '';
  for (let i = 0; i < len; i++) out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  return out;
}

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
    if (!raw) {
      res.status(404).json({ error: 'Subscribe to push notifications first.' });
      return;
    }
    const record = typeof raw === 'string' ? JSON.parse(raw) : raw;

    if (record.buddyCode) {
      res.status(200).json({ code: record.buddyCode, paired: Boolean(record.buddyEndpoint) });
      return;
    }

    let code;
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = randomCode();
      const existing = await kv.hget('buddy-codes', candidate);
      if (!existing) { code = candidate; break; }
    }
    if (!code) {
      res.status(500).json({ error: 'Could not generate a unique code, try again.' });
      return;
    }

    record.buddyCode = code;
    await kv.hset('push-subscriptions', { [endpoint]: JSON.stringify(record) });
    await kv.hset('buddy-codes', { [code]: endpoint });

    res.status(200).json({ code, paired: false });
  } catch (e) {
    res.status(500).json({ error: 'Could not get a buddy code.', detail: String(e && e.message || e) });
  }
}
