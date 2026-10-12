import { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  HeartPulse,
  Hash,
  Clock,
  AlertCircle,
  BarChart3,
  ExternalLink,
} from 'lucide-react';
import MetricCard from '../components/MetricCard';
import LoadingState from '../components/LoadingState';
import ErrorMessage from '../components/ErrorMessage';
import { checkHealth } from '../services/api';
import './Monitoring.css';

const HISTORY_KEY = 'modelscope_predictions';

export default function Monitoring() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHealth = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await checkHealth();
      setHealth(data);
    } catch (err) {
      setError(err.message);
      setHealth(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const updateHealth = async () => {
      try {
        const data = await checkHealth();
        if (active) {
          setHealth(data);
          setError(null);
          setLoading(false);
        }
      } catch (err) {
        if (active) {
          setError(err.message);
          setHealth(null);
          setLoading(false);
        }
      }
    };

    updateHealth();
    const id = setInterval(updateHealth, 30000);
    return () => clearInterval(id);
  }, []);

  const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  const predictionCount = history.length;

  if (loading) return <LoadingState message="Checking monitoring endpoints..." />;

  return (
    <div className="monitoring">
      <div className="monitoring__header">
        <h2 className="monitoring__heading">Monitoring</h2>
        <p className="monitoring__subheading">
          System health and operational metrics
        </p>
      </div>

      {error && <ErrorMessage message={error} onRetry={fetchHealth} />}

      {/* Live metrics */}
      <div className="monitoring__grid">
        <MetricCard
          title="API Health"
          value={health?.status === 'healthy' ? 'Healthy' : 'Unavailable'}
          subtitle="GET /health"
          icon={HeartPulse}
          accent={health?.status === 'healthy' ? '#059669' : '#dc2626'}
        />
        <MetricCard
          title="Prediction Count"
          value={predictionCount}
          subtitle="Browser-local total"
          icon={Hash}
          accent="#6366f1"
        />
        <MetricCard
          title="Request Latency"
          value="—"
          subtitle="Pending Prometheus integration"
          icon={Clock}
          accent="#94a3b8"
        />
        <MetricCard
          title="API Errors"
          value="—"
          subtitle="Pending Prometheus integration"
          icon={AlertCircle}
          accent="#94a3b8"
        />
      </div>

      {/* Recent Activity */}
      <div className="monitoring__section">
        <h3 className="monitoring__section-title">
          <Activity size={16} style={{ marginRight: 6 }} />
          Recent Activity
        </h3>
        {history.length === 0 ? (
          <div className="monitoring__empty-activity">
            No recent predictions. Activity will appear here as predictions are made.
          </div>
        ) : (
          <div className="monitoring__activity-list">
            {[...history].reverse().slice(0, 8).map((item, i) => (
              <div key={i} className="monitoring__activity-item">
                <div className="monitoring__activity-dot" />
                <div className="monitoring__activity-content">
                  <span className="monitoring__activity-text">
                    Predicted <strong>{item.predicted_species}</strong>
                  </span>
                  <span className="monitoring__activity-time">
                    {new Date(item.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Prometheus / Grafana placeholder */}
      <div className="monitoring__section">
        <h3 className="monitoring__section-title">
          <BarChart3 size={16} style={{ marginRight: 6 }} />
          Advanced Monitoring
        </h3>
        <div className="monitoring__integration-placeholder">
          <div className="monitoring__integration-card">
            <div className="monitoring__integration-icon">
              <Activity size={32} strokeWidth={1} />
            </div>
            <h4>Prometheus Metrics</h4>
            <p>
              Request latency histograms, error rate counters, and prediction throughput metrics
              will be available once the FastAPI backend is instrumented with
              <code> prometheus-fastapi-instrumentator</code>.
            </p>
            <span className="monitoring__integration-status">Integration Pending</span>
          </div>
          <div className="monitoring__integration-card">
            <div className="monitoring__integration-icon">
              <ExternalLink size={32} strokeWidth={1} />
            </div>
            <h4>Grafana Dashboards</h4>
            <p>
              Interactive dashboards for visualizing time-series metrics, setting alerts,
              and monitoring model serving performance will be embedded here once Grafana
              is configured.
            </p>
            <span className="monitoring__integration-status">Integration Pending</span>
          </div>
        </div>
      </div>
    </div>
  );
}
