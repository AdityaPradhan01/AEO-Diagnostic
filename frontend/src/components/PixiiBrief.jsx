import React from 'react';

const SLOTS = [
  { key: 'hero',        icon: '🖼',  label: 'Hero Image',    cls: 'pixii-slot-hero'        },
  { key: 'lifestyle',   icon: '🌿',  label: 'Lifestyle Shot', cls: 'pixii-slot-lifestyle'   },
  { key: 'infographic', icon: '📊',  label: 'Infographic',   cls: 'pixii-slot-infographic'  },
  { key: 'trust',       icon: '🏆',  label: 'Trust Signals', cls: 'pixii-slot-trust'        },
];

export default function PixiiBrief({ brief, loading, error, onGenerate, hasData }) {
  return (
    <div className="pixii-section">
      {hasData && !brief && (
        <button className="pixii-btn" onClick={onGenerate} disabled={loading}>
          <span className="pixii-btn-shimmer" />
          <span className="pixii-btn-content">
            {loading
              ? <><span className="pixii-spinner" />Generating your visual strategy…</>
              : <>✦ Generate Pixii Visual Brief</>}
          </span>
        </button>
      )}

      {error && !brief && (
        <div style={{ marginTop: 12, padding: '12px 16px', background: '#FEF2F2', border: '1px solid rgba(239,68,68,.2)', borderRadius: 10, color: '#991B1B', fontSize: 13 }}>
          ⚠ {error} —{' '}
          <span style={{ cursor: 'pointer', textDecoration: 'underline', fontWeight: 600 }} onClick={onGenerate}>
            try again
          </span>
        </div>
      )}

      {brief && (
        <div className="pixii-card">
          <div className="pixii-card-header">
            <div className="pixii-card-icon">✦</div>
            <div>
              <div className="pixii-card-title">Pixii Visual Brief</div>
              <div className="pixii-card-sub">Your AI-generated Amazon image strategy</div>
            </div>
          </div>

          <div className="pixii-grid">
            {SLOTS.map(({ key, icon, label, cls }) => (
              <div key={key} className={`pixii-slot ${cls}`}>
                <div className="pixii-slot-top">
                  <span className="pixii-slot-icon">{icon}</span>
                  <span className="pixii-slot-label">{label}</span>
                </div>
                <p className="pixii-slot-text">{brief[key] || '—'}</p>
              </div>
            ))}
          </div>

          <a
            className="pixii-cta"
            href="https://pixii.ai"
            target="_blank"
            rel="noopener noreferrer"
          >
            Take this brief directly into Pixii to generate your images →
          </a>
        </div>
      )}
    </div>
  );
}
