import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { STATE_BY_DCID } from '../constants/states.js';
import { formatValue } from '../constants/metrics.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const TOP_N = 15; // Show top 15 states by value

export function BarComparison({ data, metric, selectedState, onStateSelect }) {
  const sorted = useMemo(() => {
    const entries = Object.entries(data)
      .filter(([, v]) => v !== null && v !== undefined)
      .map(([dcid, value]) => ({ dcid, value, name: STATE_BY_DCID[dcid]?.abbr || dcid }))
      .sort((a, b) => b.value - a.value);

    // Return top N and bottom N, ensuring selected state is included
    const top = entries.slice(0, TOP_N);
    return top;
  }, [data]);

  const chartData = useMemo(() => ({
    labels: sorted.map(s => s.name),
    datasets: [
      {
        label: metric.label,
        data: sorted.map(s => s.value),
        backgroundColor: sorted.map(s =>
          s.dcid === selectedState
            ? '#00d4aa'
            : metric.higherIsBad
              ? 'rgba(239,68,68,0.5)'
              : 'rgba(99,102,241,0.5)'
        ),
        borderColor: sorted.map(s =>
          s.dcid === selectedState ? '#00d4aa' : 'transparent'
        ),
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
      },
    ],
  }), [sorted, metric, selectedState]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(13,18,38,0.95)',
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        titleColor: '#e8edf5',
        bodyColor: '#00d4aa',
        padding: 10,
        cornerRadius: 6,
        callbacks: {
          title: ([ctx]) => {
            const s = sorted[ctx.dataIndex];
            return STATE_BY_DCID[s?.dcid]?.name || ctx.label;
          },
          label: (ctx) => ` ${formatValue(metric, ctx.raw)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748b', font: { size: 11 } },
        border: { color: 'rgba(255,255,255,0.06)' },
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: {
          color: '#64748b',
          font: { size: 11 },
          callback: (val) => formatValue(metric, val),
        },
        border: { color: 'rgba(255,255,255,0.06)' },
      },
    },
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const idx = elements[0].index;
        onStateSelect(sorted[idx].dcid);
      }
    },
  }), [sorted, metric, onStateSelect]);

  if (!sorted.length) {
    return (
      <div className="chart-wrapper tall">
        <div className="chart-empty">
          <div className="chart-empty-icon">📊</div>
          <span>Loading state comparison...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
        Top {sorted.length} states by {metric.label}
        {metric.higherIsBad && (
          <span style={{ color: '#f87171', marginLeft: 6 }}>· Higher = worse</span>
        )}
        {metric.higherIsBad === false && (
          <span style={{ color: '#4ade80', marginLeft: 6 }}>· Higher = better</span>
        )}
        <span style={{ color: 'var(--teal)', marginLeft: 6 }}>
          · Click a bar to select that state
        </span>
      </div>
      <div className="chart-wrapper tall">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}
