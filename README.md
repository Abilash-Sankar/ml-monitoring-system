# ML Monitoring Platform

A full-stack Iris classification demo with a FastAPI backend, SQLite prediction history, and a React dashboard.

## Requirements

- Python 3.11 or newer
- Node.js 22 or newer

## Run locally

From the project root, install the Python dependencies and train the model:

```powershell
python -m pip install -r Requirements.txt
python train_model.py
```

Start the API in one terminal:

```powershell
cd backend
python -m uvicorn main:app --reload
```

Start the frontend in another terminal:

```powershell
cd frontend
npm ci
npm run dev
```

Open the local URL printed by Vite. The API is available at `http://127.0.0.1:8000`; its interactive API documentation is at `/docs`.

## Run checks

Install development dependencies and run the API tests:

```powershell
python -m pip install -r requirements-dev.txt
python -m pytest
```

Run the frontend lint and production build:

```powershell
cd frontend
npm ci
npm run lint
npm run build
```

GitHub Actions runs the backend tests and frontend lint/build on pushes to `main` and pull requests.