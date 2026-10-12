import { Loader } from 'lucide-react';
import './LoadingState.css';

/**
 * Centered loading spinner with optional message.
 * @param {{message?: string}} props
 */
export default function LoadingState({ message = 'Loading...' }) {
  return (
    <div className="loading-state">
      <Loader size={28} className="loading-state__spinner" />
      <span className="loading-state__text">{message}</span>
    </div>
  );
}
