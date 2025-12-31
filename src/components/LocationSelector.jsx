export function LocationSelector({ states, selected, onSelect }) {
  return (
    <div className="location-selector">
      <label htmlFor="state-select">Location</label>
      <select
        id="state-select"
        className="location-select"
        value={selected}
        onChange={e => onSelect(e.target.value)}
      >
        {states.map(state => (
          <option key={state.dcid} value={state.dcid}>
            {state.name}
          </option>
        ))}
      </select>
    </div>
  );
}
