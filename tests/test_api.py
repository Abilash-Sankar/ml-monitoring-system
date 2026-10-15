import sys
import tempfile
from pathlib import Path

from fastapi.testclient import TestClient
import pytest


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

import database

_TEST_DATABASE_DIR = tempfile.TemporaryDirectory(prefix="ml-monitoring-tests-")
database.DB_PATH = Path(_TEST_DATABASE_DIR.name) / "predictions.db"

import main


@pytest.fixture
def client():
    database.clear_predictions()
    with TestClient(main.app) as test_client:
        yield test_client


def make_prediction(client, **overrides):
    payload = {
        "sepal_length": 5.1,
        "sepal_width": 3.5,
        "petal_length": 1.4,
        "petal_width": 0.2,
    }
    payload.update(overrides)
    return client.post("/predict", json=payload)


def test_health_reports_model_ready(client):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "healthy", "model_loaded": True}


def test_predict_returns_probabilities_and_saves_history(client):
    response = make_prediction(client)

    assert response.status_code == 200
    result = response.json()
    assert result["predicted_species"] == "setosa"
    assert set(result["probabilities"]) == {"setosa", "versicolor", "virginica"}
    assert sum(result["probabilities"].values()) == pytest.approx(1.0)
    assert result["confidence"] == max(result["probabilities"].values())

    history = client.get("/predictions").json()
    assert history["total"] == 1
    assert history["predictions"][0]["id"] == result["id"]
    assert history["predictions"][0]["predicted_species"] == "setosa"


@pytest.mark.parametrize(
    "payload",
    [
        {"sepal_length": 0, "sepal_width": 3.5, "petal_length": 1.4, "petal_width": 0.2},
        {"sepal_length": 10.1, "sepal_width": 3.5, "petal_length": 1.4, "petal_width": 0.2},
        {"sepal_length": 5.1, "sepal_width": 3.5, "petal_length": 1.4},
    ],
)
def test_predict_rejects_invalid_input(client, payload):
    response = client.post("/predict", json=payload)

    assert response.status_code == 422


def test_prediction_history_stats_and_delete(client):
    first = make_prediction(client).json()
    second = make_prediction(
        client,
        sepal_length=6.4,
        sepal_width=3.2,
        petal_length=4.5,
        petal_width=1.5,
    ).json()

    page = client.get("/predictions", params={"page": 1, "per_page": 1})
    assert page.status_code == 200
    assert page.json()["total"] == 2
    assert page.json()["total_pages"] == 2
    assert page.json()["predictions"][0]["id"] == second["id"]

    stats = client.get("/predictions/stats").json()
    assert stats["total_predictions"] == 2
    assert sum(stats["species_distribution"].values()) == 2

    deleted = client.delete(f"/predictions/{first['id']}")
    assert deleted.status_code == 200
    assert deleted.json() == {"deleted": True}
    assert client.delete(f"/predictions/{first['id']}").status_code == 404

    cleared = client.delete("/predictions")
    assert cleared.status_code == 200
    assert cleared.json() == {"deleted": 1}
    assert client.get("/predictions").json()["total"] == 0


def test_model_metrics_are_available(client):
    response = client.get("/model/metrics")

    assert response.status_code == 200
    metrics = response.json()
    assert 0 <= metrics["accuracy"] <= 1
    assert metrics["class_names"] == ["setosa", "versicolor", "virginica"]
    assert metrics["training_samples"] > 0


def test_metrics_endpoint_and_custom_metrics(client):
    # Perform a prediction
    response = make_prediction(client)
    assert response.status_code == 200

    # Verify metrics endpoint returns Prometheus formatted metrics
    metrics_response = client.get("/metrics")
    assert metrics_response.status_code == 200
    assert "text/plain" in metrics_response.headers.get("content-type", "")
    metrics_text = metrics_response.text

    # Verify both standard instrumentator and custom ML metrics are present
    assert "http_requests_total" in metrics_text
    assert "prediction_requests_total" in metrics_text
    assert "prediction_latency_seconds" in metrics_text
    assert "species=\"setosa\"" in metrics_text
