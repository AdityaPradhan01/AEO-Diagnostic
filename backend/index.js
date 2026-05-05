require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors    = require('cors');
const fetch   = require('node-fetch');

const app  = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

/* ─── Shared helpers ───────────────────────────────────────── */

function fetchWithTimeout(url, opts = {}, ms = 20000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...opts, signal: controller.signal }).finally(() => clearTimeout(timer));
}

/** Strip markdown fences then JSON.parse — throws on failure */
function safeParseJson(raw) {
  const stripped = raw.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
  return JSON.parse(stripped);
}

/* ─── Prompts ──────────────────────────────────────────────── */

const SHOPPING_PROMPT = (query) =>
  `You are a helpful shopping assistant. A customer asks: '${query}'. Recommend the top 5 products with specific brand names and reasons why. Be specific with brand names.`;

/* ─── Grading & extraction ─────────────────────────────────── */

function gradeResponse(brand, text) {
  if (!text) return { grade: 'N/A', label: 'Unavailable', found: false, score: -1 };

  const lower     = text.toLowerCase();
  const brandLower = brand.toLowerCase();
  const paragraphs = text.split(/\n+/).filter(Boolean);
  const firstTwo   = paragraphs.slice(0, 2).join(' ').toLowerCase();
  const mentionCount = (lower.match(new RegExp(brandLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;

  if (!lower.includes(brandLower))       return { grade: 'F', label: 'Not Recommended', found: false, score: 0 };
  if (firstTwo.includes(brandLower))     return { grade: 'A', label: 'Top Pick',         found: true,  score: 4 };
  if (mentionCount >= 2)                  return { grade: 'B', label: 'Recommended',      found: true,  score: 3 };

  const position = lower.indexOf(brandLower) / lower.length;
  return position < 0.4
    ? { grade: 'C', label: 'Mentioned',       found: true, score: 2 }
    : { grade: 'D', label: 'Barely Mentioned', found: true, score: 1 };
}

/* Replaced by extractBrandsWithGroq below — kept stub for safety */
function extractCompetitors(brand, text) {
  return []; // no longer used — Groq extraction handles this
}

/**
 * Ask Groq to identify REAL brand names from the engine response texts.
 * This replaces the broken regex approach permanently.
 */
async function extractBrandsWithGroq(userBrand, texts) {
  const combined = texts
    .filter(Boolean)
    .join('\n\n')
    .slice(0, 3500); // keep prompt short for speed

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
                'Include ONLY real companies (e.g. Nike, ASICS, Brooks, Thorne). ' +
                'NEVER include: product technologies (Zoom Air, React, Boost), ' +
                'model numbers, adjectives, country names, or common English words.',
            },
            {
              role: 'user',
              content: `Find all real brand names in this text. Exclude "${userBrand}":\n\n${combined}`,
            },
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
      ? raw
          .filter((b) => typeof b === 'string' && b.toLowerCase() !== userBrand.toLowerCase())
          .slice(0, 6)
      : [];
  } catch (err) {
    console.warn('Brand extraction failed, skipping:', err.message);
    return [];
  }
}

function _extractCompetitors_UNUSED(brand, text) {
  if (!text) return [];
  const brandLower = brand.toLowerCase();

  // Words that are NEVER real brand names
  const skipWords = new Set([
    // Articles / conjunctions / prepositions
    'The','This','That','These','Those','Here','There','When','With','For','And','But',
    'Not','You','Your','Our','Their','They','Have','Has','Had','Will','Can','May','Are',
    'Was','Were','Been','Being','Also','Some','Many','Most','More','Very','Just','Only',
    'Even','Each','Both','From','Into','Over','Under','About','After','Before','While',
    // Generic adjectives / marketing words
    'Best','Good','Great','High','Top','New','Old','Free','Low','Fast','Easy','Safe',
    'Pure','Clean','Fresh','Light','Long','Short','Wide','Full','Half','Real','True',
    'Natural','Organic','Premium','Professional','Advanced','Optimized','Enhanced',
    'Certified','Clinically','Scientifically','Specially','Uniquely','Perfectly',
    // Health / supplement / product category words
    'Vitamin','Vitamins','Mineral','Minerals','Magnesium','Calcium','Zinc','Iron',
    'Omega','Protein','Collagen','Probiotics','Probiotic','Supplement','Supplements',
    'Formula','Capsule','Capsules','Tablet','Tablets','Softgel','Softgels','Powder',
    'Liquid','Gummy','Gummies','Drops','Spray','Cream','Gel','Serum','Extract',
    // Shoe / apparel / generic product words
    'Shoe','Shoes','Sneaker','Sneakers','Running','Training','Walking','Athletic',
    'Cushion','Cushioning','Support','Stability','Motion','Control','Neutral','Foam',
    'Mesh','Upper','Outsole','Midsole','Insole','Heel','Arch','Toe','Sole',
    'Air','Zoom','React','Boost','Fresh','Cloud','Wave','Gel','Flex','Free',
    // Generic product / review words
    'Product','Products','Brand','Brands','Option','Options','Choice','Choices',
    'Pick','Picks','Recommendation','Recommendations','Rating','Ratings',
    'Review','Reviews','Feature','Features','Benefit','Benefits','Result','Results',
    'Quality','Potency','Purity','Strength','Dose','Dosage','Amount','Level','Levels',
    'Technology','System','Performance','Design','Style','Model','Version','Series',
    // Common sentence-starters that are capitalized
    'Here','Based','Overall','However','Additionally','Furthermore','Moreover',
    'Finally','First','Second','Third','Fourth','Fifth','Last','Next','Another',
    'Consider','Look','Try','Check','Use','Get','Buy','Shop','Find',
    // Numbers / sizes / units
    'Size','Sizes','Weight','Pound','Pounds','Ounce','Ounces','Gram','Grams',
    'Milligram','Milligrams','Count','Pack','Box','Bottle','Bottles','Bag','Container',
  ]);

  // Count how many times each single capitalized word appears
  const freq = {};
  const singleWord = /\b([A-Z][a-z]{2,})\b/g;
  let m;
  while ((m = singleWord.exec(text)) !== null) {
    const w = m[1];
    freq[w] = (freq[w] || 0) + 1;
  }

  // A word qualifies as a brand candidate if:
  // 1. It appears ≥ 2 times (mentioned repeatedly = likely a brand being discussed), OR
  // 2. It appears exactly once but directly follows "by", "from", "brand" (strong brand signal)
  const brandContextPattern = /(?:by|from|brand|company|maker|manufacturer)\s+([A-Z][a-z]{2,})/gi;
  const contextMentioned = new Set();
  while ((m = brandContextPattern.exec(text)) !== null) {
    contextMentioned.add(m[1]);
  }

  const candidates = Object.entries(freq)
    .filter(([word, count]) => {
      if (word.toLowerCase().includes(brandLower)) return false;
      if (skipWords.has(word)) return false;
      if (word.length < 3 || word.length > 30) return false;
      if (/^\d/.test(word)) return false;
      return count >= 2 || contextMentioned.has(word);
    })
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([word]) => word);

  return candidates;
} // end _extractCompetitors_UNUSED

