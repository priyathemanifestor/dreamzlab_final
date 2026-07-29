// Serverless function (Vercel Node runtime): POST /api/recommend-people
// Given the person's dreams and a list of candidate feed authors (with a
// sample of what they've posted), asks Claude to pick who's worth following
// and why. Claude can only choose from the candidate list we send it.

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

  const { dreams, candidates } = req.body || {};
  if (!Array.isArray(dreams) || dreams.length === 0) {
    res.status(400).json({ error: 'At least one dream is required.' });
    return;
  }
  if (!Array.isArray(candidates) || candidates.length === 0) {
    res.status(400).json({ error: 'At least one candidate is required.' });
    return;
  }

  const systemPrompt = `You suggest which people in a social feed a person should follow, based on their own goals ("dreams") and what those people have posted.

Candidates (JSON, each is a real feed author and a sample of their recent post): ${JSON.stringify(candidates)}

Respond with ONLY a JSON object (no markdown fences, no other text) in exactly this shape:

{
  "recommendations": [
    { "author": "<exact author string from the candidates above>", "reason": "<one short, specific sentence tying this person's post to the user's actual dream>" }
  ]
}

Rules:
- Pick 1 to 3 candidates, best match first. Only use "author" values that appear in the candidates list above verbatim.
- Only recommend someone if there's a genuine, specific connection — don't force it if nothing fits well.
- "reason" should reference specifics from both the person's dream and the candidate's post, not just match categories generically.`;

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

    const validAuthors = new Set(candidates.map((c) => c.author));
    const recommendations = (Array.isArray(parsed.recommendations) ? parsed.recommendations : [])
      .filter((r) => r && validAuthors.has(r.author) && typeof r.reason === 'string')
      .slice(0, 3);

    res.status(200).json({ recommendations });
  } catch (e) {
    res.status(500).json({ error: 'Unexpected server error', detail: String(e && e.message || e) });
  }
}
