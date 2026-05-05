import React from 'react';

export default function InputSection({ brand, query, onBrandChange, onQueryChange, onSubmit, loading }) {
  function handleKey(e) {
    if (e.key === 'Enter' && !loading) onSubmit();
  }

  return (
    <div className="input-card">
      <div className="input-row">
        <div className="input-group">
          <label className="input-label">🏷 Your Brand / Product</label>
          <input
            className="input-field"
            type="text"
            placeholder="e.g. NatureMade Magnesium"
            value={brand}
            onChange={(e) => onBrandChange(e.target.value)}
            onKeyDown={handleKey}
          />
          <p className="input-hint">Enter your specific brand name, not a category word</p>
        </div>

        <div className="input-group">
          <label className="input-label">🔍 Shopper Query</label>
          <input
            className="input-field"
            type="text"
            placeholder="e.g. best magnesium supplement for seniors"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={handleKey}
          />
        </div>

        <button
          className="run-btn"
          onClick={onSubmit}
          disabled={loading || !brand.trim() || !query.trim()}
        >
          {loading ? 'Running…' : 'Run Diagnostic'}
          {!loading && <span className="btn-arrow">→</span>}
        </button>
      </div>
    </div>
  );
}
