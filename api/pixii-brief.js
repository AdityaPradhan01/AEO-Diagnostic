const fetch = require('node-fetch');

function fetchWithTimeout(url, opts = {}, ms = 20000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...opts, signal: controller.signal }).finally(() => clearTimeout(timer));
}

function safeParseJson(raw) {
  const stripped = raw.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
  return JSON.parse(stripped);
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { brand, query, overallGrade, competitors = [], competitorPhrases = [], fixItPoints = [] } = req.body || {};
  if (!brand || !query) return res.status(400).json({ error: 'brand and query required' });

  const prompt = `You are an Amazon listing visual strategist. A brand called "${brand}" sells "${query}" and currently has an AEO grade of "${overallGrade}" — meaning AI engines barely recommend them. Their top competitors are ${competitors.join(', ')} who rank higher using phrases like: ${competitorPhrases.join(', ')}. Key gaps identified: ${fixItPoints.join('; ')}.

Generate a specific, actionable visual content brief for their Amazon listing images. Be extremely specific about scenes, props, text overlays, and claims.

Return ONLY valid JSON with exactly these four keys:
{
  "hero": "Detailed hero image description...",
  "lifestyle": "Detailed lifestyle shot description with specific scene, setting, person...",
  "infographic": "Exactly what claims, stats, and callouts to show on the infographic slide...",
  "trust": "Specific badges, certifications, and trust signals to feature..."
}`;

  try {
    const r = await fetchWithTimeout(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: 'You are a JSON-only responder. Always return a single valid JSON object with no extra text, no markdown, no code fences.',
            },
            { role: 'user', content: prompt },
          ],
          max_tokens: 900,
          response_format: { type: 'json_object' },
        }),
      },
      20000
    );

    if (!r.ok) { const t = await r.text(); throw new Error(`Groq ${r.status}: ${t}`); }

    const d       = await r.json();
    const content = d.choices[0].message.content.trim();
    const parsed  = safeParseJson(content);

    if (!parsed.hero && !parsed.lifestyle && !parsed.infographic && !parsed.trust) {
      throw new Error('AI returned an unexpected response format');
    }

    res.json(parsed);
  } catch (err) {
    console.error('Pixii brief failed:', err.message);
    res.status(500).json({ error: err.message });
  }
};
