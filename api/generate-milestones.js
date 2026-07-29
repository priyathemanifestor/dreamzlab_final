// Serverless function (Vercel Node runtime). Deployed at POST /api/generate-milestones.
// Keeps the Anthropic API key server-side only — never exposed to the browser.
//
// Requires an ANTHROPIC_API_KEY environment variable to be set in your
// deployment platform (see README.md).

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

  const { title, description } = req.body || {};
  if (!title || typeof title !== 'string' || !title.trim()) {
    res.status(400).json({ error: 'A dream title is required.' });
    return;
  }

  const CATEGORY_KEYS = [
    'career', 'health', 'creative', 'travel', 'education',
    'financial', 'music', 'startup', 'fitness', 'relationship', 'default',
  ];

  const systemPrompt = `You help people turn a personal goal ("dream") into a short, concrete action plan.

Given a dream's title and description, respond with ONLY a JSON object (no markdown fences, no other text) in exactly this shape:

{
  "category": "one of: ${CATEGORY_KEYS.join(', ')}",
  "milestones": ["milestone 1", "milestone 2", "milestone 3", "milestone 4", "milestone 5"]
}

Rules for milestones:
- Exactly 5 milestones, ordered from first step to final step.
- Each milestone is a short, specific, actionable sentence (roughly 6-14 words) — something the person could actually check off, not vague advice.
- Reference concrete specifics from their title/description where possible (numbers, names, timeframes) rather than generic templates.
- No numbering, bullets, or extra punctuation — just the sentence text.
- Pick whichever category best fits, or "default" if none fit well.`;

  const userPrompt = `Dream title: ${title.trim()}\nDream description: ${(description || '').trim() || '(none provided)'}`;

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

    const category = CATEGORY_KEYS.includes(parsed.category) ? parsed.category : 'default';
    const milestones = Array.isArray(parsed.milestones) ? parsed.milestones.filter((m) => typeof m === 'string' && m.trim()).slice(0, 5) : [];

    if (milestones.length === 0) {
      res.status(502).json({ error: 'Claude returned no usable milestones.' });
      return;
    }

    res.status(200).json({ category, milestones });
  } catch (e) {
    res.status(500).json({ error: 'Unexpected server error', detail: String(e && e.message || e) });
  }
}
