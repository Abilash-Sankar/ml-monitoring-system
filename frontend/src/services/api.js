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

/**
 * Fetch aggregated prediction statistics from the backend database.
 * @returns {Promise<{total_predictions: number, species_distribution: Record<string, number>, avg_confidence: number, avg_latency_ms: number|null, recent_predictions: Array}>}
 */
export async function fetchPredictionStats() {
  const response = await fetch(`${API_BASE_URL}/predictions/stats`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch prediction stats: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

/**
 * Fetch paginated prediction history from the backend.
 * @param {{page?: number, per_page?: number, species?: string}} params
 * @returns {Promise<{predictions: Array, total: number, page: number, per_page: number, total_pages: number}>}
 */
export async function fetchPredictions(params = {}) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', params.page);
  if (params.per_page) searchParams.set('per_page', params.per_page);
  if (params.species) searchParams.set('species', params.species);
  const qs = searchParams.toString();
  const url = `${API_BASE_URL}/predictions${qs ? `?${qs}` : ''}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch predictions: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

/**
 * Fetch raw Prometheus metrics text from the backend /metrics endpoint.
 * @returns {Promise<string>} Prometheus exposition format text
 */
export async function fetchRawMetrics() {
  const response = await fetch(`${API_BASE_URL}/metrics`);
  if (!response.ok) {
    throw new Error(`Failed to fetch metrics: ${response.status} ${response.statusText}`);
  }
  return response.text();
}
