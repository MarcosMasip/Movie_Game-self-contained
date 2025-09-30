# 🎬 Movie Game — Fullstack (FastAPI + React) — Self‑Contained Runbook

This repository contains a small fullstack project for a movie production simulation:
- Backend: FastAPI with a bundled SQLite database.
- Frontend: React (Create React App). A minimal UI is included to demonstrate API usage.

You can run this project locally without Docker or via Docker Compose. This README provides step‑by‑step commands with expected outcomes for macOS, Linux, and Windows (PowerShell).

Screenshots show example queries and the server running:
- ![Movie Query](./Screenshot_2025-07-03_180629.png)
- ![Producer Query](./Screenshot_2025-07-03_180650.png)
- ![API running](./Screenshot_2025-07-03_180734.png)

---

## 📦 What’s in this repo

- `backend/`
    - `main.py`: FastAPI app (primary server)
    - `Movies_Game_Table_2.db`: SQLite database shipped with the repo
    - `Dockerfile`: Container config for the backend
- `frontend/`
    - `package.json`: CRA app definition (uses `react-scripts`)
    - `public/index.html`: App root
    - `src/`: Minimal React app (entry + component + CSS)
    - `Dockerfile`: Container config for the frontend (serves production build)
- `docker-compose.yml`: Simple 2‑service compose (backend + frontend)

Notes:
- The backend exposes working endpoints (see Swagger docs). The UI loads and makes sample requests; some UI actions may call endpoints not yet implemented. This is expected and does not affect startup or stability.

---

## ✅ Requirements

- Backend: Python 3.10+ (3.11 recommended)
- Frontend: Node.js 18+ and npm
- Optional: Docker and Docker Compose

---

## 🚀 Quick Start (no Docker)

This is the fastest way to get the API running and see the UI locally.

### 1) Clone the repo

macOS/Linux/Windows (PowerShell):
```bash
git clone https://github.com/MarcosMasip/Movie_Game-self-contained.git
cd Movie_Game-self-contained
```
Expected outcome:
- Repo files are present; you are at the project root.

### 2) Start the Backend (FastAPI)

macOS/Linux:
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install fastapi uvicorn pydantic
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Windows (PowerShell):
```powershell
cd backend
py -3 -m venv .venv
.venv\Scripts\Activate.ps1
pip install fastapi uvicorn pydantic
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Expected outcome:
- Terminal shows: “Uvicorn running on http://0.0.0.0:8000” and “Application startup complete.”
- Open http://localhost:8000/docs to interact with the API (try GET /movies, GET /actors, GET /producers, POST /movies/generate_random).
- Leave this terminal running while you start the frontend.

### 3) Start the Frontend (React dev server)

In a new terminal window/tab:

macOS/Linux/Windows (PowerShell):
```bash
cd frontend
npm install
npm start
```
Expected outcome:
- CRA dev server starts and opens http://localhost:3000.
- The UI loads and you can navigate. Some UI actions may call endpoints not present yet; these may show 404 responses in the browser console. This is expected and doesn’t indicate a startup error.

---

## � Run with Docker Compose (optional)

If you prefer containers, use this. The compose file builds a backend image and a production frontend image and connects them.

1) Ensure Docker Desktop (Windows/macOS) or Docker Engine (Linux) is installed and running.

2) From repo root, build images:
```bash
docker compose build
```
Expected outcome:
- Backend image builds (installs FastAPI/Uvicorn) and exposes 8000.
- Frontend image builds (npm install, npm run build, serve) and exposes 3000.

3) Start services:
```bash
docker compose up
```
Expected outcome:
- backend: “Uvicorn running on 0.0.0.0:8000”.
- frontend: static site served at 0.0.0.0:3000.
- Open http://localhost:8000/docs and http://localhost:3000.

Tips:
- First time builds may take a few minutes while images and packages download.

---

## 🧪 Validate it’s working

- Backend health (browser): http://localhost:8000/docs
    - Expected: Interactive Swagger UI. Try “Try it out” on GET /movies (should return a JSON list) and POST /movies/generate_random (should return a newly created movie).

- Frontend health (browser): http://localhost:3000
    - Expected: Page loads and renders. Some dropdowns may be empty or actions may show 404s if an endpoint isn’t implemented yet; that’s expected for this demo UI.

---

## 🧹 Shutdown and Cleanup

Non‑Docker:
- Frontend dev server: Press Ctrl+C in the frontend terminal to stop.
- Backend (Uvicorn): Press Ctrl+C in the backend terminal to stop. If you used a venv, deactivate it with `deactivate` (macOS/Linux) or `deactivate` (PowerShell).
- Optional local cleanup:
    - Remove Python venv: delete the `backend/.venv` folder.
    - Clear node modules: from `frontend/`, run `rm -rf node_modules` (macOS/Linux) or `rmdir /s /q node_modules` (PowerShell) if desired.

Docker:
- Stop services: in the compose terminal, press Ctrl+C.
- Or from a new terminal:
    ```bash
    docker compose down
    ```
- Optional image/cache cleanup (careful: removes unused data):
    ```bash
    docker system prune -f
    ```

---

## 🛠️ Troubleshooting

- Port already in use:
    - Backend: something else is on 8000. Stop it or run `uvicorn main:app --port 8001` and access http://localhost:8001/docs.
    - Frontend: something else on 3000. CRA will prompt to use 3001; accept it.

- Windows PowerShell activation policy prevents venv activation:
    - Run PowerShell as Administrator and execute: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.

- Frontend build/deps warnings (npm audit/deprecations):
    - These do not block local development. For production hardening you may run `npm audit fix`, but it may introduce breaking changes.

---

## � License

MIT License — free to use, modify, and distribute.

© 2025 Marcos Masip
