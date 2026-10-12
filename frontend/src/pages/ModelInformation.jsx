import {
  Brain,
  Database,
  TreePine,
  Layers,
  Target,
  FileCode,
  HardDrive,
  Flower2,
} from 'lucide-react';
import './ModelInformation.css';

const MODEL_DETAILS = [
  { icon: Brain, label: 'Model Name', value: 'Random Forest Classifier' },
  { icon: Database, label: 'Dataset', value: 'Iris Flower Dataset (Fisher, 1936)' },
  { icon: TreePine, label: 'Algorithm', value: 'Random Forest (100 estimators)' },
  { icon: Layers, label: 'Input Features', value: '4 numeric measurements' },
  { icon: Target, label: 'Output Classes', value: '3 species' },
  { icon: FileCode, label: 'Training Script', value: 'train_model.py' },
  { icon: HardDrive, label: 'Model Artifact', value: 'models/iris_model.joblib' },
];

const FEATURES = [
  {
    name: 'Sepal Length',
    description: 'The length of the sepal (the green outer part of the flower) in centimeters. Typically ranges from 4.3 to 7.9 cm across all three species.',
    range: '4.3 – 7.9 cm',
  },
  {
    name: 'Sepal Width',
    description: 'The width of the sepal in centimeters. Typically ranges from 2.0 to 4.4 cm. Setosa tends to have wider sepals.',
    range: '2.0 – 4.4 cm',
  },
  {
    name: 'Petal Length',
    description: 'The length of the petal (the colorful inner part of the flower) in centimeters. This is the most discriminating feature, ranging from 1.0 to 6.9 cm.',
    range: '1.0 – 6.9 cm',
  },
  {
    name: 'Petal Width',
    description: 'The width of the petal in centimeters. Ranges from 0.1 to 2.5 cm. Together with petal length, this strongly separates all three species.',
    range: '0.1 – 2.5 cm',
  },
];

const SPECIES = [
  {
    name: 'Iris Setosa',
    color: '#6366f1',
    description: 'Characterized by short petals and relatively wide sepals. The most easily separable species — it has distinctly smaller petals compared to the other two.',
  },
  {
    name: 'Iris Versicolor',
    color: '#06b6d4',
    description: 'An intermediate species with medium-sized petals and sepals. It overlaps slightly with Virginica in measurement ranges, making it moderately challenging to classify.',
  },
  {
    name: 'Iris Virginica',
    color: '#f59e0b',
    description: 'Identified by the longest petals and sepals among the three species. It can overlap with Versicolor, but tends to have larger overall measurements.',
  },
];

export default function ModelInformation() {
  return (
    <div className="model-info">
      <div className="model-info__header">
        <h2 className="model-info__heading">Model Information</h2>
        <p className="model-info__subheading">
          Details about the trained machine learning model and the Iris dataset
        </p>
      </div>

      {/* Model Details */}
      <div className="model-info__section">
        <h3 className="model-info__section-title">Model Configuration</h3>
        <div className="model-info__details-grid">
          {MODEL_DETAILS.map(({ icon: Icon, label, value }) => (
            <div key={label} className="model-info__detail-item">
              <div className="model-info__detail-icon">
                <Icon size={18} strokeWidth={1.8} />
              </div>
              <div>
                <span className="model-info__detail-label">{label}</span>
                <span className="model-info__detail-value">{value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="model-info__section">
        <h3 className="model-info__section-title">Input Features</h3>
        <div className="model-info__features-grid">
          {FEATURES.map((f) => (
            <div key={f.name} className="model-info__feature-card">
              <div className="model-info__feature-header">
                <h4>{f.name}</h4>
                <span className="model-info__feature-range">{f.range}</span>
              </div>
              <p>{f.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Species */}
      <div className="model-info__section">
        <h3 className="model-info__section-title">
          <Flower2 size={18} style={{ marginRight: 6 }} />
          Iris Species
        </h3>
        <div className="model-info__species-grid">
          {SPECIES.map((s) => (
            <div key={s.name} className="model-info__species-card">
              <div className="model-info__species-dot" style={{ background: s.color }} />
              <h4 className="model-info__species-name" style={{ color: s.color }}>{s.name}</h4>
              <p>{s.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Note */}
      <div className="model-info__note">
        <strong>Note:</strong> The model was trained using the standard Iris dataset with <code>train_model.py</code>.
        Training accuracy was evaluated during training — refer to the training script output for the exact value.
        No fabricated metrics are displayed here.
      </div>
    </div>
  );
}
