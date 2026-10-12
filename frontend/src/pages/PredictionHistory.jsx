import { useState, useCallback } from 'react';
import { History, Trash2, Eye, X, Inbox } from 'lucide-react';
import ProbabilityChart from '../components/ProbabilityChart';
import './PredictionHistory.css';

const HISTORY_KEY = 'modelscope_predictions';

export default function PredictionHistory() {
  const [history, setHistory] = useState(() =>
    JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
  );
  const [selectedIndex, setSelectedIndex] = useState(null);

  const clearHistory = useCallback(() => {
    if (window.confirm('Clear all prediction history? This cannot be undone.')) {
      localStorage.removeItem(HISTORY_KEY);
      setHistory([]);
      setSelectedIndex(null);
    }
  }, []);

  const removeItem = useCallback((idx) => {
    const updated = history.filter((_, i) => i !== idx);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    setHistory(updated);
    if (selectedIndex === idx) setSelectedIndex(null);
    else if (selectedIndex !== null && selectedIndex > idx) {
      setSelectedIndex(selectedIndex - 1);
    }
  }, [history, selectedIndex]);

  const selected = selectedIndex !== null ? history[selectedIndex] : null;

  // Display in reverse chronological order
  const reversed = [...history].reverse();

  return (
    <div className="prediction-history">
      <div className="prediction-history__header">
        <div>
          <h2 className="prediction-history__heading">Prediction History</h2>
          <p className="prediction-history__subheading">
            Browser-local prediction records · {history.length} total
          </p>
        </div>
        {history.length > 0 && (
          <button className="prediction-history__clear-btn" onClick={clearHistory}>
            <Trash2 size={14} />
            Clear All
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="prediction-history__empty">
          <Inbox size={48} strokeWidth={1} />
          <h3>No predictions recorded</h3>
          <p>Predictions made in the Prediction Studio will appear here.</p>
          <p className="prediction-history__empty-note">
            History is stored locally in your browser and is not shared across devices.
          </p>
        </div>
      ) : (
        <div className="prediction-history__layout">
          {/* Table */}
          <div className="prediction-history__table-wrap">
            <table className="prediction-history__table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Timestamp</th>
                  <th>Sepal L</th>
                  <th>Sepal W</th>
                  <th>Petal L</th>
                  <th>Petal W</th>
                  <th>Species</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reversed.map((item, revIdx) => {
                  const realIdx = history.length - 1 - revIdx;
                  return (
                    <tr
                      key={realIdx}
                      className={selectedIndex === realIdx ? 'prediction-history__row--selected' : ''}
                    >
                      <td className="prediction-history__cell--num">{history.length - revIdx}</td>
                      <td className="prediction-history__cell--time">
                        {new Date(item.timestamp).toLocaleString()}
                      </td>
                      <td>{item.input.sepal_length}</td>
                      <td>{item.input.sepal_width}</td>
                      <td>{item.input.petal_length}</td>
                      <td>{item.input.petal_width}</td>
                      <td>
                        <span className={`prediction-history__species-badge prediction-history__species-badge--${item.predicted_species}`}>
                          {item.predicted_species}
                        </span>
                      </td>
                      <td>
                        <div className="prediction-history__actions">
                          <button
                            className="prediction-history__action-btn"
                            onClick={() => setSelectedIndex(realIdx)}
                            title="View details"
                            aria-label="View prediction details"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            className="prediction-history__action-btn prediction-history__action-btn--delete"
                            onClick={() => removeItem(realIdx)}
                            title="Delete"
                            aria-label="Delete prediction"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Detail Panel */}
          {selected && (
            <div className="prediction-history__detail">
              <div className="prediction-history__detail-header">
                <h3>Prediction Detail</h3>
                <button
                  className="prediction-history__detail-close"
                  onClick={() => setSelectedIndex(null)}
                  aria-label="Close detail panel"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="prediction-history__detail-species">
                <span className="prediction-history__detail-species-label">Predicted Species</span>
                <span className="prediction-history__detail-species-value">{selected.predicted_species}</span>
              </div>

              <ProbabilityChart probabilities={selected.probabilities} />

              <div className="prediction-history__detail-measurements">
                <h4>Input Measurements</h4>
                <div className="prediction-history__detail-grid">
                  <div><span>Sepal Length</span><strong>{selected.input.sepal_length} cm</strong></div>
                  <div><span>Sepal Width</span><strong>{selected.input.sepal_width} cm</strong></div>
                  <div><span>Petal Length</span><strong>{selected.input.petal_length} cm</strong></div>
                  <div><span>Petal Width</span><strong>{selected.input.petal_width} cm</strong></div>
                </div>
              </div>

              <div className="prediction-history__detail-time">
                {new Date(selected.timestamp).toLocaleString()}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
