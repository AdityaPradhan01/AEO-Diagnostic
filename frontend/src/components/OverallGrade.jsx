import React, { useEffect, useState } from 'react';

const gradeConfig = {
  A:   { color: '#10B981', name: 'Top Pick',          score: 100, summary: 'Your brand dominates AI shopping recommendations. Exceptional AEO visibility.' },
  B:   { color: '#2563EB', name: 'Recommended',       score: 75,  summary: 'Your brand is consistently surfaced. Solid visibility with minor gaps to close.' },
  C:   { color: '#D97706', name: 'Mentioned',         score: 50,  summary: "Your brand appears but isn't leading. Competitors are capturing more intent." },
  D:   { color: '#EA580C', name: 'Barely Mentioned',  score: 25,  summary: 'Your brand barely registers. Content strategy needs urgent attention.' },
  F:   { color: '#EF4444', name: 'Not Recommended',   score: 0,   summary: 'Your brand is invisible to AI engines. Immediate optimization is critical.' },
  'N/A':{ color: '#9D9D95', name: 'Unavailable',      score: 0,   summary: 'Could not reach AI engines. Check your backend is running and keys are valid.' },
};

function useCountUp(target, duration = 900) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (target === 0) { setVal(0); return; }
    const start = performance.now();
    function tick(now) {
      const p = Math.min((now - start) / duration, 1);
      setVal(Math.round(p * target));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [target, duration]);
  return val;
}

export default function OverallGrade({ grade, brand, results }) {
  const cfg = gradeConfig[grade] || gradeConfig['N/A'];
  const count = useCountUp(cfg.score);

  const dotColor = (r) => {
    if (r.grade === 'N/A') return '#D4D4CC';
    return r.found ? (gradeConfig[r.grade]?.color || '#9D9D95') : '#EF4444';
  };

  return (
    <div className="overall-card" style={{ borderLeft: `4px solid ${cfg.color}` }}>
      <div className="overall-grade-letter" style={{ color: cfg.color }}>
        {grade}
      </div>

      <div className="overall-right">
        <div className="overall-label">Overall AEO Score · {brand}</div>
        <div className="overall-grade-name">{cfg.name}</div>
        <p className="overall-summary">{cfg.summary}</p>

        <div className="score-row">
          <div className="score-track">
            <div className="score-fill" style={{ width: `${cfg.score}%`, background: cfg.color }} />
          </div>
          <div className="score-num" style={{ color: cfg.color }}>{count} / 100</div>
        </div>

        {results && (
          <div className="overall-engine-dots">
            {results.map((r) => (
              <div key={r.engine} className="engine-dot">
                <span className="engine-dot-indicator" style={{ background: dotColor(r) }} />
                {r.engine}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
