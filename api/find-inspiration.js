// Serverless function (Vercel Node runtime): POST /api/find-inspiration
// Uses Claude with the real web_search tool to find real, publicly documented
// people or stories relevant to a specific dream — grounded in actual search
// results, with a source link for each result. This is factual retrieval and
// summarization (like a search engine), not generated dialogue or quotes
// attributed to real people.

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

  const systemPrompt = `You help someone find real, publicly documented people who have achieved a personal goal similar to theirs, for inspiration.

Use the web_search tool to research this before answering. Then respond with ONLY a JSON object (no markdown fences, no other text, no text before or after) in exactly this shape:

{
  "results": [
    { "name": "Full name", "achievement": "One factual sentence on what they did, based on your search results", "source_url": "the exact URL of the page that supports this" }
  ]
}

Rules:
- Only include real, identifiable people with a genuine public source (news article, interview, official bio, etc.) found via search — never invent a person or a URL.
- 2 to 4 results, most relevant and most credibly-sourced first.
- "achievement" must be a plain factual statement, not a quote attributed to them.
- If your search doesn't turn up solid, verifiable matches, return fewer results (even zero) rather than guessing.`;

  const userPrompt = `Dream title: ${title.trim()}\nDream description: ${(description || '').trim() || '(none provided)'}\n\nFind real people who have achieved something closely similar to this.`;

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
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      res.status(502).json({ error: 'Claude API request failed', detail: errText });
      return;
    }

    const data = await response.json();
    // With tool use, content can include server_tool_use / web_search_tool_result
    // blocks before the final text block — take the last text block as the answer.
    const textBlocks = (data.content || []).filter((b) => b.type === 'text');
    const finalText = textBlocks.length ? textBlocks[textBlocks.length - 1].text : null;
    if (!finalText) {
      res.status(502).json({ error: 'No text content returned from Claude.' });
      return;
    }

    let parsed;
    try {
      const cleaned = finalText.trim().replace(/^```json\s*|```$/g, '');
      parsed = JSON.parse(cleaned);
    } catch (e) {
      res.status(502).json({ error: 'Could not parse Claude response as JSON.', raw: finalText });
      return;
    }

    const results = (Array.isArray(parsed.results) ? parsed.results : [])
      .filter((r) => r && typeof r.name === 'string' && typeof r.achievement === 'string' && typeof r.source_url === 'string')
      .slice(0, 4);

    res.status(200).json({ results });
  } catch (e) {
    res.status(500).json({ error: 'Unexpected server error', detail: String(e && e.message || e) });
  }
}
