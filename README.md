# Environmental Impact Data Explorer

An interactive dashboard for exploring environmental and economic data across US states, powered by **Google Data Commons** and **Claude AI**.

## Features

- **Live Data** — pulls real-time stats from EPA, BLS, US Census Bureau, and BEA via Google Data Commons
- **Choropleth Map** — D3-powered US map showing per-state metrics at a glance
- **Trend Charts** — historical time series for any state and metric
- **State Comparison** — bar chart ranking all 50 states side by side
- **AI Insights** — Claude analyzes the data and surfaces sustainability trade-offs in plain English
- **Natural Language Queries** — ask follow-up questions about any state's data

## Metrics

| Metric | Source |
|---|---|
| Unemployment Rate | BLS |
| Median Personal Income | US Census Bureau |
| Population | US Census Bureau |
| GHG Emissions | EPA |
| PM2.5 Air Quality | EPA AQS |

## Tech Stack

- **Frontend** — React 18, D3.js, Chart.js, Vite
- **Backend** — Node.js, Express
- **Data** — Google Data Commons API v1
- **AI** — Anthropic Claude API

## Setup

1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in your API keys:
   ```
   ANTHROPIC_API_KEY=your_key_here
   DC_API_KEY=your_key_here
   ```
   - Get a free Data Commons API key at [apikeys.datacommons.org](https://apikeys.datacommons.org)
   - Get an Anthropic API key at [console.anthropic.com](https://console.anthropic.com)

3. Start the dev server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173)
