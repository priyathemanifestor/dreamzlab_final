// POST /api/nudge-buddy
// Called client-side right after a milestone is marked done. If the caller
// is paired with a buddy, sends that buddy a real push notification. Silent
// no-op if not paired, not subscribed, or on cooldown — this is meant to be
// called fire-and-forget from the UI, never surfaced as an error to the
// person completing the milestone.

import webpush from 'web-push';
import { kv } from '@vercel/kv';

const COOLDOWN_MS = 5 * 60 * 1000; // don't nudge more than once every 5 minutes, even if completing several milestones in a row

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { endpoint, dreamTitle, category } = req.body || {};
  if (!endpoint) {
    res.status(400).json({ error: 'Missing endpoint.' });
    return;
  }

  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    res.status(200).json({ sent: false, reason: 'push not configured' }); // soft-fail, this endpoint should never error out the UI
    return;
  }

  try {
    const raw = await kv.hget('push-subscriptions', endpoint);
    if (!raw) { res.status(200).json({ sent: false, reason: 'not subscribed' }); return; }
    const record = typeof raw === 'string' ? JSON.parse(raw) : raw;

    if (!record.buddyEndpoint) { res.status(200).json({ sent: false, reason: 'no buddy' }); return; }

    const now = Date.now();
    if (record.lastNudgeSentAt && now - record.lastNudgeSentAt < COOLDOWN_MS) {
      res.status(200).json({ sent: false, reason: 'cooldown' });
      return;
    }

    const buddyRaw = await kv.hget('push-subscriptions', record.buddyEndpoint);
    if (!buddyRaw) { res.status(200).json({ sent: false, reason: 'buddy not found' }); return; }
    const buddyRecord = typeof buddyRaw === 'string' ? JSON.parse(buddyRaw) : buddyRaw;

    webpush.setVapidDetails(VAPID_SUBJECT || 'mailto:noreply@example.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

    const body = dreamTitle
      ? `🎉 Your buddy just made progress on "${dreamTitle}"${category ? ` (${category})` : ''}!`
      : '🎉 Your buddy just completed a milestone!';

    await webpush.sendNotification(buddyRecord.subscription, JSON.stringify({ title: '✨ DreamzLab', body }));

    record.lastNudgeSentAt = now;
    await kv.hset('push-subscriptions', { [endpoint]: JSON.stringify(record) });

    res.status(200).json({ sent: true });
  } catch (e) {
    // Best-effort feature — never surface a hard error for a failed nudge.
    res.status(200).json({ sent: false, reason: 'error', detail: String(e && e.message || e) });
  }
}
