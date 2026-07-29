// GET/POST /api/send-daily-push
//
// Triggered by the Vercel Cron job in vercel.json (once/day on the Hobby
// plan) and, optionally, by a free GitHub Actions hourly workflow for finer
// timing precision (see README) — safe to call more often than once a day,
// since each subscriber is only ever sent to once per their own local day.
//
// For each stored subscription:
//   1. Compute their local hour/date from the timezone offset they sent.
//   2. Send only if it's at-or-after their chosen hour AND they haven't
//      already been sent to today (in their local time).
//   3. Content is personalized with Claude from their dream titles/
//      categories if they have any; otherwise falls back to the same
//      rotating affirmation list the rest of the app uses.

import webpush from 'web-push';
import { kv } from '@vercel/kv';
import { AFFIRMATIONS, dayOfYear } from '../src/data.js';

function computeLocalHourAndDate(utcNow, timezoneOffsetMinutes) {
  const localMs = utcNow.getTime() - timezoneOffsetMinutes * 60000;
  const local = new Date(localMs);
  const hour = local.getUTCHours();
  const y = local.getUTCFullYear();
  const m = String(local.getUTCMonth() + 1).padStart(2, '0');
  const d = String(local.getUTCDate()).padStart(2, '0');
  return { hour, dateStr: `${y}-${m}-${d}` };
}

async function personalizedAffirmation(dreamProfile, fallback) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || !dreamProfile || dreamProfile.length === 0) return fallback;

  const goalList = dreamProfile.map((d, i) => `${i + 1}. ${d.title} (${d.category || 'uncategorized'})`).join('\n');
  const systemPrompt = 'Write ONE short, warm, second-person daily affirmation (1-2 sentences, under 40 words) for someone actively working toward the goals below. Return ONLY the affirmation text — no quotes, no preamble, no markdown.';

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 120,
        system: systemPrompt,
        messages: [{ role: 'user', content: goalList }],
      }),
    });
    if (!response.ok) return fallback;
    const data = await response.json();
    const textBlock = (data.content || []).find((b) => b.type === 'text');
    const text = textBlock && textBlock.text.trim();
    return text || fallback;
  } catch (e) {
    return fallback;
  }
}

export default async function handler(req, res) {
  if (process.env.CRON_SECRET) {
    const auth = req.headers['authorization'];
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
  }

  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    res.status(500).json({ error: 'VAPID keys are not configured on the server.' });
    return;
  }
  webpush.setVapidDetails(VAPID_SUBJECT || 'mailto:noreply@example.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

  const fallbackAffirmation = AFFIRMATIONS[dayOfYear() % AFFIRMATIONS.length];
  const utcNow = new Date();

  try {
    const all = await kv.hgetall('push-subscriptions');
    const entries = Object.entries(all || {});
    let sent = 0, skipped = 0, removed = 0, failed = 0;

    await Promise.all(entries.map(async ([endpoint, raw]) => {
      let record;
      try {
        record = typeof raw === 'string' ? JSON.parse(raw) : raw;
      } catch (e) {
        return;
      }

      const preferredHour = Number.isInteger(record.preferredHourLocal) ? record.preferredHourLocal : 8;
      const tzOffset = typeof record.timezoneOffsetMinutes === 'number' ? record.timezoneOffsetMinutes : 0;
      const { hour, dateStr } = computeLocalHourAndDate(utcNow, tzOffset);

      const alreadySentToday = record.lastSentLocalDate === dateStr;
      const pastPreferredHour = hour >= preferredHour;
      if (alreadySentToday || !pastPreferredHour) {
        skipped++;
        return;
      }

      const body = await personalizedAffirmation(record.dreamProfile, fallbackAffirmation);
      const payload = JSON.stringify({ title: '✨ DreamzLab', body });

      try {
        await webpush.sendNotification(record.subscription, payload);
        sent++;
        record.lastSentLocalDate = dateStr;
        await kv.hset('push-subscriptions', { [endpoint]: JSON.stringify(record) });
      } catch (e) {
        if (e && (e.statusCode === 404 || e.statusCode === 410)) {
          await kv.hdel('push-subscriptions', endpoint);
          removed++;
        } else {
          failed++;
        }
      }
    }));

    res.status(200).json({ sent, skipped, removed, failed, total: entries.length });
  } catch (e) {
    res.status(500).json({ error: 'Unexpected server error', detail: String(e && e.message || e) });
  }
}
