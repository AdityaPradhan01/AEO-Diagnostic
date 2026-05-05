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

  const { brand, query } = req.body || {};
  if (!brand || !query) return res.json({ competitors: [], userPhrases: [] });

  const prompt = `You are an Amazon market expert with deep knowledge of product categories.

The brand "${brand}" sells products targeting this shopper query: "${query}".

Using your knowledge of Amazon, identify the 2 most well-known REAL competing brands in this exact product category. Do not guess — only use brands you are confident are real companies that sell similar products.

Then:
- For each competitor brand: write 4 specific marketing phrases that brand is known for using on Amazon listings
- For "${brand}": write 4 realistic marketing phrases they likely use for "${query}"

Return ONLY valid JSON, no markdown, no explanation:
{
  "competitors": [
    { "name": "ActualBrand1", "phrases": ["phrase1", "phrase2", "phrase3", "phrase4"] },
    { "name": "ActualBrand2", "phrases": ["phrase1", "phrase2", "phrase3", "phrase4"] }
  ],
  "userPhrases": ["phrase1", "phrase2", "phrase3", "phrase4"]
}`;

  try {
    const r = await fetchWithTimeout(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content: 'You are a JSON-only responder. Return a single valid JSON object with no extra text, no markdown, no code fences.',
            },
            { role: 'user', content: prompt },
          ],
          max_tokens: 800,
          response_format: { type: 'json_object' },
        }),
      },
      20000
    );

    if (!r.ok) { const t = await r.text(); throw new Error(`Groq ${r.status}: ${t}`); }

    const d       = await r.json();
    const content = d.choices[0].message.content.trim();
    const parsed  = safeParseJson(content);

    const competitors  = Array.isArray(parsed.competitors)  ? parsed.competitors  : [];
    const userPhrases  = Array.isArray(parsed.userPhrases)  ? parsed.userPhrases  : [];

    res.json({ competitors, userPhrases });
  } catch (err) {
    console.error('Competitor intelligence failed:', err.message);
    res.json({ competitors: [], userPhrases: [] });
  }
};
