import React, { useState } from 'react';

const GOOGLE_LOGO = (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

export default function AuthPage({ mode, onBack, onSuccess, onToggle }) {
  const isSignIn = mode === 'signin';

  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState(false);

  function validate() {
    if (!isSignIn && !name.trim())        return 'Please enter your full name.';
    if (!email.trim())                    return 'Please enter your email address.';
    if (!/\S+@\S+\.\S+/.test(email))     return 'Please enter a valid email address.';
    if (password.length < 6)             return 'Password must be at least 6 characters.';
    return '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const msg = validate();
    if (msg) { setError(msg); return; }

    setLoading(true);
    // Simulate network delay — replace with real API call when auth backend is ready
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    setSuccess(true);
    // Pass display name: full name for signup, email prefix for signin
    const displayName = isSignIn
      ? email.split('@')[0]
      : name.trim() || email.split('@')[0];
    setTimeout(() => onSuccess(displayName), 800);
  }

  function handleGoogle() {
    setError('');
    setLoading(true);
    // Simulate — wire to real OAuth provider when ready
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => onSuccess('Google User'), 800);
    }, 1200);
  }

  // Reset form fields when toggling between sign-in / sign-up
  function handleToggle() {
    setName(''); setEmail(''); setPassword('');
    setError(''); setSuccess(false);
    onToggle();
  }

  return (
    <div className="auth-page">
      {/* ── Left panel ── */}
      <div className="auth-left">
        <div className="auth-float-cards">
          <div className="float-card float-card-1">
            <div className="float-card-grade" style={{ color: '#10B981' }}>A</div>
            <div className="float-card-info">
              <div className="float-card-engine">Llama 3.3</div>
              <div className="float-card-label">Top Pick</div>
            </div>
          </div>
          <div className="float-card float-card-2">
            <div className="float-card-grade" style={{ color: '#F59E0B' }}>C</div>
            <div className="float-card-info">
              <div className="float-card-engine">Llama 3.1</div>
              <div className="float-card-label">Mentioned</div>
            </div>
          </div>
          <div className="float-card float-card-3">
            <div className="float-card-grade" style={{ color: '#EF4444' }}>F</div>
            <div className="float-card-info">
              <div className="float-card-engine">Command R+</div>
              <div className="float-card-label">Not Found</div>
            </div>
          </div>
        </div>

        <div className="auth-left-content">
          <div className="auth-left-quote">
            Know your rank.<br />Fix your listing.<br />Win the AI search.
          </div>
          <div className="auth-features">
            <span className="auth-feature-pill">3 AI Engines</span>
            <span className="auth-feature-pill">Competitor Intel</span>
            <span className="auth-feature-pill">Visual Brief</span>
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="auth-right">
        <button className="auth-back" onClick={onBack}>← Back to app</button>

        {success ? (
          <div className="auth-success">
            <div className="auth-success-icon">✓</div>
            <div className="auth-success-msg">
              {isSignIn ? 'Signed in! Taking you back…' : 'Account created! Taking you back…'}
            </div>
          </div>
        ) : (
          <>
            <div className="auth-form-title">{isSignIn ? 'Welcome back' : 'Create account'}</div>
            <div className="auth-form-sub">
              {isSignIn
                ? 'Sign in to your AEO Diagnostic account.'
                : 'Start diagnosing your AI search visibility.'}
            </div>

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              {!isSignIn && (
                <div className="auth-input-group">
                  <label className="auth-label">Full name</label>
                  <input
                    className="auth-input"
                    type="text"
                    placeholder="Jane Smith"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    autoComplete="name"
                  />
                </div>
              )}

              <div className="auth-input-group">
                <label className="auth-label">Email</label>
                <input
                  className="auth-input"
                  type="email"
                  placeholder="jane@brand.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  autoComplete="email"
                />
              </div>

              <div className="auth-input-group">
                <label className="auth-label">Password</label>
                <input
                  className="auth-input"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  autoComplete={isSignIn ? 'current-password' : 'new-password'}
                />
              </div>

              {error && <div className="auth-error">{error}</div>}

              <button className="auth-submit" type="submit" disabled={loading}>
                {loading
                  ? <><span className="auth-spinner" /> {isSignIn ? 'Signing in…' : 'Creating account…'}</>
                  : isSignIn ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <div className="auth-divider">or continue with</div>

            <button className="auth-google" onClick={handleGoogle} disabled={loading}>
              {GOOGLE_LOGO}
              Continue with Google
            </button>

            <div className="auth-toggle">
              {isSignIn ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button onClick={handleToggle} disabled={loading}>
                {isSignIn ? 'Sign up' : 'Sign in'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
