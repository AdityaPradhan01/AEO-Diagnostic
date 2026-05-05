import React from 'react';

export default function Navbar({ view, onSignIn, onGetStarted, onSignOut, onDashboard, hasScan, onBackToTool }) {
  return (
    <nav className="navbar">
      <div className="navbar-logo" onClick={() => window.location.reload()} style={{ cursor: 'pointer' }}>
        <span className="logo-aeo">AEO</span>
        <span className="logo-diag">Diagnostic</span>
      </div>

      <div className="navbar-right">
        {view === 'landing' && (
          <>
            <a href="#how-it-works" className="navbar-link">How it works</a>
            <button className="navbar-signin" onClick={onSignIn}>Sign in</button>
            <button className="navbar-btn" onClick={onGetStarted}>Get Started Free</button>
          </>
        )}

        {view === 'app' && (
          <>
            {hasScan ? (
              <button className="navbar-dashboard-btn" onClick={onDashboard}>
                📊 Dashboard
              </button>
            ) : (
              <span className="navbar-app-label">Diagnostic Tool</span>
            )}
            <button className="navbar-signout" onClick={onSignOut}>Sign out</button>
          </>
        )}

        {view === 'dashboard' && (
          <>
            <button className="navbar-back-btn" onClick={onBackToTool}>
              ← Back to Tool
            </button>
            <button className="navbar-signout" onClick={onSignOut}>Sign out</button>
          </>
        )}
      </div>
    </nav>
  );
}
