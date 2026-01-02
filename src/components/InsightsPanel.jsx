export function InsightsPanel({ insight, loading, error, stateName }) {
  return (
    <div className="insights-panel">
      <div className="insights-header">
        <div className="insights-header-icon">✦</div>
        <div>
          <div className="insights-header-text">AI Sustainability Analysis</div>
          <div className="insights-header-sub">
            Powered by Claude · {stateName}
          </div>
        </div>
      </div>

      {loading && (
        <div className="insights-loading">
          <div className="skeleton" style={{ width: '90%' }} />
          <div className="skeleton" style={{ width: '80%' }} />
          <div className="skeleton" style={{ width: '95%' }} />
          <div className="skeleton short" />
          <div style={{ height: 8 }} />
          <div className="skeleton" style={{ width: '85%' }} />
          <div className="skeleton" style={{ width: '70%' }} />
          <div className="skeleton" style={{ width: '90%' }} />
        </div>
      )}

      {!loading && error && (
        <div className="insights-error">
          <strong>Could not load insights:</strong> {error}
          {error.includes('ANTHROPIC_API_KEY') && (
            <div style={{ marginTop: 6, color: '#fbbf24' }}>
              Add your API key to <code>.env</code> and restart the server.
            </div>
          )}
        </div>
      )}

      {!loading && !error && insight && (
        <div className="insights-body">
          {insight.split('\n\n').map((para, i) => (
            <p key={i} style={i > 0 ? { marginTop: 12 } : {}}>
              {para}
            </p>
          ))}
        </div>
      )}

      {!loading && !error && !insight && (
        <div className="chart-empty" style={{ minHeight: 120 }}>
          <div className="chart-empty-icon">✦</div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Select a state to generate AI insights
          </span>
        </div>
      )}
    </div>
  );
}
