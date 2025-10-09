
# RMP-Style Backend (Update 3)

This is a minimal FastAPI + SQLAlchemy backend for your Rate-My-Professor–style project.
It includes: models, auth (JWT), core endpoints, and a seed script that loads your **GSU professors CSV**.

## Quickstart (VS Code)

1. **Clone or unzip** this folder into your machine and open it in **VS Code**.
2. Create and activate a virtual environment:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate  # Windows: .venv\Scripts\activate
   ```
3. Install deps:
   ```bash
   pip install -r requirements.txt
   ```
4. Create `.env` from the example and (optionally) change defaults:
   ```bash
   cp .env.example .env
   # leave DATABASE_URL as sqlite for local dev
   ```
5. **Initialize DB and run the API**:
   ```bash
   uvicorn app.main:app --reload
   ```
   Visit **http://127.0.0.1:8000/docs** for Swagger UI.

6. **Seed with your CSV** (already included as `data/professors_gsu.csv`):
   ```bash
   python -m app.seed data/professors_gsu.csv
   ```

7. Test a few endpoints in Swagger UI:
   - `GET /health`
   - `GET /schools/1/professors?level=UG`
   - `POST /auth/register` (use a **@gsu.edu** email, e.g., you@gsu.edu)
   - `POST /auth/login` → copy token
   - Auth-only: `POST /professors/{id}/ratings` with token

## Move to Postgres (optional)
- Set `DATABASE_URL=postgresql+psycopg2://USER:PASS@HOST:PORT/DBNAME` in `.env`
- Install `psycopg2-binary`
- Re-run `uvicorn` and the tables will be created automatically on start (dev mode).

## Project Structure
```
app/
  api/endpoints/ (auth, schools, professors, ratings)
  core/ (config)
  models/ (orm models)
  utils/ (security)
  main.py
data/
  professors_gsu.csv
```

> **Note:** For Update 3, we create tables automatically on startup for simplicity.
Alembic migrations can be added in Update 4/5.
