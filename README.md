# AEO Diagnostic

An **Answer Engine Optimization** tool for Amazon sellers. Enter your brand name and a shopper query to see exactly how your brand ranks across three major AI engines — and get a tailored Fix It Brief to improve your visibility.

## What It Does

1. Sends your shopper query simultaneously to **Llama 3**, **Mixtral**, and **Command R+**
2. Detects whether your brand appears in each response and grades it A–F
3. Extracts competitor brands that are being recommended instead
4. Generates a dynamic "Fix It Brief" with specific copy recommendations

## APIs Used

| Engine | Provider | Why |
|--------|----------|-----|
| Llama 3 (llama3-8b-8192) | Groq | Ultra-fast inference, free tier |
| Mixtral (mixtral-8x7b-32768) | Groq | Diverse MoE model for broader signal |
| Command R+ | Cohere | Retrieval-augmented, strong at product recommendations |

All three run in parallel via `Promise.allSettled()` — if one fails, the others still return.

## Getting Free API Keys

- **Groq**: [console.groq.com](https://console.groq.com) — free account, no billing required
- **Cohere**: [dashboard.cohere.com](https://dashboard.cohere.com) — free trial key available instantly

## Local Setup

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd aeo-diagnostic

# 2. Backend
cd backend
cp ../.env.example .env
# Fill in your API keys in .env
npm install
npm run dev   # runs on port 3001

# 3. Frontend (new terminal)
cd frontend
npm install
npm run dev   # runs on port 5173 (proxies /api to port 3001)
```

Open [http://localhost:5173](http://localhost:5173)

## Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Add environment variables in the Vercel dashboard:
- `GROQ_API_KEY`
- `COHERE_API_KEY`

The `vercel.json` at the root handles routing — API calls go to the Node backend, everything else serves the static frontend build.
