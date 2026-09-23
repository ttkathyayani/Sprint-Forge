# Sprint-Forge

**Sprint-Forge** is an AI-powered Dynamic Agile Sprint Planning Assistant designed to extract requirements from SRS documents, generate structured backlogs (epics, user stories, tasks), plan sprint capacity with skill matching and optimization, and provide real-time dynamic replanning.

---

## Architecture Overview

- **Backend**: FastAPI (Python 3.10+) with async in-memory storage / MongoDB driver support, JWT authentication, and greedy/heuristic capacity planning.
- **Frontend**: React 19, Tailwind CSS, Shadcn UI components, TanStack Query, and Lucide icons.
- **Testing**: Pytest integration test suite covering end-to-end authentication, SRS backlog generation, planning, board transitions, and evaluation metrics.

---

## Getting Started

### 1. Backend Setup & Execution

#### Prerequisites
Install Python 3.10+ and install backend dependencies:
```bash
pip install -r backend/requirements.txt
```

#### Run Backend Server
To run the backend server directly:
```bash
python backend/server.py
```
The backend server will start on `http://127.0.0.1:8080`.
- API Documentation (Swagger UI): `http://127.0.0.1:8080/docs`
- Health Check: `http://127.0.0.1:8080/api/health`

Default Manager Credentials (auto-seeded on startup):
- **Email**: `manager@sprintai.com`
- **Password**: `Manager@123`

---

### 2. Frontend Setup & Execution

#### Prerequisites
Install Node.js (v18+) and npm/yarn:
```bash
cd frontend
npm install --legacy-peer-deps
```

#### Run Frontend Dev Server
```bash
npm start
```
The application will launch on `http://localhost:3000`.

---

### 3. Running Automated Tests

Run the full integration test suite with `pytest`:
```bash
python -m pytest tests/test_sprintai.py -v
```
All 14 integration tests will automatically test against the running server or spin up an internal test instance.
