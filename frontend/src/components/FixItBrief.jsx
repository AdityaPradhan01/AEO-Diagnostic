import React from 'react';

function buildBullets(brand, results) {
  const allComps = new Set();
  results.forEach((r) => r.competitors?.forEach((c) => allComps.add(c)));
  const compList = [...allComps].slice(0, 4);
  const missing  = results.filter((r) => !r.found && r.grade !== 'N/A');
  const winning  = results.filter((r) => r.grade === 'A' || r.grade === 'B');
  const bullets  = [];

  if (compList.length > 0) {
    bullets.push({
      key: 'comp',
      headline: `Reverse-engineer ${compList.slice(0, 3).join(', ')}`,
      body: `These brands are winning your target queries. Audit their listings and A+ content to find the exact language AI engines are treating as authority signals.`,
    });
  }

  if (missing.length > 0) {
    const names = missing.map((e) => e.engine).join(' and ');
    bullets.push({
      key: 'visibility',
      headline: 'Lead every sentence with your brand name',
      body: `${names} ${missing.length === 1 ? 'is' : 'are'} not surfacing ${brand} at all. Place your brand in the product title, opening bullet, and backend search terms.`,
    });
  }

  bullets.push({
    key: 'copy',
    headline: 'Rewrite bullets with recommendation-intent language',
    body: `Phrases like "trusted by," "recommended for," and "clinically formulated for [use case]" mirror how AI engines phrase their top picks.`,
  });

  bullets.push({
    key: 'reviews',
    headline: 'Seed reviews that mention the specific use case',
    body: `AI engines pull social proof that ties a product to query intent. Ask customers to include the specific benefit in their review text.`,
  });

  if (winning.length > 0 && winning.length < 3) {
    const names = winning.map((e) => e.engine).join(' and ');
    bullets.push({
      key: 'leverage',
      headline: `Scale what's working on ${names}`,
      body: `Extract the exact phrasing from the engine where ${brand} ranked well and mirror that language across all your listings and brand store copy.`,
    });
  }

  return bullets.slice(0, 4);
}

export default function FixItBrief({ brand, results }) {
  const bullets = buildBullets(brand, results);

  return (
    <div className="fix-card">
      <div className="fix-header">
        <div className="fix-icon-wrap">✦</div>
        <div className="fix-title">Fix It Brief</div>
      </div>
      <p className="fix-subtitle">
        Specific actions to improve <strong>{brand}</strong>'s AI search visibility
      </p>
      <ul className="fix-list">
        {bullets.map((b, i) => (
          <li key={b.key} className="fix-item">
            <div className="fix-num">{i + 1}</div>
            <span className="fix-text"><b>{b.headline} — </b>{b.body}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
