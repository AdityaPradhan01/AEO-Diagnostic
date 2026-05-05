const fetch = require('node-fetch');

// ── Helpers ──────────────────────────────────────────────────────
function fetchWithTimeout(url, opts = {}, ms = 20000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...opts, signal: controller.signal }).finally(() => clearTimeout(timer));
}

function safeParseJson(raw) {
  const stripped = raw.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
  return JSON.parse(stripped);
}

const SHOPPING_PROMPT = (query) =>
  `You are a helpful shopping assistant. A customer asks: '${query}'. Recommend the top 5 products with specific brand names and reasons why. Be specific with brand names.`;

function gradeResponse(brand, text) {
  if (!text) return { grade: 'N/A', label: 'Unavailable', found: false, score: -1 };
  const lower      = text.toLowerCase();
  const brandLower = brand.toLowerCase();
  const paragraphs = text.split(/\n+/).filter(Boolean);
  const firstTwo   = paragraphs.slice(0, 2).join(' ').toLowerCase();
  const mentionCount = (lower.match(new RegExp(brandLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;

  if (!lower.includes(brandLower))   return { grade: 'F', label: 'Not Recommended', found: false, score: 0 };
  if (firstTwo.includes(brandLower)) return { grade: 'A', label: 'Top Pick',         found: true,  score: 4 };
  if (mentionCount >= 2)             return { grade: 'B', label: 'Recommended',      found: true,  score: 3 };

  const position = lower.indexOf(brandLower) / lower.length;
  return position < 0.4
    ? { grade: 'C', label: 'Mentioned',        found: true, score: 2 }
    : { grade: 'D', label: 'Barely Mentioned', found: true, score: 1 };
}

async function extractBrandsWithGroq(userBrand, texts) {
  const combined = texts.filter(Boolean).join('\n\n').slice(0, 3500);
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
              content:
                'You identify real consumer brand names from shopping text. ' +
                'Return ONLY valid JSON: {"brands":["Brand1","Brand2",...]}. ' +
                'Include ONLY real companies (e.g. Nike, ASICS, Thorne). ' +
                'NEVER include: product technologies, model numbers, adjectives, country names, or common English words.',
            },
            { role: 'user', content: `Find all real brand names in this text. Exclude "${userBrand}":\n\n${combined}` },
          ],
          max_tokens: 200,
          response_format: { type: 'json_object' },
        }),
      },
      8000
    );
    if (!r.ok) return [];
    const d      = await r.json();
    const parsed = safeParseJson(d.choices[0].message.content);
    const raw    = parsed.brands || parsed.competitors || parsed.brand_names || [];
    return Array.isArray(raw)
      ? raw.filter((b) => typeof b === 'string' && b.toLowerCase() !== userBrand.toLowerCase()).slice(0, 6)
      : [];
  } catch {
    return [];
  }
}

async function queryGroq(model, query) {
  const res = await fetchWithTimeout(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: SHOPPING_PROMPT(query) }],
        max_tokens: 600,
      }),
    },
    10000
  );
  if (!res.ok) { const body = await res.text(); throw new Error(`Groq ${model} error ${res.status}: ${body}`); }
  const data = await res.json();
  return data.choices[0].message.content;
}

async function queryCohere(query) {
  const res = await fetchWithTimeout(
    'https://api.cohere.com/v2/chat',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.COHERE_API_KEY}` },
      body: JSON.stringify({
        model: 'command-r-plus-08-2024',
        messages: [{ role: 'user', content: SHOPPING_PROMPT(query) }],
        max_tokens: 600,
      }),
    },
    25000
  );
  if (!res.ok) { const body = await res.text(); throw new Error(`Cohere error ${res.status}: ${body}`); }
  const data = await res.json();
  return data.message?.content?.[0]?.text || data.text || '';
}

// ── Handler ───────────────────────────────────────────────────────
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { brand, query } = req.body || {};
  if (!brand || !query) return res.status(400).json({ error: 'brand and query are required' });

  const engines = [
    { name: 'Llama 3.3', fn: () => queryGroq('llama-3.3-70b-versatile', query) },
    { name: 'Llama 3.1', fn: () => queryGroq('llama-3.1-8b-instant',   query) },
    { name: 'Command R+', fn: () => queryCohere(query) },
  ];

  const settled = await Promise.allSettled(engines.map((e) => e.fn()));

  const results = settled.map((result, i) => {
    const engine = engines[i].name;
    if (result.status === 'rejected') {
      console.error(`${engine} failed:`, result.reason?.message);
      return { engine, grade: 'N/A', label: 'Unavailable', found: false, competitors: [], rawText: null, error: result.reason?.message };
    }
    const rawText = result.value;
    const { grade, label, found } = gradeResponse(brand, rawText);
    return { engine, grade, label, found, competitors: [], rawText };
  });

  const successfulTexts = results.filter((r) => r.rawText).map((r) => r.rawText);
  const competitorBrands = successfulTexts.length > 0
    ? await extractBrandsWithGroq(brand, successfulTexts)
    : [];

  results.forEach((r) => { r.competitors = competitorBrands; });

  const scoreMap  = { A: 4, B: 3, C: 2, D: 1, F: 0 };
  const letterMap = { 4: 'A', 3: 'B', 2: 'C', 1: 'D', 0: 'F' };
  const valid = results.filter((r) => r.grade !== 'N/A');
  let overallGrade = 'N/A';
  if (valid.length > 0) {
    const avg = valid.reduce((sum, r) => sum + (scoreMap[r.grade] ?? 0), 0) / valid.length;
    overallGrade = letterMap[Math.round(avg)];
  }

  res.json({ results, overallGrade });
};
