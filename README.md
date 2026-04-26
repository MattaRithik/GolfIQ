# GolfIQ Benchmark

A full-stack golf performance benchmarking platform that compares a player's statistics
against peer groups (handicap cohorts, college golfers, elite amateurs, and PGA Tour players)
using a machine learning model trained on real and synthesized golf data.

---

## Architecture Overview

```
golfiq-benchmark/                  ← Monorepo root
├── apps/
│   ├── api/                       ← FastAPI backend (Python)
│   │   ├── main.py
│   │   ├── routers/
│   │   ├── models/                ← Pydantic schemas
│   │   ├── db/                    ← SQLite / SQLAlchemy
│   │   └── requirements.txt
│   └── web/                       ← Next.js frontend (TypeScript)
│       ├── src/
│       │   ├── app/               ← App Router pages
│       │   ├── components/
│       │   └── lib/
│       ├── package.json
│       └── next.config.js
├── models/
│   ├── train.py                   ← Model training script
│   ├── predict.py                 ← Inference helper
│   └── artifacts/                 ← Trained model files (not committed)
├── data/
│   ├── seed/                      ← MVP benchmark CSVs (committed)
│   ├── raw/                       ← External raw datasets (not committed)
│   └── processed/                 ← Cleaned data output (not committed)
├── scripts/
│   └── data_ingestion/
│       ├── create_seed_data.py
│       ├── process_pga_dataset.py
│       └── importers/
├── packages/                      ← Shared TypeScript types / utilities
├── dev.sh                         ← One-command dev server launcher
├── docker-compose.yml             ← Optional containerized setup
└── .gitignore
```

---

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- npm 9+

### 1. Clone and navigate to the project

```bash
git clone <your-repo-url>
cd golfiq-benchmark
```

### 2. Create seed data

Generate benchmark CSVs and a demo player profile (no external data required):

```bash
python scripts/data_ingestion/create_seed_data.py
```

Files are written to `data/seed/`.

### 3. Start the backend

```bash
cd apps/api
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Backend runs at: http://localhost:8000
API docs at:     http://localhost:8000/docs

### 4. Start the frontend

Open a new terminal:

```bash
cd apps/web
npm install
npm run dev
```

Frontend runs at: http://localhost:3000

### 5. (Optional) Train the model

```bash
cd models/
python train.py
```

Artifacts are saved to `models/artifacts/`.

---

## Full Setup Instructions

### Backend (FastAPI)

```bash
cd apps/api

# Create and activate a virtual environment
python3 -m venv .venv
source .venv/bin/activate          # macOS/Linux
# .venv\Scripts\activate           # Windows PowerShell

# Install dependencies
pip install -r requirements.txt

# Start the development server with hot reload
uvicorn main:app --reload --port 8000

# To run in production mode (no reload):
# uvicorn main:app --host 0.0.0.0 --port 8000 --workers 2
```

The SQLite database (`golfiq.db`) is created automatically on first run.

### Frontend (Next.js)

```bash
cd apps/web

# Install Node dependencies
npm install

# Start the Next.js development server
npm run dev

# Build for production
npm run build
npm start
```

---

## Model Training

```bash
cd models/

# Ensure seed data exists first
python ../scripts/data_ingestion/create_seed_data.py

# Train the benchmark model
python train.py

# Run inference on a sample profile
python predict.py --profile demo
```

The training script reads from `data/seed/benchmarks.csv` and any processed files
in `data/processed/`. Trained artifacts (`.pkl`, `.pt`) are saved to `models/artifacts/`
and are excluded from version control.

---

## Environment Variables

Create `.env.local` in the project root (excluded from git):

```bash
# Backend
DATABASE_URL=sqlite:///./golfiq.db
SECRET_KEY=your-secret-key-here
CORS_ORIGINS=http://localhost:3000

# Optional: DataGolf API (for importing real data)
DATAGOLF_API_KEY=your-datagolf-api-key

# Optional: Kaggle (for downloading datasets)
KAGGLE_USERNAME=your-kaggle-username
KAGGLE_KEY=your-kaggle-api-key
```

The backend loads these via `python-dotenv` (included in requirements.txt).

---

## One-Command Dev Start

A convenience shell script starts both servers:

```bash
chmod +x dev.sh
./dev.sh
```

This creates a Python venv if needed, installs dependencies, and starts both
the backend (port 8000) and frontend (port 3000) in the background.
Press `Ctrl+C` to stop both.

---

## Docker (Optional)

```bash
# Start both services with Docker Compose
docker-compose up

# Build and start (first time or after changes)
docker-compose up --build

# Stop
docker-compose down
```

Services:
- `api` → http://localhost:8000
- `web` → http://localhost:3000

---

## Project Structure (detailed)

```
apps/api/
├── main.py               ← FastAPI app, CORS, router registration
├── routers/
│   ├── profiles.py       ← POST/GET player profiles
│   ├── rounds.py         ← POST/GET rounds and holes
│   ├── benchmarks.py     ← GET benchmark comparisons
│   └── analysis.py       ← POST run ML analysis
├── models/
│   ├── profile.py        ← Pydantic models for player profiles
│   ├── round.py          ← Pydantic models for rounds/holes
│   └── benchmark.py      ← Pydantic models for benchmarks
├── db/
│   ├── database.py       ← SQLAlchemy engine/session
│   └── crud.py           ← Database operations
├── ml/
│   └── inference.py      ← Loads model artifact, runs predictions
└── requirements.txt

apps/web/
├── src/
│   ├── app/
│   │   ├── page.tsx          ← Home / dashboard
│   │   ├── profile/page.tsx  ← Profile input
│   │   ├── rounds/page.tsx   ← Round entry
│   │   └── analysis/page.tsx ← Benchmark comparison results
│   ├── components/
│   │   ├── BenchmarkChart.tsx
│   │   ├── RoundForm.tsx
│   │   └── ProfileCard.tsx
│   └── lib/
│       ├── api.ts            ← Fetch wrappers for the backend
│       └── types.ts          ← Shared TypeScript interfaces
├── package.json
└── next.config.js
```

---

## Data and Legal Notes

- Data in `data/seed/` is original MVP seed estimates, not official statistics.
  Source label: `"MVP Seed Data - Not Official Statistics"`
- External golf datasets must be individually reviewed for their license terms
  before being placed in `data/raw/`.
- The project does not include any scrapers for live golf statistics websites.
  See `scripts/data_ingestion/importers/approved_sources_template.py` for
  the approved pathway to adding external data sources.
- Legitimate data sources: [DataGolf.com API](https://datagolf.com/api-access),
  [Kaggle golf datasets](https://www.kaggle.com/search?q=pga+tour+statistics),
  [PGA Tour ShotLink](https://www.pgatour.com/stats/shotlinkintelligence) (license required).

---

## Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Frontend    | Next.js 14, TypeScript, Tailwind CSS |
| Backend     | FastAPI, Python 3.11, Pydantic v2   |
| Database    | SQLite (dev), PostgreSQL-ready      |
| ML          | scikit-learn / PyTorch              |
| ORM         | SQLAlchemy 2.x                      |
| Packaging   | npm workspaces, pip + venv          |
| Dev tooling | uvicorn, ESLint, Prettier           |
| Container   | Docker Compose (optional)           |
