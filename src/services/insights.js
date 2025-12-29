/**
 * AI Insights service — proxies requests to the local Express server
 * which calls the Claude API server-side.
 */

export async function fetchInsight({ locationName, metrics, question, trend }) {
  const res = await fetch('/api/insights', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ locationName, metrics, question, trend }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Server error ${res.status}`);
  }

  return data.insight;
}

export async function checkServerHealth() {
  try {
    const res = await fetch('/api/health');
    return await res.json();
  } catch {
    return { status: 'unreachable', aiEnabled: false };
  }
}
