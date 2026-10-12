import json
import time
from pathlib import Path
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import joblib

from database import (
    init_db,
    save_prediction,
    get_predictions,
    get_prediction_stats,
    delete_prediction,
    clear_predictions,
)

app = FastAPI(title="Iris ML Prediction API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Content-Type"],
)

# Locate saved models relative to this file
BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_DIR = BASE_DIR / "models"

model = joblib.load(MODEL_DIR / "iris_model.joblib")
class_names = joblib.load(MODEL_DIR / "class_names.joblib")

# Load training metrics if available
METRICS_PATH = MODEL_DIR / "training_metrics.json"
training_metrics = None
if METRICS_PATH.exists():
    with open(METRICS_PATH) as f:
        training_metrics = json.load(f)

# Initialize database
init_db()


class FlowerInput(BaseModel):
    sepal_length: float = Field(gt=0, le=10)
    sepal_width: float = Field(gt=0, le=10)
    petal_length: float = Field(gt=0, le=10)
    petal_width: float = Field(gt=0, le=10)


# ─── Health ──────────────────────────────────────────────────────────────────────


@app.get("/")
def home():
    return {"message": "Iris ML API is running"}


@app.get("/health")
def health():
    return {"status": "healthy", "model_loaded": True}


# ─── Prediction ──────────────────────────────────────────────────────────────────


@app.post("/predict")
def predict(flower: FlowerInput):
    start_time = time.perf_counter()

    features = [
        [
            flower.sepal_length,
            flower.sepal_width,
            flower.petal_length,
            flower.petal_width,
        ]
    ]

    prediction = int(model.predict(features)[0])
    probabilities = model.predict_proba(features)[0]

    latency_ms = round((time.perf_counter() - start_time) * 1000, 2)

    predicted_species = str(class_names[prediction])
    prob_dict = {
        str(name): round(float(prob), 4)
        for name, prob in zip(class_names, probabilities)
    }
    confidence = round(float(max(probabilities)), 4)

    now = datetime.now(timezone.utc).isoformat()

    # Save to database
    record = save_prediction(
        {
            "sepal_length": flower.sepal_length,
            "sepal_width": flower.sepal_width,
            "petal_length": flower.petal_length,
            "petal_width": flower.petal_width,
            "predicted_species": predicted_species,
            "confidence": confidence,
            "prob_setosa": prob_dict.get("setosa", 0),
            "prob_versicolor": prob_dict.get("versicolor", 0),
            "prob_virginica": prob_dict.get("virginica", 0),
            "latency_ms": latency_ms,
            "created_at": now,
        }
    )

    return {
        "id": record["id"],
        "predicted_species": predicted_species,
        "probabilities": prob_dict,
        "confidence": confidence,
        "latency_ms": latency_ms,
        "created_at": now,
    }


# ─── Prediction History ─────────────────────────────────────────────────────────


@app.get("/predictions")
def list_predictions(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    species: str = Query(None),
):
    return get_predictions(page=page, per_page=per_page, species=species)


@app.get("/predictions/stats")
def prediction_stats():
    return get_prediction_stats()


@app.delete("/predictions/{prediction_id}")
def remove_prediction(prediction_id: int):
    if not delete_prediction(prediction_id):
        raise HTTPException(status_code=404, detail="Prediction not found")
    return {"deleted": True}


@app.delete("/predictions")
def remove_all_predictions():
    count = clear_predictions()
    return {"deleted": count}


# ─── Model Metrics ───────────────────────────────────────────────────────────────


@app.get("/model/metrics")
def model_metrics():
    if not training_metrics:
        raise HTTPException(
            status_code=404,
            detail="Training metrics not found. Run train_model.py first.",
        )
    return {
        "accuracy": training_metrics["accuracy"],
        "precision": training_metrics["precision"],
        "recall": training_metrics["recall"],
        "f1_score": training_metrics["f1_score"],
        "support": training_metrics["support"],
        "confusion_matrix": training_metrics["confusion_matrix"],
        "class_names": training_metrics["class_names"],
        "training_samples": training_metrics["training_samples"],
        "test_samples": training_metrics["test_samples"],
        "n_estimators": training_metrics["n_estimators"],
    }


@app.get("/model/feature-importance")
def feature_importance():
    if not training_metrics:
        raise HTTPException(
            status_code=404,
            detail="Training metrics not found. Run train_model.py first.",
        )
    return {
        "features": training_metrics["feature_importance"],
        "feature_names": training_metrics["feature_names"],
    }


@app.get("/model/dataset-stats")
def dataset_stats():
    if not training_metrics:
        raise HTTPException(
            status_code=404,
            detail="Training metrics not found. Run train_model.py first.",
        )
    return {
        "stats": training_metrics["dataset_stats"],
        "feature_names": training_metrics["feature_names"],
    }
