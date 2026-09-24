from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent / ".env")

import os
import logging
import asyncio
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware

from routes import api_router, _cleanup_old_jobs
import auth
from db import ensure_job_indexes

logging.basicConfig(level=logging.INFO)

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    logging.info("Starting up Sprint-Forge server...")
    await auth.seed_admin()
    await _cleanup_old_jobs()
    yield
    logging.info("Shutting down Sprint-Forge server...")

app = FastAPI(title="AI Dynamic Sprint Planning Assistant", lifespan=lifespan)
app.include_router(api_router)

frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
allowed_origins = list(dict.fromkeys([
    frontend_url,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:3002",
    "http://127.0.0.1:3002",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
]))

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def timeout_middleware(request: Request, call_next):
    """
    Long-running endpoints like LLM calls should return quickly.
    This ensures background jobs complete without blocking.
    """
    try:
        if "/srs/" in request.url.path and request.method == "POST":
            task = asyncio.create_task(call_next(request))
            return await asyncio.wait_for(task, timeout=10.0)
        
        return await call_next(request)
    except asyncio.TimeoutError:
        return JSONResponse(
            content={"error": "Request timeout - job submitted for background processing"},
            status_code=202  # Accepted
        )

@app.get("/")
async def root():
    return {"status": "ok", "app": "AI Dynamic Sprint Planning Assistant"}

@app.get("/api/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", "8080"))
    uvicorn.run("server:app", host="127.0.0.1", port=port, reload=False)

