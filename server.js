import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'] }));
app.use(express.json({ limit: '1mb' }));

let anthropic = null;
if (process.env.ANTHROPIC_API_KEY) {
  anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
} else {
  console.warn('⚠️  ANTHROPIC_API_KEY not set — AI insights disabled. Add it to .env to enable.');
}

const SYSTEM_PROMPT = `You are an environmental and economic sustainability analyst.
You interpret real data from the Google Data Commons (pulling from EPA, BEA, Census Bureau, and BLS)
to help non-technical users understand sustainability trade-offs in their communities.

Guidelines:
- Be concise: 2-3 short paragraphs max
- Lead with the most striking or actionable finding
- Translate raw numbers into plain-English impact (e.g., "higher than the national average")
- Highlight tensions between economic and environmental indicators when they exist
- Avoid technical jargon
- Always ground your analysis in the specific numbers provided`;

app.post('/api/insights', async (req, res) => {
  if (!anthropic) {
    return res.status(503).json({
      error: 'AI insights unavailable. Set ANTHROPIC_API_KEY in .env and restart the server.',
    });
  }

  const { locationName, metrics, question, trend } = req.body;

  if (!locationName || !metrics) {
    return res.status(400).json({ error: 'locationName and metrics are required' });
  }

  const metricsText = Object.entries(metrics)
    .filter(([, v]) => v !== null && v !== undefined)
    .map(([label, value]) => {
      if (typeof value === 'number') {
        return `- ${label}: ${value.toLocaleString()}`;
      }
      return `- ${label}: ${value}`;
    })
    .join('\n');

  const trendText = trend
    ? `\nRecent trend for ${trend.metric}: ${trend.direction} (from ${trend.start} to ${trend.end})`
    : '';

  const userMessage = question
    ? `Data for ${locationName}:\n${metricsText}${trendText}\n\nUser question: "${question}"\n\nAnswer specifically based on the data above.`
    : `Analyze the environmental and economic sustainability profile of ${locationName} using this data:\n\n${metricsText}${trendText}\n\nHighlight key sustainability trade-offs and what these numbers mean for people and the environment.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 700,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    res.json({ insight: message.content[0].text });
  } catch (err) {
    console.error('Claude API error:', err.message);
    res.status(500).json({ error: `AI request failed: ${err.message}` });
  }
});

// ── Data Commons proxy ────────────────────────────────────────────────────
const DC_BASE = 'https://api.datacommons.org';
const DC_API_KEY = process.env.DC_API_KEY;

app.post('/api/dc/:path(*)', async (req, res) => {
  const url = new URL(`${DC_BASE}/${req.params.path}`);
  if (DC_API_KEY) url.searchParams.set('key', DC_API_KEY);

  try {
    const upstream = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const data = await upstream.json();
    if (!upstream.ok) {
      return res.status(upstream.status).json(data);
    }
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: `Data Commons proxy error: ${err.message}` });
  }
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    aiEnabled: !!anthropic,
    dcKeyConfigured: !!DC_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`\n🌍 Environmental Impact API  →  http://localhost:${PORT}`);
  console.log(`   AI Insights: ${anthropic ? '✅ enabled' : '❌ disabled (set ANTHROPIC_API_KEY)'}\n`);
});
