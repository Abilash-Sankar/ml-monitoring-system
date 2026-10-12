import { useState, useRef } from 'react';
import { FlaskConical, RotateCcw, Loader } from 'lucide-react';
import ProbabilityChart from '../components/ProbabilityChart';
import ErrorMessage from '../components/ErrorMessage';
import { predictSpecies } from '../services/api';
import './PredictionStudio.css';

const HISTORY_KEY = 'modelscope_predictions';

const FIELDS = [
  { name: 'sepal_length', label: 'Sepal Length', unit: 'cm', placeholder: '5.1', example: 5.1 },
  { name: 'sepal_width', label: 'Sepal Width', unit: 'cm', placeholder: '3.5', example: 3.5 },
  { name: 'petal_length', label: 'Petal Length', unit: 'cm', placeholder: '1.4', example: 1.4 },
  { name: 'petal_width', label: 'Petal Width', unit: 'cm', placeholder: '0.2', example: 0.2 },
];

const INITIAL_VALUES = { sepal_length: '', sepal_width: '', petal_length: '', petal_width: '' };

function validate(values) {
  const errors = {};
  FIELDS.forEach(({ name, label }) => {
    const v = values[name];
    if (v === '' || v === null || v === undefined) {
      errors[name] = `${label} is required`;
    } else if (isNaN(Number(v)) || Number(v) <= 0) {
      errors[name] = `${label} must be a positive number`;
    } else if (Number(v) > 10) {
      errors[name] = `${label} must be ≤ 10`;
    }
  });
  return errors;
}

export default function PredictionStudio() {
  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [apiError, setApiError] = useState(null);
  const submitRef = useRef(false);

  const handleChange = (name, raw) => {
    setValues(prev => ({ ...prev, [name]: raw }));
    // Clear field error on change
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleReset = () => {
    setValues(INITIAL_VALUES);
    setErrors({});
    setResult(null);
    setApiError(null);
  };

  const handleLoadExample = () => {
    const example = {};
    FIELDS.forEach(f => { example[f.name] = String(f.example); });
    setValues(example);
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitRef.current) return; // prevent duplicate

    const validationErrors = validate(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    submitRef.current = true;
    setLoading(true);
    setApiError(null);
    setResult(null);

    const input = {
      sepal_length: Number(values.sepal_length),
      sepal_width: Number(values.sepal_width),
      petal_length: Number(values.petal_length),
      petal_width: Number(values.petal_width),
    };

    try {
      const data = await predictSpecies(input);
      const timestamp = new Date().toISOString();
      const record = { ...data, input, timestamp };
      setResult(record);

      // Save to localStorage
      const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      history.push(record);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
      submitRef.current = false;
    }
  };

  return (
    <div className="prediction-studio">
      <div className="prediction-studio__header">
        <h2 className="prediction-studio__heading">Prediction Studio</h2>
        <p className="prediction-studio__subheading">
          Enter Iris flower measurements to classify the species using the Random Forest model
        </p>
      </div>

      <div className="prediction-studio__layout">
        {/* Input Panel */}
        <div className="prediction-studio__input-panel">
          <div className="prediction-studio__panel-header">
            <h3>Input Measurements</h3>
            <button type="button" className="prediction-studio__example-btn" onClick={handleLoadExample}>
              Load Example
            </button>
          </div>

          <form onSubmit={handleSubmit} className="prediction-studio__form" noValidate>
            {FIELDS.map(({ name, label, unit, placeholder }) => (
              <div key={name} className={`prediction-studio__field ${errors[name] ? 'prediction-studio__field--error' : ''}`}>
                <label htmlFor={`input-${name}`} className="prediction-studio__label">
                  {label} <span className="prediction-studio__unit">({unit})</span>
                </label>
                <input
                  id={`input-${name}`}
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="10"
                  placeholder={placeholder}
                  value={values[name]}
                  onChange={(e) => handleChange(name, e.target.value)}
                  className="prediction-studio__input"
                  disabled={loading}
                  autoComplete="off"
                />
                {errors[name] && (
                  <span className="prediction-studio__error-msg">{errors[name]}</span>
                )}
              </div>
            ))}

            <div className="prediction-studio__actions">
              <button
                type="button"
                className="prediction-studio__btn prediction-studio__btn--reset"
                onClick={handleReset}
                disabled={loading}
              >
                <RotateCcw size={16} />
                Reset
              </button>
              <button
                type="submit"
                className="prediction-studio__btn prediction-studio__btn--submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader size={16} className="spin" />
                    Predicting...
                  </>
                ) : (
                  <>
                    <FlaskConical size={16} />
                    Predict Species
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Result Panel */}
        <div className="prediction-studio__result-panel">
          {apiError && <ErrorMessage message={apiError} />}

          {!result && !apiError && (
            <div className="prediction-studio__empty-result">
              <FlaskConical size={48} strokeWidth={1} />
              <p>Submit measurements to see prediction results</p>
            </div>
          )}

          {result && (
            <div className="prediction-studio__result" key={result.timestamp}>
              <div className="prediction-studio__result-badge">
                <span className="prediction-studio__result-label">Predicted Species</span>
                <span className="prediction-studio__result-species">{result.predicted_species}</span>
              </div>

              <ProbabilityChart probabilities={result.probabilities} />

              <div className="prediction-studio__result-inputs">
                <h4>Submitted Measurements</h4>
                <div className="prediction-studio__result-inputs-grid">
                  {FIELDS.map(({ name, label, unit }) => (
                    <div key={name} className="prediction-studio__result-input-item">
                      <span className="prediction-studio__result-input-label">{label}</span>
                      <span className="prediction-studio__result-input-value">
                        {result.input[name]} {unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="prediction-studio__result-timestamp">
                Predicted at {new Date(result.timestamp).toLocaleString()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
