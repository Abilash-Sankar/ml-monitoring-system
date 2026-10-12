"""
Train a Random Forest Classifier on the Iris dataset and save the model artifacts.
Run this script once to generate models/iris_model.joblib and models/class_names.joblib.
"""

import json
from pathlib import Path
from sklearn.datasets import load_iris
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import joblib

# Directories
BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "models"
MODEL_DIR.mkdir(exist_ok=True)

# Load data
iris = load_iris()
X, y = iris.data, iris.target
class_names = list(iris.target_names)  # ['setosa', 'versicolor', 'virginica']
feature_names = list(iris.feature_names)  # ['sepal length (cm)', ...]

# Split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Train
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Evaluate
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
print(f"Model Accuracy: {accuracy:.4f}")

# Compute detailed metrics
report = classification_report(y_test, y_pred, target_names=class_names, output_dict=True)
cm = confusion_matrix(y_test, y_pred)
feature_importance = model.feature_importances_

# Build metrics dict
metrics = {
    "accuracy": round(accuracy, 4),
    "precision": {name: round(report[name]["precision"], 4) for name in class_names},
    "recall": {name: round(report[name]["recall"], 4) for name in class_names},
    "f1_score": {name: round(report[name]["f1-score"], 4) for name in class_names},
    "support": {name: int(report[name]["support"]) for name in class_names},
    "confusion_matrix": cm.tolist(),
    "class_names": class_names,
    "feature_names": feature_names,
    "feature_importance": [
        {"name": name, "importance": round(float(imp), 4)}
        for name, imp in sorted(
            zip(feature_names, feature_importance),
            key=lambda x: x[1],
            reverse=True,
        )
    ],
    "training_samples": len(X_train),
    "test_samples": len(X_test),
    "n_estimators": 100,
    "dataset_stats": {
        name: {
            "mean": round(float(X[:, i].mean()), 2),
            "std": round(float(X[:, i].std()), 2),
            "min": round(float(X[:, i].min()), 2),
            "max": round(float(X[:, i].max()), 2),
        }
        for i, name in enumerate(feature_names)
    },
}

# Save
joblib.dump(model, MODEL_DIR / "iris_model.joblib")
joblib.dump(class_names, MODEL_DIR / "class_names.joblib")

with open(MODEL_DIR / "training_metrics.json", "w") as f:
    json.dump(metrics, f, indent=2)

print(f"Model saved to {MODEL_DIR / 'iris_model.joblib'}")
print(f"Class names saved to {MODEL_DIR / 'class_names.joblib'}")
print(f"Training metrics saved to {MODEL_DIR / 'training_metrics.json'}")
