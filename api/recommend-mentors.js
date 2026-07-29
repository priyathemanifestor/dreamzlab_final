// Serverless function (Vercel Node runtime): POST /api/recommend-mentors
// Given the person's dreams, asks Claude to pick which of the (fictional,
// in-app) mentors are most relevant and why. Keeps the roster fixed —
// Claude can only choose from the real mentor IDs we send it, so it can't
// invent a mentor that isn't in the app.

import { MENTORS } from '../src/data.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured on the server.' });
    return;
  }

  const { dreams } = req.body || {};
  if (!Array.isArray(dreams) || dreams.length === 0) {
    res.status(400).json({ error: 'At least one dream is required.' });
    return;
  }

  const mentorList = MENTORS.map((m) => ({ id: m.id, name: m.name, category: m.category, achievement: m.achievement }));

  const systemPrompt = `You match a person's personal goals ("dreams") to the most relevant mentors from a fixed roster.

Available mentors (JSON): ${JSON.stringify(mentorList)}

Given the person's dreams, respond with ONLY a JSON object (no markdown fences, no other text) in exactly this shape:

{
  "recommendations": [
    { "mentorId": "<id from the roster above>", "reason": "<one short sentence tying this mentor to the person's specific dream(s)>" }
  ]
}

Rules:
- Pick 1 to 3 mentors, best match first. Only use mentorId values from the roster above — never invent a new one.
- Only recommend a mentor if there's a genuine, specific connection to one of the dreams — don't force a match if nothing fits well.
- "reason" should reference the person's actual dream title, not just repeat the mentor's category.`;

  const userPrompt = `Person's dreams:\n${dreams.map((d, i) => `${i + 1}. "${d.title}" (${d.category || 'uncategorized'}) — ${d.description || ''}`).join('\n')}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 500,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      res.status(502).json({ error: 'Claude API request failed', detail: errText });
      return;
    }

    const data = await response.json();
    const textBlock = (data.content || []).find((b) => b.type === 'text');
    if (!textBlock) {
      res.status(502).json({ error: 'No text content returned from Claude.' });
      return;
    }

    let parsed;
    try {
      const cleaned = textBlock.text.trim().replace(/^```json\s*|```$/g, '');
      parsed = JSON.parse(cleaned);
    } catch (e) {
      res.status(502).json({ error: 'Could not parse Claude response as JSON.', raw: textBlock.text });
      return;
    }

    const validIds = new Set(MENTORS.map((m) => m.id));
    const recommendations = (Array.isArray(parsed.recommendations) ? parsed.recommendations : [])
      .filter((r) => r && validIds.has(r.mentorId) && typeof r.reason === 'string')
      .slice(0, 3);

    res.status(200).json({ recommendations });
  } catch (e) {
    res.status(500).json({ error: 'Unexpected server error', detail: String(e && e.message || e) });
  }
}
