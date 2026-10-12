import './ProbabilityChart.css';

const SPECIES_COLORS = {
  setosa: '#6366f1',
  versicolor: '#06b6d4',
  virginica: '#f59e0b',
};

/**
 * Horizontal probability bars for each predicted class.
 * @param {{probabilities: Record<string, number>}} props
 */
export default function ProbabilityChart({ probabilities }) {
  if (!probabilities) return null;

  const entries = Object.entries(probabilities).sort((a, b) => b[1] - a[1]);

  return (
    <div className="probability-chart">
      <h3 className="probability-chart__title">Class Probabilities</h3>
      <div className="probability-chart__bars">
        {entries.map(([species, prob]) => {
          const pct = (prob * 100).toFixed(1);
          const color = SPECIES_COLORS[species] || '#94a3b8';
          return (
            <div key={species} className="probability-chart__row">
              <div className="probability-chart__label">
                <span className="probability-chart__species">{species}</span>
                <span className="probability-chart__pct">{pct}%</span>
              </div>
              <div className="probability-chart__track">
                <div
                  className="probability-chart__fill"
                  style={{ width: `${pct}%`, background: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
