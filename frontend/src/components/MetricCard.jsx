import './MetricCard.css';

/**
 * Reusable metric card for dashboard summary values.
 * @param {{title: string, value: string|number, subtitle?: string, icon?: React.ElementType, accent?: string}} props
 */
export default function MetricCard({ title, value, subtitle, icon: Icon, accent = '#4f46e5' }) {
  return (
    <div className="metric-card">
      <div className="metric-card__header">
        {Icon && (
          <div className="metric-card__icon" style={{ background: `${accent}14`, color: accent }}>
            <Icon size={20} strokeWidth={1.8} />
          </div>
        )}
        <span className="metric-card__title">{title}</span>
      </div>
      <div className="metric-card__value">{value}</div>
      {subtitle && <div className="metric-card__subtitle">{subtitle}</div>}
      <div className="metric-card__accent-bar" style={{ background: accent }} />
    </div>
  );
}
