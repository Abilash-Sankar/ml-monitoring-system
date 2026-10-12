/**
 * Centralized API service for the ML Monitoring Platform.
 * All backend requests go through this module.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

/**
 * Check backend health status.
 * @returns {Promise<{status: string, model_loaded: boolean}>}
 */
export async function checkHealth() {
  const response = await fetch(`${API_BASE_URL}/health`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`Health check failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

/**
 * Send a prediction request to the backend.
 * @param {{sepal_length: number, sepal_width: number, petal_length: number, petal_width: number}} input
 * @returns {Promise<{predicted_species: string, probabilities: Record<string, number>}>}
 */
export async function predictSpecies(input) {
  const response = await fetch(`${API_BASE_URL}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const errorBody = await response.text();
    let message = `Prediction failed: ${response.status} ${response.statusText}`;
    try {
      const parsed = JSON.parse(errorBody);
      if (parsed.detail) {
        message = typeof parsed.detail === 'string'
          ? parsed.detail
          : JSON.stringify(parsed.detail);
      }
    } catch {
      // Use generic message
    }
    throw new Error(message);
  }
  return response.json();
}
