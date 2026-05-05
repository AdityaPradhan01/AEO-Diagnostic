import React from 'react';

const gradeConfig = {
  A:   { color: '#10B981', score: 100, label: 'Top Pick'         },
  B:   { color: '#2563EB', score: 75,  label: 'Recommended'      },
  C:   { color: '#D97706', score: 50,  label: 'Mentioned'        },
  D:   { color: '#EA580C', score: 25,  label: 'Barely Mentioned' },
  F:   { color: '#EF4444', score: 0,   label: 'Not Recommended'  },
  'N/A':{ color: '#9D9D95', score: 0,  label: 'Unavailable'      },
};

const providerMap = {
  'Llama 3.3': 'Groq',
  'Llama 3.1': 'Groq',
  'Command R+': 'Cohere',
};

export default function EngineCard({ engine, grade, found, competitors, error }) {
  const cfg = gradeConfig[grade] || gradeConfig['N/A'];
  const badgeClass = grade === 'N/A' ? 'none' : found ? 'yes' : 'no';
  const badgeText  = grade === 'N/A' ? 'Unavailable' : found ? '✓ Found' : '✗ Missing';

  return (
    <div className="engine-card">
      <div className="engine-card-header">
        <div>
          <div className="engine-card-name">{engine}</div>
          <div className="engine-card-provider">{providerMap[engine] || ''}</div>
        </div>
        <span className={`found-pill ${badgeClass}`}>{badgeText}</span>
      </div>

      <div className="engine-grade-num" style={{ color: cfg.color }}>{grade}</div>
      <div className="engine-grade-label">{cfg.label}</div>

      <div className="score-bar-wrap">
        <div className="score-bar-track">
          <div className="score-bar-fill" style={{ width: `${cfg.score}%`, background: cfg.color }} />
        </div>
      </div>

      {error && <div className="engine-error">{error}</div>}

      {competitors && competitors.length > 0 && (
        <div className="comp-section">
          <div className="comp-label">Also Mentioned</div>
          <div className="comp-tags">
            {competitors.map((c) => <span key={c} className="comp-tag">{c}</span>)}
          </div>
        </div>
      )}
    </div>
  );
}
