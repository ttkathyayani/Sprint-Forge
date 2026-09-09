import os
from motor.motor_asyncio import AsyncIOMotorClient

client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = client[os.environ["DB_NAME"]]

async def ensure_job_indexes():
    """Create indexes for faster job queries"""
    await db.srs_jobs.create_index("project_id")
    await db.srs_jobs.create_index("created_at", expireAfterSeconds=86400)  # Auto-delete after 24h
    await db.srs_jobs.create_index([("project_id", 1), ("created_at", -1)])
