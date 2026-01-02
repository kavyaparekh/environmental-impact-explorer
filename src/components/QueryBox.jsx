import { useState } from 'react';

const SUGGESTIONS = [
  'What are the biggest environmental risks here?',
  'How does air quality compare to the national average?',
  'What is the relationship between jobs and emissions in this state?',
  'What sustainability improvements could help this community?',
];

export function QueryBox({ onSubmit, loading, stateName }) {
  const [query, setQuery] = useState('');

  const handleSubmit = () => {
    const q = query.trim();
    if (!q || loading) return;
    onSubmit(q);
    setQuery('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  return (
    <div className="query-box">
      <div className="query-label">
        Ask Claude about <span>{stateName || 'this location'}</span>
      </div>

      <div className="query-suggestions">
        {SUGGESTIONS.map((s, i) => (
          <button
            key={i}
            className="query-chip"
            onClick={() => onSubmit(s)}
            disabled={loading}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="query-input-row">
        <textarea
          className="query-input"
          placeholder="Or type your own question... (⌘+Enter to submit)"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          rows={3}
        />
      </div>

      <button
        className="query-submit"
        onClick={handleSubmit}
        disabled={!query.trim() || loading}
      >
        {loading ? 'Analyzing...' : 'Ask Claude →'}
      </button>
    </div>
  );
}
