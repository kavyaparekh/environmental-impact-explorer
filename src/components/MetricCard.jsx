import { formatValue } from '../constants/metrics.js';

export function MetricCard({ metricKey, metric, value, loading, active, onClick }) {
  const formatted = loading ? '—' : formatValue(metric, value);
  const hasValue = value !== null && value !== undefined && !loading;

  // Determine if value is notably bad/good (simple heuristic)
  let badge = null;
  if (hasValue && metric.higherIsBad !== null) {
    // We don't have national averages baked in, so just show the direction indicator
    badge = null; // Could extend with percentile data
  }

  return (
    <button className={`metric-card ${active ? 'active' : ''}`} onClick={onClick}>
      <div className="metric-card-icon">{metric.icon}</div>
      <div className="metric-card-label">{metric.shortLabel}</div>
      <div className={`metric-card-value ${loading ? 'loading' : ''}`}>
        {formatted}
      </div>
      <div className="metric-card-desc">{metric.description}</div>
    </button>
  );
}
