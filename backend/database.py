"""
SQLite database module for storing prediction history.
"""

import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "data" / "predictions.db"


def get_connection():
    """Get a SQLite connection with row factory."""
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def init_db():
    """Create tables if they don't exist."""
    conn = get_connection()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sepal_length REAL NOT NULL,
            sepal_width REAL NOT NULL,
            petal_length REAL NOT NULL,
            petal_width REAL NOT NULL,
            predicted_species TEXT NOT NULL,
            confidence REAL NOT NULL,
            prob_setosa REAL NOT NULL,
            prob_versicolor REAL NOT NULL,
            prob_virginica REAL NOT NULL,
            latency_ms REAL,
            created_at TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()


def save_prediction(data: dict) -> dict:
    """Save a prediction record and return it with its ID."""
    conn = get_connection()
    cursor = conn.execute(
        """
        INSERT INTO predictions
        (sepal_length, sepal_width, petal_length, petal_width,
         predicted_species, confidence, prob_setosa, prob_versicolor, prob_virginica,
         latency_ms, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            data["sepal_length"],
            data["sepal_width"],
            data["petal_length"],
            data["petal_width"],
            data["predicted_species"],
            data["confidence"],
            data["prob_setosa"],
            data["prob_versicolor"],
            data["prob_virginica"],
            data.get("latency_ms"),
            data["created_at"],
        ),
    )
    conn.commit()
    record_id = cursor.lastrowid
    conn.close()
    return {**data, "id": record_id}


def get_predictions(page: int = 1, per_page: int = 20, species: str = None):
    """Get paginated predictions, newest first."""
    conn = get_connection()

    where = ""
    params = []
    if species:
        where = "WHERE predicted_species = ?"
        params.append(species)

    # Count total
    total = conn.execute(
        f"SELECT COUNT(*) FROM predictions {where}", params
    ).fetchone()[0]

    # Fetch page
    offset = (page - 1) * per_page
    rows = conn.execute(
        f"""
        SELECT * FROM predictions {where}
        ORDER BY id DESC
        LIMIT ? OFFSET ?
        """,
        params + [per_page, offset],
    ).fetchall()

    conn.close()

    predictions = [dict(row) for row in rows]
    total_pages = max(1, -(-total // per_page))  # ceiling division

    return {
        "predictions": predictions,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages,
    }


def get_prediction_stats():
    """Get aggregate prediction statistics."""
    conn = get_connection()

    total = conn.execute("SELECT COUNT(*) FROM predictions").fetchone()[0]

    species_dist = {}
    for row in conn.execute(
        "SELECT predicted_species, COUNT(*) as cnt FROM predictions GROUP BY predicted_species"
    ).fetchall():
        species_dist[row["predicted_species"]] = row["cnt"]

    avg_confidence = conn.execute(
        "SELECT AVG(confidence) FROM predictions"
    ).fetchone()[0]

    avg_latency = conn.execute(
        "SELECT AVG(latency_ms) FROM predictions WHERE latency_ms IS NOT NULL"
    ).fetchone()[0]

    recent = conn.execute(
        "SELECT * FROM predictions ORDER BY id DESC LIMIT 5"
    ).fetchall()

    conn.close()

    return {
        "total_predictions": total,
        "species_distribution": species_dist,
        "avg_confidence": round(avg_confidence, 4) if avg_confidence else 0,
        "avg_latency_ms": round(avg_latency, 2) if avg_latency else None,
        "recent_predictions": [dict(r) for r in recent],
    }


def delete_prediction(prediction_id: int) -> bool:
    """Delete a single prediction. Returns True if deleted."""
    conn = get_connection()
    cursor = conn.execute("DELETE FROM predictions WHERE id = ?", (prediction_id,))
    conn.commit()
    deleted = cursor.rowcount > 0
    conn.close()
    return deleted


def clear_predictions() -> int:
    """Delete all predictions. Returns count deleted."""
    conn = get_connection()
    cursor = conn.execute("DELETE FROM predictions")
    conn.commit()
    count = cursor.rowcount
    conn.close()
    return count