/* ─── AI engine wrappers ───────────────────────────────────── */

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
    25000  // Cohere is slower — give it 25 s before aborting
  );
  if (!res.ok) { const body = await res.text(); throw new Error(`Cohere error ${res.status}: ${body}`); }
  const data = await res.json();
  return data.message?.content?.[0]?.text || data.text || '';
}

/* ─── Routes ───────────────────────────────────────────────── */

app.get('/api/health', (req, res) => {
  res.json({
    groq:            !!process.env.GROQ_API_KEY,
    cohere:          !!process.env.COHERE_API_KEY,
    groqKeyPrefix:   process.env.GROQ_API_KEY?.slice(0, 6)   || 'missing',
    cohereKeyPrefix: process.env.COHERE_API_KEY?.slice(0, 6) || 'missing',
  });
});

/* POST /api/diagnose */
app.post('/api/diagnose', async (req, res) => {
  const { brand, query } = req.body;
  if (!brand || !query) return res.status(400).json({ error: 'brand and query are required' });

  const engines = [
    { name: 'Llama 3.3', fn: () => queryGroq('llama-3.3-70b-versatile', query) },
    { name: 'Llama 3.1', fn: () => queryGroq('llama-3.1-8b-instant',   query) },
    { name: 'Command R+', fn: () => queryCohere(query) },
  ];

  const settled = await Promise.allSettled(engines.map((e) => e.fn()));

  // Grade each engine response (no regex competitor extraction)
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

  // Extract real brand names once, using Groq, from all successful response texts
  const successfulTexts = results.filter((r) => r.rawText).map((r) => r.rawText);
  const competitorBrands = successfulTexts.length > 0
    ? await extractBrandsWithGroq(brand, successfulTexts)
    : [];

  // Share the verified brand list across all engine results
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
});

/* POST /api/competitors — Groq picks competitors directly from brand+query knowledge */
app.post('/api/competitors', async (req, res) => {
  const { brand, query } = req.body;

  if (!brand || !query) {
    return res.json({ competitors: [], userPhrases: [] });
  }

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

    let parsed;
    try {
      parsed = safeParseJson(content);
    } catch (parseErr) {
      console.error('Competitor JSON parse failed:', parseErr.message, '\nRaw:', content);
      return res.json({ competitors: [], userPhrases: [] });
    }

    const comps      = Array.isArray(parsed.competitors)  ? parsed.competitors  : [];
    const userPhrases = Array.isArray(parsed.userPhrases) ? parsed.userPhrases  : [];

    res.json({ competitors: comps, userPhrases });
  } catch (err) {
    console.error('Competitor intelligence failed:', err.message);
    res.json({ competitors: [], userPhrases: [] });
  }
});

/* POST /api/pixii-brief */
app.post('/api/pixii-brief', async (req, res) => {
  const { brand, query, overallGrade, competitors = [], competitorPhrases = [], fixItPoints = [] } = req.body;
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
            { role: 'system', content: 'You are a JSON-only responder. Always return a single valid JSON object with no extra text, no markdown, no code fences.' },
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

    let parsed;
    try {
      parsed = safeParseJson(content);
    } catch (parseErr) {
      throw new Error('AI returned invalid JSON: ' + parseErr.message);
    }

    if (!parsed.hero && !parsed.lifestyle && !parsed.infographic && !parsed.trust) {
      throw new Error('AI returned an unexpected response format');
    }

    res.json(parsed);
  } catch (err) {
    console.error('Pixii brief failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`AEO Diagnostic backend running on port ${PORT}`));
