import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';
import Footer from './components/Footer';
import InputSection from './components/InputSection';
import EngineCard from './components/EngineCard';
import OverallGrade from './components/OverallGrade';
import FixItBrief from './components/FixItBrief';
import CompetitorIntelligence from './components/CompetitorIntelligence';
import PixiiBrief from './components/PixiiBrief';

/* ── helpers ───────────────────────────────── */
function buildFixPoints(brand, results) {
  const pts = [];
  const missing = results.filter((r) => !r.found && r.grade !== 'N/A');
  if (missing.length) pts.push(`${brand} not mentioned by ${missing.map((r) => r.engine).join(', ')}`);
  pts.push('Low brand visibility in AI shopping recommendations');
  pts.push('Missing recommendation-intent language in listing copy');
  pts.push('Insufficient trust signals and social proof');
  return pts;
}

/* ── App ───────────────────────────────────── */
export default function App() {
  /* View routing: 'landing' | 'auth' | 'app' — persisted so refresh keeps you on same page */
  const [view,     setView]     = useState(() => sessionStorage.getItem('aeo-view') || 'landing');
  const [authMode, setAuthMode] = useState('signin');

  /* Light mode only — set once on mount */
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  }, []);

  /* User identity — persisted so refresh keeps the name */
  const [userName, setUserName] = useState(() => sessionStorage.getItem('aeo-user') || '');

  /* Diagnostic state */
  const [brand, setBrand]               = useState('');
  const [query, setQuery]               = useState('');
  const [loading, setLoading]           = useState(false);
  const [results, setResults]           = useState(null);
  const [overallGrade, setOverallGrade] = useState(null);
  const [error, setError]               = useState(null);
  const [scanDate, setScanDate]         = useState(null);

  const [compData, setCompData]           = useState(null);
  const [userPhrases, setUserPhrases]     = useState([]);
  const [compLoading, setCompLoading]     = useState(false);

  const [pixiiBrief, setPixiiBrief]     = useState(null);
  const [pixiiLoading, setPixiiLoading] = useState(false);
  const [pixiiError, setPixiiError]     = useState(null);

  function resetDiagnostic() {
    setBrand(''); setQuery('');
    setLoading(false); setResults(null);
    setOverallGrade(null); setError(null); setScanDate(null);
    setCompData(null); setUserPhrases([]); setCompLoading(false);
    setPixiiBrief(null); setPixiiLoading(false); setPixiiError(null);
  }

  async function runDiagnostic() {
    if (!brand.trim() || !query.trim()) return;
    setLoading(true);
    setResults(null); setOverallGrade(null); setError(null);
    setCompData(null); setPixiiBrief(null); setPixiiError(null);

    try {
      const res = await fetch('/api/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand: brand.trim(), query: query.trim() }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setResults(data.results);
      setOverallGrade(data.overallGrade);
      setScanDate(new Date());
      // Always fetch competitor intelligence using brand+query — no longer depends on extracted names
      fetchCompetitorIntelligence(brand.trim(), query.trim());
    } catch (err) {
      setError(err.message || 'Something went wrong. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }

  async function fetchCompetitorIntelligence(b, q) {
    setCompLoading(true);
    try {
      const res = await fetch('/api/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand: b, query: q }), // Groq picks competitors itself
      });
      if (!res.ok) throw new Error('Competitor fetch failed');
      const data = await res.json();
      if (data.competitors?.length > 0) setCompData(data.competitors);
      if (data.userPhrases?.length > 0)  setUserPhrases(data.userPhrases);
    } catch { /* silent */ } finally {
      setCompLoading(false);
    }
  }

  async function generatePixiiBrief() {
    setPixiiLoading(true);
    setPixiiError(null);
    const allComps   = [...new Set(results.flatMap((r) => r.competitors || []))];
    const allPhrases = compData ? compData.flatMap((c) => c.phrases) : [];

    try {
      const res = await fetch('/api/pixii-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand, query, overallGrade,
          competitors: allComps.slice(0, 4),
          competitorPhrases: allPhrases.slice(0, 6),
          fixItPoints: buildFixPoints(brand, results),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);
      if (!data.hero && !data.lifestyle && !data.infographic && !data.trust)
        throw new Error('AI returned an unexpected response format');
      setPixiiBrief(data);
    } catch (err) {
      setPixiiError(err.message);
    } finally {
      setPixiiLoading(false);
    }
  }

  /* ── Navigation ── */
  function goToSignIn()       { setAuthMode('signin'); setView('auth'); sessionStorage.setItem('aeo-view', 'auth'); }
  function goToSignUp()       { setAuthMode('signup'); setView('auth'); sessionStorage.setItem('aeo-view', 'auth'); }
  function goToLanding()      { setView('landing'); sessionStorage.removeItem('aeo-view'); }
  function goToDashboard()    { setView('dashboard'); sessionStorage.setItem('aeo-view', 'dashboard'); }
  function goToApp(name = '') {
    setUserName(name);
    setView('app');
    sessionStorage.setItem('aeo-view', 'app');
    sessionStorage.setItem('aeo-user', name);
  }
  function handleSignOut() {
    sessionStorage.removeItem('aeo-view');
    sessionStorage.removeItem('aeo-user');
    resetDiagnostic();
    goToLanding();
  }

  /* ── LANDING view ── */
  if (view === 'landing') {
    return (
      <>
        <Navbar
          view="landing"
          onSignIn={goToSignIn}
          onGetStarted={goToSignUp}
        />
        <main>
          <LandingPage onGetStarted={goToSignUp} />
        </main>
        <Footer />
      </>
    );
  }

  /* ── AUTH view ── */
  if (view === 'auth') {
    return (
      <AuthPage
        mode={authMode}
        onBack={goToLanding}
        onSuccess={goToApp}
        onToggle={() => setAuthMode((m) => (m === 'signin' ? 'signup' : 'signin'))}
      />
    );
  }

  const gradeColors = { A:'#10B981', B:'#2563EB', C:'#D97706', D:'#EA580C', F:'#EF4444' };
  const perfLabel   = { A:'Excellent', B:'Good', C:'Average', D:'Weak', F:'Poor', 'N/A':'Unavailable' };
  function backToApp() { setView('app'); sessionStorage.setItem('aeo-view','app'); }

  /* ── DASHBOARD view ── */
  if (view === 'dashboard') {
    return (
      <>
        <Navbar
          view="dashboard"
          onSignOut={handleSignOut}
          onBackToTool={backToApp}
        />
        <main className="app-dashboard">
          <div className="dash-hero" style={{ padding: '48px 40px 80px' }}>
            <div className="dash-hero-inner">
              <h1 className="dash-title" style={{ fontSize: 'clamp(28px,4vw,44px)', marginBottom: 10 }}>
                Scan Dashboard
              </h1>
              <p className="dash-sub">Your latest AEO diagnostic results at a glance</p>
            </div>
          </div>

          <div className="dash-content">
            {!results ? (
              <div className="db-empty">
                <div className="db-empty-icon">📊</div>
                <div className="db-empty-title">No scan yet</div>
                <p className="db-empty-desc">Run a diagnostic first to see your analytics here.</p>
                <button className="navbar-btn" style={{ marginTop: 20 }} onClick={backToApp}>
                  Go to Diagnostic Tool →
                </button>
              </div>
            ) : (
              <div className="db-wrap">

                {/* ── Summary cards ── */}
                <div className="db-cards">
                  <div className="db-card">
                    <div className="db-card-label">Scanned By</div>
                    <div className="db-card-value">{userName || 'User'}</div>
                  </div>
                  <div className="db-card">
                    <div className="db-card-label">Brand</div>
                    <div className="db-card-value">{brand}</div>
                  </div>
                  <div className="db-card">
                    <div className="db-card-label">Overall Grade</div>
                    <div className="db-card-value" style={{ color: gradeColors[overallGrade] || 'var(--text-muted)', fontSize: 36, fontWeight: 800, fontFamily: 'var(--font-display)' }}>{overallGrade}</div>
                  </div>
                  <div className="db-card">
                    <div className="db-card-label">Performance</div>
                    <div className="db-card-value">{perfLabel[overallGrade] || '—'}</div>
                  </div>
                  <div className="db-card">
                    <div className="db-card-label">Scanned On</div>
                    <div className="db-card-value" style={{ fontSize: 14 }}>
                      {scanDate ? scanDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}
                    </div>
                  </div>
                </div>

                {/* ── Engine results table ── */}
                <div className="db-section-title">Engine Breakdown</div>
                <div className="db-table-wrap">
                  <table className="db-table">
                    <thead>
                      <tr>
                        <th>AI Engine</th>
                        <th>Provider</th>
                        <th>Grade</th>
                        <th>Status</th>
                        <th>Performance</th>
                        <th>Brand Found</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((r) => (
                        <tr key={r.engine}>
                          <td className="db-td-engine">{r.engine}</td>
                          <td className="db-td-muted">{{ 'Llama 3.3':'Groq', 'Llama 3.1':'Groq', 'Command R+':'Cohere' }[r.engine] || '—'}</td>
                          <td>
                            <span className="db-grade-pill" style={{ color: gradeColors[r.grade] || 'var(--text-muted)', borderColor: gradeColors[r.grade] || 'var(--border)' }}>
                              {r.grade}
                            </span>
                          </td>
                          <td className="db-td-muted">{r.label}</td>
                          <td className="db-td-muted">
                            {{ A:'Excellent', B:'Good', C:'Average', D:'Weak', F:'Not Found', 'N/A':'Unavailable' }[r.grade] || '—'}
                          </td>
                          <td>
                            <span className={`found-pill ${r.grade === 'N/A' ? 'none' : r.found ? 'yes' : 'no'}`}>
                              {r.grade === 'N/A' ? 'Unavailable' : r.found ? '✓ Yes' : '✗ No'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* ── Competitor summary ── */}
                {compData && compData.length > 0 && (
                  <>
                    <div className="db-section-title" style={{ marginTop: 32 }}>Competitor Intelligence</div>
                    <div className="db-table-wrap">
                      <table className="db-table">
                        <thead>
                          <tr><th>Competitor Brand</th><th>Key Phrase 1</th><th>Key Phrase 2</th><th>Key Phrase 3</th></tr>
                        </thead>
                        <tbody>
                          {compData.map((c) => (
                            <tr key={c.name}>
                              <td className="db-td-engine">{c.name}</td>
                              {[0,1,2].map((i) => <td key={i} className="db-td-muted">{c.phrases?.[i] || '—'}</td>)}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                <button className="run-btn" style={{ marginTop: 28 }} onClick={backToApp}>
                  Run New Scan <span className="btn-arrow">→</span>
                </button>
              </div>
            )}
          </div>
        </main>
        <Footer />
      </>
    );
  }

  /* ── APP view ── */
  return (
    <>
      <Navbar
        view="app"
        onSignOut={handleSignOut}
        onDashboard={goToDashboard}
        hasScan={!!results}
      />

      <main className="app-dashboard">

        {/* ── Bold hero banner ── */}
        <div className="dash-hero">
          <div className="dash-hero-inner">
            <div className="dash-engines-row">
              {['Llama 3.3', 'Llama 3.1', 'Command R+'].map((e) => (
                <span key={e} className="dash-engine-chip"><span className="dash-chip-dot" />{e}</span>
              ))}
            </div>
            <h1 className="dash-title">Your AI Search<br />Report Card</h1>
            <p className="dash-sub">
              See if AI recommends your brand — or your competitor's. Results in under 15 seconds.
            </p>
          </div>
        </div>

        {/* ── Content area (floats up over hero) ── */}
        <div className="dash-content">

          <InputSection
            brand={brand} query={query}
            onBrandChange={setBrand} onQueryChange={setQuery}
            onSubmit={runDiagnostic} loading={loading}
          />

          {error && <div className="error-box">⚠ {error}</div>}

          {/* Preview cards — shown before first scan */}
          {!results && !loading && !error && (
            <div className="dash-preview-grid">
              {[
                { icon: '📊', title: 'A–F Grade per Engine',    desc: 'See exactly how each AI ranks your brand on a clear letter-grade scale.' },
                { icon: '🔍', title: 'Competitor Intelligence', desc: 'Discover the exact phrases rivals use that are winning AI recommendations.' },
                { icon: '✦',  title: 'Fix It Brief',            desc: 'Specific, prioritised actions to improve your listing copy and visibility.' },
                { icon: '🖼', title: 'Visual Strategy',         desc: 'AI-generated image brief you can take directly into Pixii to create assets.' },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="dash-preview-card">
                  <div className="dash-preview-icon">{icon}</div>
                  <div className="dash-preview-title">{title}</div>
                  <p className="dash-preview-desc">{desc}</p>
                </div>
              ))}
            </div>
          )}

          {loading && (
            <div className="loading-wrap">
              <div className="loading-header">
                <div className="loading-title">Scanning AI engines…</div>
                <div className="loading-hint">All three run simultaneously — usually 5–10 s</div>
              </div>
              <div className="loading-cards">
                {['Llama 3.3', 'Llama 3.1', 'Command R+'].map((name) => (
                  <div key={name} className="loading-card">
                    <div className="loading-card-top">
                      <span className="loading-card-name">{name}</span>
                      <div className="spinner" />
                    </div>
                    <div className="shimmer-block shimmer-grade" />
                    <div className="shimmer-block shimmer-label" />
                    <div className="shimmer-block shimmer-bar" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {results && !loading && (
            <div className="results-wrap">

              <div className="section-label">
                <span className="section-label-text">Overall Score</span>
                <span className="section-rule" />
              </div>
              <OverallGrade grade={overallGrade} brand={brand} results={results} />

              <div className="section-label">
                <span className="section-label-text">Engine Breakdown</span>
                <span className="section-rule" />
              </div>
              <div className="engine-grid">
                {results.map((r) => <EngineCard key={r.engine} {...r} />)}
              </div>

              {(compLoading || compData) && (
                <>
                  <div className="section-label">
                    <span className="section-label-text">Competitor Intelligence</span>
                    <span className="section-rule" />
                  </div>
                  <CompetitorIntelligence data={compData} userPhrases={userPhrases} loading={compLoading} brand={brand} />
                </>
              )}

              <div className="section-label">
                <span className="section-label-text">Fix It Brief</span>
                <span className="section-rule" />
              </div>
              <FixItBrief brand={brand} results={results} />

              <div className="section-label" style={{ marginTop: 24 }}>
                <span className="section-label-text">Visual Strategy</span>
                <span className="section-rule" />
              </div>
              <PixiiBrief
                brief={pixiiBrief}
                loading={pixiiLoading}
                error={pixiiError}
                onGenerate={generatePixiiBrief}
                hasData={!!results}
              />
            </div>
          )}

        </div>
      </main>

      <Footer />
    </>
  );
}
