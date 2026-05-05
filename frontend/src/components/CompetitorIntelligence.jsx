import React from 'react';

/* Loading skeleton */
function LoadingSkeleton() {
  return (
    <div className="ci-card">
      <div className="ci-header">
        <div className="ci-icon-wrap ci-icon-amber">🔍</div>
        <div>
          <div className="ci-title ci-title-amber">Competitor Intelligence</div>
          <div className="ci-subtitle">Asking Groq to analyse your competitors…</div>
        </div>
      </div>
      <div className="ci-grid">
        {[1, 2].map((i) => (
          <div key={i} className="ci-competitor-block">
            <div className="shimmer-block" style={{ height: 12, width: '45%', marginBottom: 14, borderRadius: 6 }} />
            <div className="shimmer-block" style={{ height: 16, width: '65%', marginBottom: 16, borderRadius: 6 }} />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="shimmer-block" style={{ height: 28, width: 100, borderRadius: 6 }} />
              ))}
            </div>
          </div>
        ))}
        <div className="ci-user-block ci-user-block-loading">
          <div className="shimmer-block" style={{ height: 12, width: '55%', marginBottom: 14, borderRadius: 6 }} />
          <div className="shimmer-block" style={{ height: 16, width: '50%', marginBottom: 16, borderRadius: 6 }} />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="shimmer-block" style={{ height: 28, width: 100, borderRadius: 6 }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CompetitorIntelligence({ data, userPhrases, loading, brand }) {
  if (loading) return <LoadingSkeleton />;
  if (!data || data.length === 0) return null;

  return (
    <div className="ci-card">
      <div className="ci-header">
        <div className="ci-icon-wrap ci-icon-amber">🔍</div>
        <div>
          <div className="ci-title ci-title-amber">Competitor Intelligence</div>
          <div className="ci-subtitle">AI-generated phrase gap analysis — no scraping required</div>
        </div>
      </div>

      <div className="ci-grid">
        {/* ── Left: competitor blocks ── */}
        {data.map(({ name, phrases }) => (
          <div key={name} className="ci-competitor-block">
            <div className="ci-comp-label ci-label-amber">PHRASES THEY USE THAT YOU DON'T</div>
            <div className="ci-comp-name">{name}</div>
            <div className="ci-phrases">
              {phrases.map((phrase, i) => (
                <span key={i} className="ci-phrase-pill ci-pill-amber">{phrase}</span>
              ))}
            </div>
          </div>
        ))}

        {/* ── Right: user phrases ── */}
        {userPhrases && userPhrases.length > 0 && (
          <div className="ci-user-block">
            <div className="ci-comp-label ci-label-emerald">PHRASES I ALREADY USE</div>
            <div className="ci-comp-name">{brand}</div>
            <div className="ci-phrases">
              {userPhrases.map((phrase, i) => (
                <span key={i} className="ci-phrase-pill ci-pill-emerald">{phrase}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
