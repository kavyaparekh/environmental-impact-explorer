export function Header({ aiEnabled }) {
  return (
    <header className="header">
      <div className="header-left">
        <div className="header-logo">🌍</div>
        <div>
          <div className="header-title">Environmental Impact Explorer</div>
          <div className="header-subtitle">
            Real-time EPA · BEA · Census data via Google Data Commons
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <div className="header-badge">
          <span className="dot" />
          Live Data Commons
        </div>
        {aiEnabled !== undefined && (
          <div className="header-badge" style={{
            borderColor: aiEnabled ? 'rgba(0,212,170,0.3)' : 'rgba(100,116,139,0.3)',
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: aiEnabled ? '#00d4aa' : '#64748b',
              display: 'inline-block',
              flexShrink: 0,
            }} />
            {aiEnabled ? 'AI Insights Active' : 'AI Insights Offline'}
          </div>
        )}
      </div>
    </header>
  );
}
