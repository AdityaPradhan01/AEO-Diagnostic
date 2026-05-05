import React from 'react';

const MOCK_ENGINES = [
  { name: 'Llama 3.3', grade: 'A', color: '#10B981', score: 100 },
  { name: 'Llama 3.1', grade: 'C', color: '#F59E0B', score: 50  },
  { name: 'Command R+', grade: 'F', color: '#EF4444', score: 0  },
];

export default function LandingPage({ onGetStarted }) {
  return (
    <>
      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-badge">⚡ AI Search Visibility for Amazon Sellers</div>

        <h1>Does AI recommend<br />your product — or<br />your competitor's?</h1>

        <p className="hero-sub">
          Find out in 30 seconds. AEO Diagnostic queries Llama and Command R+ simultaneously and shows you exactly where you rank.
        </p>

        <div className="hero-buttons">
          <button className="btn-primary" onClick={onGetStarted}>
            Get Started Free →
          </button>
          <a href="#how-it-works" className="btn-ghost">See how it works</a>
        </div>

        <p className="hero-social-proof">✦ Free to start · Sign up in seconds · Results in 30 seconds</p>
      </section>

      {/* ── How It Works ── */}
      <section className="how-section" id="how-it-works">
        <div className="how-inner">
          <p className="section-eyebrow">How it works</p>
          <h2 className="section-h2">Three steps to your AI report card</h2>

          <div className="how-grid">
            <div className="how-step">
              <div className="how-step-num">01</div>
              <span className="how-step-icon">🏷</span>
              <div className="how-step-title">Create your account</div>
              <p className="how-step-desc">Sign up in seconds — no credit card needed. Then enter your brand name and the shopper query you want to rank for.</p>
            </div>
            <div className="how-step">
              <div className="how-step-num">02</div>
              <span className="how-step-icon">🤖</span>
              <div className="how-step-title">We query 3 AI engines</div>
              <p className="how-step-desc">Llama 3.3, Llama 3.1, and Command R+ all run simultaneously. No waiting in line.</p>
            </div>
            <div className="how-step">
              <div className="how-step-num">03</div>
              <span className="how-step-icon">📊</span>
              <div className="how-step-title">Get your report card</div>
              <p className="how-step-desc">See your grade per engine, which competitors are winning, and a specific brief to fix your listing copy.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why It Matters ── */}
      <section className="why-section">
        <div className="why-left">
          <p className="section-eyebrow">Why it matters</p>
          <h2 className="section-h2" style={{ marginBottom: 8 }}>AI search is replacing Google.<br />Is your brand ready?</h2>
          <p className="why-insight">
            AI search is the new front door for product discovery. If AI doesn't recommend you, that shopper is gone.
          </p>
        </div>

        <div className="why-right">
          <div className="mock-card">
            <div className="mock-card-title">Sample AEO Report Card</div>
            <div className="mock-rows">
              {MOCK_ENGINES.map(({ name, grade, color, score }) => (
                <div key={name} className="mock-row">
                  <span className="mock-engine">{name}</span>
                  <div className="mock-bar-wrap">
                    <div className="mock-bar-track">
                      <div className="mock-bar-fill" style={{ width: `${score}%`, background: color }} />
                    </div>
                  </div>
                  <span className="mock-grade" style={{ color }}>{grade}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section">
        <h2 className="cta-title">Find out where you rank<br />in 30 seconds</h2>
        <button className="btn-white" onClick={onGetStarted}>Create Free Account</button>
      </section>
    </>
  );
}
