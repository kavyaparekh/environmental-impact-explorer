import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { STATE_BY_FIPS } from '../constants/states.js';
import { formatValue } from '../constants/metrics.js';

const US_ATLAS_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';

// Color scale by metric scheme
function makeColorScale(values, scheme) {
  const [min, max] = d3.extent(values);
  if (min === undefined) return () => '#1e2d4a';

  switch (scheme) {
    case 'heat':
      return d3.scaleSequential(d3.interpolateYlOrRd).domain([min, max]);
    case 'cool':
      return d3.scaleSequential(d3.interpolateYlGn).domain([min, max]);
    case 'blue':
      return d3.scaleSequential(d3.interpolateBlues).domain([min, max]);
    default:
      return d3.scaleSequential(d3.interpolatePurples).domain([min, max]);
  }
}

export function USMap({ data, metric, selectedState, onStateSelect }) {
  const svgRef = useRef(null);
  const [topology, setTopology] = useState(null);
  const [tooltip, setTooltip] = useState(null);

  // Load US atlas once
  useEffect(() => {
    fetch(US_ATLAS_URL)
      .then(r => r.json())
      .then(setTopology)
      .catch(err => console.error('Failed to load US atlas:', err));
  }, []);

  const drawMap = useCallback(() => {
    if (!topology || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 800;
    const height = 500;

    const states = topojson.feature(topology, topology.objects.states);
    const projection = d3.geoAlbersUsa().fitSize([width, height], states);
    const path = d3.geoPath(projection);

    const values = Object.values(data).filter(v => v !== null && v !== undefined);
    const colorScale = makeColorScale(values, metric.mapColorScheme);

    // Draw state paths
    svg
      .append('g')
      .selectAll('path')
      .data(states.features)
      .join('path')
      .attr('class', d => {
        const fips = d.id.toString().padStart(2, '0');
        const dcid = `geoId/${fips}`;
        return `state-path ${dcid === selectedState ? 'selected' : ''}`;
      })
      .attr('d', path)
      .attr('fill', d => {
        const fips = d.id.toString().padStart(2, '0');
        const value = data[`geoId/${fips}`];
        return value !== undefined ? colorScale(value) : '#1a2340';
      })
      .on('mousemove', (event, d) => {
        const fips = d.id.toString().padStart(2, '0');
        const state = STATE_BY_FIPS[fips];
        const value = data[`geoId/${fips}`];
        if (state) {
          setTooltip({
            x: event.clientX + 12,
            y: event.clientY - 36,
            name: state.name,
            value: value !== undefined ? formatValue(metric, value) : 'No data',
          });
        }
      })
      .on('mouseleave', () => setTooltip(null))
      .on('click', (event, d) => {
        const fips = d.id.toString().padStart(2, '0');
        onStateSelect(`geoId/${fips}`);
      });

    // State borders mesh
    svg
      .append('path')
      .datum(topojson.mesh(topology, topology.objects.states, (a, b) => a !== b))
      .attr('fill', 'none')
      .attr('stroke', 'rgba(255,255,255,0.06)')
      .attr('stroke-width', 0.5)
      .attr('d', path);

    // Selected state highlight
    if (selectedState) {
      const fips = selectedState.replace('geoId/', '');
      const selectedFeature = states.features.find(
        f => f.id.toString().padStart(2, '0') === fips
      );
      if (selectedFeature) {
        svg
          .append('path')
          .datum(selectedFeature)
          .attr('fill', 'none')
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 1.8)
          .attr('d', path)
          .style('pointer-events', 'none');
      }
    }
  }, [topology, data, metric, selectedState, onStateSelect]);

  useEffect(() => { drawMap(); }, [drawMap]);

  // Build gradient CSS for legend
  const legendGradient = (() => {
    switch (metric.mapColorScheme) {
      case 'heat': return 'linear-gradient(90deg, #ffffb2, #fd8d3c, #bd0026)';
      case 'cool': return 'linear-gradient(90deg, #ffffcc, #78c679, #006837)';
      case 'blue': return 'linear-gradient(90deg, #deebf7, #6baed6, #08306b)';
      default:     return 'linear-gradient(90deg, #f2f0f7, #9e9ac8, #3f007d)';
    }
  })();

  const values = Object.values(data).filter(v => v !== null && v !== undefined);
  const [minVal, maxVal] = d3.extent(values);

  return (
    <div className="map-container">
      <svg ref={svgRef} viewBox="0 0 800 500" />

      {values.length > 0 && (
        <div className="map-legend">
          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
            {formatValue(metric, minVal)}
          </span>
          <div
            className="map-legend-bar"
            style={{ background: legendGradient }}
          />
          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
            {formatValue(metric, maxVal)}
          </span>
          <span style={{ color: 'var(--text-faint)', fontSize: 10, marginLeft: 8 }}>
            ({values.length} states)
          </span>
        </div>
      )}

      {tooltip && (
        <div
          className="map-tooltip"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <div className="map-tooltip-name">{tooltip.name}</div>
          <div className="map-tooltip-value">{tooltip.value}</div>
        </div>
      )}
    </div>
  );
}
