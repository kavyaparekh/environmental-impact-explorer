/**
 * Google Data Commons API v1 service
 * Calls are proxied through the local Express server (/api/dc/...)
 * so the DC_API_KEY stays server-side.
 */

const DC_PROXY = '/api/dc';

// Parse a v1 bulk point response into { dcid: value }
function parsePointResponse(data) {
  const result = {};
  const byVar = data?.observationsByVariable?.[0];
  if (!byVar?.observationsByEntity) return result;

  for (const { entity, pointsByFacet } of byVar.observationsByEntity) {
    // pointsByFacet[0] is the best facet; its array is sorted by date desc or contains a single latest point
    const facet = pointsByFacet?.[0];
    if (!facet) continue;
    // When date:"LATEST" is omitted, the API returns a single point directly on the facet object
    const value = facet.value ?? facet.observations?.[0]?.value;
    if (value !== undefined) {
      result[entity] = value;
    }
  }
  return result;
}

// Parse a v1 bulk series response into [{ date, value }] for a single entity
function parseSeriesForEntity(data, entityDcid) {
  const byVar = data?.observationsByVariable?.[0];
  if (!byVar?.observationsByEntity) return [];

  const entityData = byVar.observationsByEntity.find(e => e.entity === entityDcid);
  const series = entityData?.seriesByFacet?.[0]?.series ?? [];

  return series
    .filter(p => p.date && p.value !== undefined)
    .sort((a, b) => a.date.localeCompare(b.date));
}

async function dcPost(path, body) {
  const res = await fetch(`${DC_PROXY}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`DC proxy ${res.status}`);
  return res.json();
}

/**
 * Fetch the latest observed value for a stat variable across all provided entity DCIDs.
 * Returns { [dcid]: number }
 */
export async function fetchAllStatesPoint(variableId, entityDcids) {
  try {
    const data = await dcPost('v1/bulk/observations/point', {
      entities: entityDcids,
      variables: [variableId],
    });
    return parsePointResponse(data);
  } catch (err) {
    console.warn(`[DataCommons] fetchAllStatesPoint(${variableId}) failed:`, err.message);
    return {};
  }
}

/**
 * Fetch the complete time series for a single entity and stat variable.
 * Returns [{ date: string, value: number }] sorted by date.
 */
export async function fetchTimeSeries(entityDcid, variableId) {
  try {
    const data = await dcPost('v1/bulk/observations/series', {
      entities: [entityDcid],
      variables: [variableId],
    });
    return parseSeriesForEntity(data, entityDcid);
  } catch (err) {
    console.warn(`[DataCommons] fetchTimeSeries(${entityDcid}, ${variableId}) failed:`, err.message);
    return [];
  }
}

/**
 * Fetch the latest observed value for a single entity + variable.
 * Returns number | null.
 */
export async function fetchSingleObservation(entityDcid, variableId) {
  try {
    const data = await dcPost('v1/bulk/observations/point', {
      entities: [entityDcid],
      variables: [variableId],
    });
    const parsed = parsePointResponse(data);
    return parsed[entityDcid] ?? null;
  } catch (err) {
    console.warn(`[DataCommons] fetchSingleObservation(${entityDcid}, ${variableId}) failed:`, err.message);
    return null;
  }
}

/**
 * Fetch latest values for multiple variables for a single entity in parallel.
 * Returns { [variableId]: number | null }
 */
export async function fetchMultipleVariables(entityDcid, variableIds) {
  const results = await Promise.allSettled(
    variableIds.map(vid => fetchSingleObservation(entityDcid, vid))
  );
  return Object.fromEntries(
    variableIds.map((vid, i) => [
      vid,
      results[i].status === 'fulfilled' ? results[i].value : null,
    ])
  );
}
