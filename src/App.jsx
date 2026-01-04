import { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header.jsx';
import { LocationSelector } from './components/LocationSelector.jsx';
import { MetricCard } from './components/MetricCard.jsx';
import { USMap } from './components/USMap.jsx';
import { TrendChart } from './components/TrendChart.jsx';
import { BarComparison } from './components/BarComparison.jsx';
import { InsightsPanel } from './components/InsightsPanel.jsx';
import { QueryBox } from './components/QueryBox.jsx';
import { US_STATES, STATE_BY_DCID, ALL_STATE_DCIDS } from './constants/states.js';
import { METRICS, METRIC_KEYS, formatValue } from './constants/metrics.js';
import {
  fetchAllStatesPoint,
  fetchTimeSeries,
  fetchMultipleVariables,
} from './services/dataCommons.js';
import { fetchInsight, checkServerHealth } from './services/insights.js';

const DEFAULT_STATE = 'geoId/06'; // California — richly covered in Data Commons
const DEFAULT_METRIC = 'unemployment';

export default function App() {
  const [selectedState, setSelectedState] = useState(DEFAULT_STATE);
  const [selectedMetricKey, setSelectedMetricKey] = useState(DEFAULT_METRIC);

  // { [dcid]: number } — all states for the current map metric
  const [mapData, setMapData] = useState({});
  const [mapLoading, setMapLoading] = useState(false);

  // { [metricKey]: number | null } — latest values for the selected state
  const [stateMetrics, setStateMetrics] = useState({});
  const [metricsLoading, setMetricsLoading] = useState(false);

  // [{ date, value }] — time series for selected state + metric
  const [timeSeries, setTimeSeries] = useState([]);
  const [timeSeriesLoading, setTimeSeriesLoading] = useState(false);

  // Claude insights
  const [insight, setInsight] = useState('');
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState('');

  // Server health (is AI enabled?)
  const [aiEnabled, setAiEnabled] = useState(undefined);

  const insightDebounceRef = useRef(null);

  const selectedMetric = METRICS[selectedMetricKey];
  const selectedStateName = STATE_BY_DCID[selectedState]?.name ?? selectedState;

  // Check server health on mount
  useEffect(() => {
    checkServerHealth().then(h => setAiEnabled(h.aiEnabled));
  }, []);

  // Load map data whenever the metric changes
  useEffect(() => {
    setMapLoading(true);
    fetchAllStatesPoint(selectedMetric.id, ALL_STATE_DCIDS)
      .then(data => setMapData(data))
      .finally(() => setMapLoading(false));
  }, [selectedMetricKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load all metric cards whenever the state changes
  useEffect(() => {
    setMetricsLoading(true);
    setStateMetrics({});

    const variableIds = METRIC_KEYS.map(k => METRICS[k].id);
    fetchMultipleVariables(selectedState, variableIds).then(raw => {
      // Map variable IDs back to metric keys
      const byKey = {};
      METRIC_KEYS.forEach(k => {
        byKey[k] = raw[METRICS[k].id] ?? null;
      });
      setStateMetrics(byKey);
    }).finally(() => setMetricsLoading(false));
  }, [selectedState]);

  // Load time series whenever state or metric changes
  useEffect(() => {
    setTimeSeriesLoading(true);
    setTimeSeries([]);
    fetchTimeSeries(selectedState, selectedMetric.id)
      .then(setTimeSeries)
      .finally(() => setTimeSeriesLoading(false));
  }, [selectedState, selectedMetricKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-generate insights when state metrics are ready (debounced)
  useEffect(() => {
    if (!aiEnabled || Object.keys(stateMetrics).length === 0) return;

    clearTimeout(insightDebounceRef.current);
    insightDebounceRef.current = setTimeout(() => {
      loadInsight('');
    }, 400);

    return () => clearTimeout(insightDebounceRef.current);
  }, [stateMetrics, aiEnabled]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadInsight = useCallback(async (question) => {
    setInsightLoading(true);
    setInsightError('');

    // Build a plain-English metrics object for Claude
    const metricsForAI = {};
    METRIC_KEYS.forEach(k => {
      const v = stateMetrics[k];
      if (v !== null && v !== undefined) {
        metricsForAI[METRICS[k].label] = formatValue(METRICS[k], v);
      }
    });

    // Summarize the trend direction if we have it
    let trend = null;
    if (timeSeries.length >= 2) {
      const annual = timeSeries.filter(d => /^\d{4}$/.test(d.date));
      if (annual.length >= 2) {
        const first = annual[0];
        const last = annual[annual.length - 1];
        const delta = last.value - first.value;
        trend = {
          metric: selectedMetric.label,
          direction: delta > 0 ? `increasing (+${(delta).toFixed(2)})` : `decreasing (${(delta).toFixed(2)})`,
          start: `${first.date}: ${formatValue(selectedMetric, first.value)}`,
          end: `${last.date}: ${formatValue(selectedMetric, last.value)}`,
        };
      }
    }

    try {
      const text = await fetchInsight({
        locationName: selectedStateName,
        metrics: metricsForAI,
        question: question || '',
        trend,
      });
      setInsight(text);
    } catch (err) {
      setInsightError(err.message);
    } finally {
      setInsightLoading(false);
    }
  }, [stateMetrics, selectedStateName, selectedMetric, timeSeries]);

  return (
    <div className="app">
      <Header aiEnabled={aiEnabled} />

      <main className="container">
        {/* ── Controls ─────────────────────────────────────────── */}
        <div className="controls-row">
          <LocationSelector
            states={US_STATES}
            selected={selectedState}
            onSelect={s => {
              setSelectedState(s);
              setInsight('');
            }}
          />
          <div className="metric-tabs">
            {METRIC_KEYS.map(key => (
              <button
                key={key}
                className={`metric-tab ${selectedMetricKey === key ? 'active' : ''}`}
                onClick={() => setSelectedMetricKey(key)}
              >
                {METRICS[key].icon} {METRICS[key].shortLabel}
              </button>
            ))}
          </div>
        </div>

        {/* ── Metric cards ─────────────────────────────────────── */}
        <div className="metric-cards section-gap">
          {METRIC_KEYS.map(key => (
            <MetricCard
              key={key}
              metricKey={key}
              metric={METRICS[key]}
              value={stateMetrics[key]}
              loading={metricsLoading}
              active={selectedMetricKey === key}
              onClick={() => setSelectedMetricKey(key)}
            />
          ))}
        </div>

        {/* ── Map + Trend row ───────────────────────────────────── */}
        <div className="main-grid section-gap">
          <div className="card">
            <div className="card-title">
              {selectedMetric.icon} {selectedMetric.label} — All States
              {mapLoading && <span className="loading-dot" />}
            </div>
            <USMap
              data={mapData}
              metric={selectedMetric}
              selectedState={selectedState}
              onStateSelect={s => {
                setSelectedState(s);
                setInsight('');
              }}
            />
          </div>

          <div className="card">
            <div className="card-title">
              📈 {selectedStateName}: {selectedMetric.shortLabel} Over Time
              {timeSeriesLoading && <span className="loading-dot" />}
            </div>
            <TrendChart
              data={timeSeries}
              metric={selectedMetric}
              stateName={selectedStateName}
              loading={timeSeriesLoading}
            />
          </div>
        </div>

        {/* ── Bar comparison ────────────────────────────────────── */}
        <div className="card section-gap">
          <div className="card-title">
            📊 State Comparison — {selectedMetric.label}
          </div>
          <BarComparison
            data={mapData}
            metric={selectedMetric}
            selectedState={selectedState}
            onStateSelect={s => {
              setSelectedState(s);
              setInsight('');
            }}
          />
        </div>

        {/* ── AI Insights + Query ───────────────────────────────── */}
        <div className="ai-section">
          <InsightsPanel
            insight={insight}
            loading={insightLoading}
            error={insightError}
            stateName={selectedStateName}
          />
          <QueryBox
            onSubmit={loadInsight}
            loading={insightLoading}
            stateName={selectedStateName}
          />
        </div>

        {/* ── Footer ───────────────────────────────────────────── */}
        <div className="data-source">
          Data sourced from{' '}
          <a href="https://datacommons.org" target="_blank" rel="noreferrer">
            Google Data Commons
          </a>{' '}
          · EPA · BEA · US Census Bureau · BLS &nbsp;|&nbsp;
          AI narratives by{' '}
          <a href="https://anthropic.com" target="_blank" rel="noreferrer">
            Claude (Anthropic)
          </a>
        </div>
      </main>
    </div>
  );
}
