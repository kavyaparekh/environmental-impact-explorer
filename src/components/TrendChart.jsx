import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { formatValue } from '../constants/metrics.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const CHART_DEFAULTS = {
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
    },
  },
  scales: {
    x: {
      grid: { color: 'rgba(255,255,255,0.04)' },
      ticks: { color: '#64748b', font: { size: 11 } },
      border: { color: 'rgba(255,255,255,0.06)' },
    },
    y: {
      grid: { color: 'rgba(255,255,255,0.04)' },
      ticks: { color: '#64748b', font: { size: 11 } },
      border: { color: 'rgba(255,255,255,0.06)' },
    },
  },
  elements: {
    point: { radius: 3, hoverRadius: 6, hitRadius: 12 },
    line: { tension: 0.35 },
  },
};

export function TrendChart({ data, metric, stateName, loading }) {
  const chartData = useMemo(() => {
    // Filter to annual data points (date looks like "YYYY")
    const annual = data.filter(d => /^\d{4}$/.test(d.date));
    // Limit to last 15 years
    const recent = annual.slice(-15);

    return {
      labels: recent.map(d => d.date),
      datasets: [
        {
          label: metric.label,
          data: recent.map(d => d.value),
          borderColor: '#00d4aa',
          backgroundColor: (ctx) => {
            const chart = ctx.chart;
            const { ctx: canvasCtx, chartArea } = chart;
            if (!chartArea) return 'transparent';
            const gradient = canvasCtx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, 'rgba(0,212,170,0.25)');
            gradient.addColorStop(1, 'rgba(0,212,170,0)');
            return gradient;
          },
          fill: true,
          borderWidth: 2,
          pointBackgroundColor: '#00d4aa',
        },
      ],
    };
  }, [data, metric]);

  const options = useMemo(() => ({
    ...CHART_DEFAULTS,
    plugins: {
      ...CHART_DEFAULTS.plugins,
      tooltip: {
        ...CHART_DEFAULTS.plugins.tooltip,
        callbacks: {
          label: (ctx) => ` ${formatValue(metric, ctx.raw)}`,
        },
      },
    },
    scales: {
      ...CHART_DEFAULTS.scales,
      y: {
        ...CHART_DEFAULTS.scales.y,
        ticks: {
          ...CHART_DEFAULTS.scales.y.ticks,
          callback: (val) => formatValue(metric, val),
        },
      },
    },
  }), [metric]);

  if (loading) {
    return (
      <div className="chart-wrapper">
        <div className="chart-empty">
          <div className="chart-empty-icon">📈</div>
          <span>Loading trend data...</span>
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="chart-wrapper">
        <div className="chart-empty">
          <div className="chart-empty-icon">📊</div>
          <span>No time series data available for this metric</span>
        </div>
      </div>
    );
  }

  return (
    <div className="chart-wrapper">
      <Line data={chartData} options={options} />
    </div>
  );
}
