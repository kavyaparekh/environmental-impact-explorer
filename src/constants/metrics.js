// Metric definitions — each maps to a Google Data Commons stat variable
export const METRICS = {
  unemployment: {
    id: 'UnemploymentRate_Person',
    label: 'Unemployment Rate',
    shortLabel: 'Unemployment',
    unit: '%',
    unitPrefix: false,
    decimals: 1,
    description: 'Percentage of the labor force that is unemployed (BLS)',
    higherIsBad: true,
    mapColorScheme: 'heat', // yellow → red (bad when high)
    icon: '👷',
  },
  medianIncome: {
    id: 'Median_Income_Person',
    label: 'Median Personal Income',
    shortLabel: 'Med. Income',
    unit: '$',
    unitPrefix: true,
    decimals: 0,
    description: 'Median annual income per person (US Census Bureau)',
    higherIsBad: false,
    mapColorScheme: 'cool', // yellow → green (good when high)
    icon: '💵',
  },
  population: {
    id: 'Count_Person',
    label: 'Population',
    shortLabel: 'Population',
    unit: '',
    unitPrefix: false,
    decimals: 0,
    description: 'Total resident population (US Census Bureau)',
    higherIsBad: null,
    mapColorScheme: 'blue',
    icon: '👥',
  },
  co2: {
    id: 'Annual_Emissions_GreenhouseGas_NonBiogenic',
    label: 'GHG Emissions',
    shortLabel: 'GHG',
    unit: 'MT CO₂e',
    unitPrefix: false,
    decimals: 0,
    description: 'Annual greenhouse gas emissions, metric tons CO₂-equivalent (EPA)',
    higherIsBad: true,
    mapColorScheme: 'heat',
    icon: '🏭',
  },
  pm25: {
    id: 'Mean_Concentration_AirPollutant_PM2.5',
    label: 'PM2.5 Air Quality',
    shortLabel: 'PM2.5',
    unit: 'µg/m³',
    unitPrefix: false,
    decimals: 1,
    description: 'Mean fine particulate matter concentration (EPA AQS)',
    higherIsBad: true,
    mapColorScheme: 'heat',
    icon: '🌫️',
  },
};

export const METRIC_KEYS = Object.keys(METRICS);

export function formatValue(metric, value) {
  if (value === null || value === undefined) return 'N/A';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return 'N/A';

  const fixed = metric.decimals > 0 ? num.toFixed(metric.decimals) : Math.round(num).toLocaleString();

  if (metric.unitPrefix) return `${metric.unit}${fixed}`;
  if (metric.unit) return `${fixed} ${metric.unit}`;
  return fixed;
}
