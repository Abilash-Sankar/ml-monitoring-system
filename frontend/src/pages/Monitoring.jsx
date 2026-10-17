import { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  HeartPulse,
  Hash,
  Clock,
  AlertCircle,
  BarChart3,
  ExternalLink,
  Gauge,
  Zap,
  PieChart,
  RefreshCw,
} from 'lucide-react';
import MetricCard from '../components/MetricCard';
import LoadingState from '../components/LoadingState';
import ErrorMessage from '../components/ErrorMessage';
import { checkHealth, fetchPredictionStats, fetchRawMetrics } from '../services/api';
import './Monitoring.css';

/** Parse a single metric value from Prometheus exposition text */
function parseMetricValue(text, metricName) {
  const lines = text.split('\n');
  let total = 0;
  for (const line of lines) {
    if (line.startsWith(metricName) && !line.startsWith('#')) {
      const parts = line.split(' ');
      const val = parseFloat(parts[parts.length - 1]);
      if (!isNaN(val)) total += val;
    }
  }
  return total;
}

export default function Monitoring() {
  const [health, setHealth] = useState(null);
  const [stats, setStats] = useState(null);
  const [promMetrics, setPromMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      setError(null);
      const [healthData, statsData, metricsText] = await Promise.allSettled([
        checkHealth(),
        fetchPredictionStats(),
        fetchRawMetrics(),
      ]);

      setHealth(healthData.status === 'fulfilled' ? healthData.value : null);
      setStats(statsData.status === 'fulfilled' ? statsData.value : null);

      if (metricsText.status === 'fulfilled') {
        const text = metricsText.value;
        setPromMetrics({
          httpRequestsTotal: parseMetricValue(text, 'http_requests_total'),
          predictionRequestsTotal: parseMetricValue(text, 'prediction_requests_total'),
          predictionErrorsTotal: parseMetricValue(text, 'prediction_errors_total'),
          raw: text,
        });
      } else {
        setPromMetrics(null);
      }

      setLastRefresh(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 15000);
    return () => clearInterval(id);
  }, [fetchAll]);

  if (loading) return <LoadingState message="Checking monitoring endpoints..." />;

  const avgLatency = stats?.avg_latency_ms;
  const avgConfidence = stats?.avg_confidence;
  const totalPredictions = stats?.total_predictions ?? 0;
  const speciesDist = stats?.species_distribution ?? {};
  const recentPredictions = stats?.recent_predictions ?? [];

  return (
    <div className="monitoring">
      <div className="monitoring__header">
        <div>
          <h2 className="monitoring__heading">Monitoring</h2>
          <p className="monitoring__subheading">
            Live system health, Prometheus metrics &amp; operational analytics
          </p>
        </div>
        <button className="monitoring__refresh-btn" onClick={fetchAll} title="Refresh all metrics">
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {error && <ErrorMessage message={error} onRetry={fetchAll} />}

      {/* Live metrics cards */}
      <div className="monitoring__grid">
        <MetricCard
          title="API Health"
          value={health?.status === 'healthy' ? 'Healthy' : 'Unavailable'}
          subtitle="GET /health"
          icon={HeartPulse}
          accent={health?.status === 'healthy' ? '#059669' : '#dc2626'}
        />
        <MetricCard
          title="Total Predictions"
          value={totalPredictions.toLocaleString()}
          subtitle="Server-side total"
          icon={Hash}
          accent="#6366f1"
        />
        <MetricCard
          title="Avg Latency"
          value={avgLatency != null ? `${avgLatency.toFixed(2)} ms` : '—'}
          subtitle="Mean prediction latency"
          icon={Clock}
          accent="#f59e0b"
        />
        <MetricCard
          title="Avg Confidence"
          value={avgConfidence != null ? `${(avgConfidence * 100).toFixed(1)}%` : '—'}
          subtitle="Mean model confidence"
          icon={Gauge}
          accent="#8b5cf6"
        />
        <MetricCard
          title="HTTP Requests"
          value={promMetrics ? promMetrics.httpRequestsTotal.toLocaleString() : '—'}
          subtitle="Total (from Prometheus)"
          icon={Zap}
          accent="#0ea5e9"
        />
        <MetricCard
          title="Prediction Errors"
          value={promMetrics ? promMetrics.predictionErrorsTotal.toLocaleString() : '0'}
          subtitle="Total errors recorded"
          icon={AlertCircle}
          accent={promMetrics?.predictionErrorsTotal > 0 ? '#dc2626' : '#059669'}
        />
      </div>

      {/* Species Distribution */}
      {Object.keys(speciesDist).length > 0 && (
        <div className="monitoring__section">
          <h3 className="monitoring__section-title">
            <PieChart size={16} style={{ marginRight: 6 }} />
            Species Distribution
          </h3>
          <div className="monitoring__species-grid">
            {Object.entries(speciesDist).map(([species, count]) => (
              <div key={species} className="monitoring__species-card">
                <span className="monitoring__species-name">{species}</span>
                <span className="monitoring__species-count">{count}</span>
                <div className="monitoring__species-bar-container">
                  <div
                    className="monitoring__species-bar"
                    style={{ width: `${totalPredictions > 0 ? (count / totalPredictions) * 100 : 0}%` }}
                  />
                </div>
                <span className="monitoring__species-pct">
                  {totalPredictions > 0 ? ((count / totalPredictions) * 100).toFixed(1) : 0}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="monitoring__section">
        <h3 className="monitoring__section-title">
          <Activity size={16} style={{ marginRight: 6 }} />
          Recent Activity
        </h3>
        {recentPredictions.length === 0 ? (
          <div className="monitoring__empty-activity">
            No recent predictions. Activity will appear here as predictions are made.
          </div>
        ) : (
          <div className="monitoring__activity-list">
            {recentPredictions.map((item, i) => (
              <div key={item.id ?? i} className="monitoring__activity-item">
                <div className="monitoring__activity-dot" />
                <div className="monitoring__activity-content">
                  <span className="monitoring__activity-text">
                    Predicted <strong>{item.predicted_species}</strong>
                    {item.confidence != null && (
                      <span className="monitoring__activity-confidence">
                        {(item.confidence * 100).toFixed(1)}% confidence
                      </span>
                    )}
                  </span>
                  <span className="monitoring__activity-time">
                    {item.latency_ms != null && `${item.latency_ms} ms · `}
                    {item.created_at ? new Date(item.created_at).toLocaleString() : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Prometheus & Grafana links */}
      <div className="monitoring__section">
        <h3 className="monitoring__section-title">
          <BarChart3 size={16} style={{ marginRight: 6 }} />
          Advanced Monitoring
        </h3>
        <div className="monitoring__integration-placeholder">
          <a
            href="http://localhost:9090"
            target="_blank"
            rel="noopener noreferrer"
            className="monitoring__integration-card monitoring__integration-card--live"
          >
            <div className="monitoring__integration-icon">
              <Activity size={32} strokeWidth={1} />
            </div>
            <h4>Prometheus Metrics</h4>
            <p>
              Request latency histograms, error rate counters, and prediction throughput metrics
              from the FastAPI backend instrumented with
              <code> prometheus-fastapi-instrumentator</code>.
            </p>
            <span className="monitoring__integration-status monitoring__integration-status--live">
              <span className="monitoring__status-dot" />
              Live · Port 9090
              <ExternalLink size={12} style={{ marginLeft: 4 }} />
            </span>
          </a>
          <a
            href="http://localhost:3001"
            target="_blank"
            rel="noopener noreferrer"
            className="monitoring__integration-card monitoring__integration-card--live"
          >
            <div className="monitoring__integration-icon">
              <BarChart3 size={32} strokeWidth={1} />
            </div>
            <h4>Grafana Dashboards</h4>
            <p>
              Interactive dashboards for visualizing time-series metrics, prediction distribution,
              model latency, and system resource usage. Pre-provisioned with the
              ML Model Monitoring dashboard.
            </p>
            <span className="monitoring__integration-status monitoring__integration-status--live">
              <span className="monitoring__status-dot" />
              Live · Port 3001 · admin / admin
              <ExternalLink size={12} style={{ marginLeft: 4 }} />
            </span>
          </a>
        </div>
      </div>

      {lastRefresh && (
        <p className="monitoring__last-refresh">
          Last refreshed: {lastRefresh.toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}
