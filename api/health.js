module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({
    status:          'ok',
    groq:            !!process.env.GROQ_API_KEY,
    cohere:          !!process.env.COHERE_API_KEY,
    groqKeyPrefix:   process.env.GROQ_API_KEY?.slice(0, 6)   || 'missing',
    cohereKeyPrefix: process.env.COHERE_API_KEY?.slice(0, 6) || 'missing',
  });
};
