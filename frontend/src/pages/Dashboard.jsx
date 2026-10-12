import { useState, useEffect, useCallback } from 'react';
import {
  Brain,
  Layers,
  Target,
  Hash,
  FlaskConical,
  HeartPulse,
} from 'lucide-react';
import MetricCard from '../components/MetricCard';
import LoadingState from '../components/LoadingState';
import ErrorMessage from '../components/ErrorMessage';
import { checkHealth } from '../services/api';
import './Dashboard.css';

const HISTORY_KEY = 'modelscope_predictions';

export default function Dashboard() {
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
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  // Read prediction history from localStorage
  const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  const totalPredictions = history.length;
  const latestPrediction = history.length > 0 ? history[history.length - 1] : null;

  if (loading) return <LoadingState message="Connecting to backend..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchHealth} />;

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <h2 className="dashboard__heading">Overview</h2>
        <p className="dashboard__subheading">Real-time model serving status and prediction summary</p>
      </div>

      <div className="dashboard__grid">
        <MetricCard
          title="Model Name"
          value="Random Forest"
          subtitle="Classifier"
          icon={Brain}
          accent="#6366f1"
        />
        <MetricCard
          title="Model Type"
          value="Classification"
          subtitle="Multi-class"
          icon={Layers}
          accent="#8b5cf6"
        />
        <MetricCard
          title="Output Classes"
          value="3"
          subtitle="setosa · versicolor · virginica"
          icon={Target}
          accent="#06b6d4"
        />
        <MetricCard
          title="Total Predictions"
          value={totalPredictions}
          subtitle={totalPredictions === 0 ? 'No predictions yet' : 'Browser-local history'}
          icon={Hash}
          accent="#f59e0b"
        />
        <MetricCard
          title="Latest Prediction"
          value={latestPrediction ? latestPrediction.predicted_species : '—'}
          subtitle={
            latestPrediction
              ? new Date(latestPrediction.timestamp).toLocaleString()
              : 'Make your first prediction'
          }
          icon={FlaskConical}
          accent="#10b981"
        />
        <MetricCard
          title="Backend Health"
          value={health?.status === 'healthy' ? 'Healthy' : 'Unavailable'}
          subtitle={health?.model_loaded ? 'Model loaded and ready' : 'Model not loaded'}
          icon={HeartPulse}
          accent={health?.status === 'healthy' ? '#059669' : '#dc2626'}
        />
      </div>

      {latestPrediction && (
        <div className="dashboard__latest-card">
          <h3 className="dashboard__latest-title">Latest Prediction Details</h3>
          <div className="dashboard__latest-grid">
            <div className="dashboard__latest-item">
              <span className="dashboard__latest-label">Species</span>
              <span className="dashboard__latest-value dashboard__latest-value--species">
                {latestPrediction.predicted_species}
              </span>
            </div>
            <div className="dashboard__latest-item">
              <span className="dashboard__latest-label">Sepal Length</span>
              <span className="dashboard__latest-value">{latestPrediction.input.sepal_length} cm</span>
            </div>
            <div className="dashboard__latest-item">
              <span className="dashboard__latest-label">Sepal Width</span>
              <span className="dashboard__latest-value">{latestPrediction.input.sepal_width} cm</span>
            </div>
            <div className="dashboard__latest-item">
              <span className="dashboard__latest-label">Petal Length</span>
              <span className="dashboard__latest-value">{latestPrediction.input.petal_length} cm</span>
            </div>
            <div className="dashboard__latest-item">
              <span className="dashboard__latest-label">Petal Width</span>
              <span className="dashboard__latest-value">{latestPrediction.input.petal_width} cm</span>
            </div>
            <div className="dashboard__latest-item">
              <span className="dashboard__latest-label">Timestamp</span>
              <span className="dashboard__latest-value">
                {new Date(latestPrediction.timestamp).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
