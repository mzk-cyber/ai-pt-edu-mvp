# Backend (FastAPI)

## Run

```powershell
python -m pip install -r backend/requirements.txt
python -m uvicorn backend.app.main:app --reload --port 8000
```

Open API docs at `http://127.0.0.1:8000/docs`.

## Claude (Anthropic) optional

Copy `backend/.env.example` to `backend/.env` and set `ANTHROPIC_API_KEY`.

If not set, `/attempts/{id}/feedback` will fall back to a local template response.

