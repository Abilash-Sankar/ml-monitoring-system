import { AlertTriangle } from 'lucide-react';
import './ErrorMessage.css';

/**
 * Error display component with optional retry action.
 * @param {{message: string, onRetry?: () => void}} props
 */
export default function ErrorMessage({ message, onRetry }) {
  return (
    <div className="error-message">
      <AlertTriangle size={24} />
      <p className="error-message__text">{message}</p>
      {onRetry && (
        <button className="error-message__retry" onClick={onRetry}>
          Try Again
        </button>
      )}
    </div>
  );
}
