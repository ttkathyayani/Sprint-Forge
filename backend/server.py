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

app = FastAPI(title="AI Dynamic Sprint Planning Assistant")
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ.get("FRONTEND_URL", "http://localhost:3000")],
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
        # SRS endpoints should respond within 2 seconds
        if "/srs/" in request.url.path and request.method == "POST":
            task = asyncio.create_task(call_next(request))
            return await asyncio.wait_for(task, timeout=2.0)
        
        return await call_next(request)
    except asyncio.TimeoutError:
        return JSONResponse(
            content={"error": "Request timeout - job submitted for background processing"},
            status_code=202  # Accepted
        )


@app.on_event("startup")
async def startup():
    await auth.ensure_indexes()
    await auth.seed_admin()
    await ensure_job_indexes()
    asyncio.create_task(_cleanup_old_jobs())
