import { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { CheckCircle, XCircle, Loader, RefreshCw } from 'lucide-react';
import { checkHealth } from '../services/api';
import './Topbar.css';

const pageTitles = {
  '/': 'Dashboard',
  '/predict': 'Prediction Studio',
  '/history': 'Prediction History',
  '/model': 'Model Information',
  '/monitoring': 'Monitoring',
};

export default function Topbar() {
  const location = useLocation();
  const [health, setHealth] = useState({ status: 'loading', model_loaded: false });

  const fetchHealth = useCallback(async () => {
    try {
      const data = await checkHealth();
      setHealth({ ...data, status: data.status || 'healthy' });
    } catch {
      setHealth({ status: 'unavailable', model_loaded: false });
    }
  }, []);

  useEffect(() => {
    let active = true;
    const updateHealth = async () => {
      try {
        const data = await checkHealth();
        if (active) setHealth({ ...data, status: data.status || 'healthy' });
      } catch {
        if (active) setHealth({ status: 'unavailable', model_loaded: false });
      }
    };

    updateHealth();
    const intervalId = setInterval(updateHealth, 30000);
    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, []);

  const title = pageTitles[location.pathname] || 'Dashboard';

  const statusConfig = {
    loading: { icon: Loader, text: 'Checking...', className: 'topbar__status--loading' },
    healthy: { icon: CheckCircle, text: 'API Healthy', className: 'topbar__status--healthy' },
    unavailable: { icon: XCircle, text: 'API Unavailable', className: 'topbar__status--error' },
  };

  const cfg = statusConfig[health.status] || statusConfig.unavailable;
  const StatusIcon = cfg.icon;

  return (
    <header className="topbar">
      <div className="topbar__left">
        <h1 className="topbar__title">{title}</h1>
        <span className="topbar__breadcrumb">ModelScope / {title}</span>
      </div>
      <div className="topbar__right">
        <div className={`topbar__status ${cfg.className}`}>
          <StatusIcon size={16} className={health.status === 'loading' ? 'spin' : ''} />
          <span>{cfg.text}</span>
        </div>
        {health.model_loaded && (
          <div className="topbar__model-badge">
            <span className="topbar__model-dot" />
            Model Loaded
          </div>
        )}
        <button className="topbar__refresh-btn" onClick={fetchHealth} title="Refresh health status" aria-label="Refresh health status">
          <RefreshCw size={16} />
        </button>
      </div>
    </header>
  );
}
