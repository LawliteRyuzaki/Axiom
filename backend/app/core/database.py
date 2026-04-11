from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import get_settings
from app.core.logging import logger
from typing import Optional

_client: Optional[AsyncIOMotorClient] = None
_db: Optional[AsyncIOMotorDatabase] = None


async def connect_db() -> None:
    global _client, _db
    settings = get_settings()
    try:
        _client = AsyncIOMotorClient(
            settings.mongodb_uri,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000,
        )
        # Verify the connection is alive
        await _client.admin.command("ping")
        _db = _client[settings.mongodb_db_name]

        # Create indexes for common query patterns
        await _db.research_sessions.create_index("created_at")
        await _db.research_sessions.create_index("status")
        await _db.search_cache.create_index("query_hash", unique=True)
        await _db.search_cache.create_index(
            "created_at", expireAfterSeconds=86400  # 24h TTL on cache
        )

        logger.info("✅ MongoDB connected — db: %s", settings.mongodb_db_name)
    except Exception as exc:
        logger.error("❌ MongoDB connection failed: %s", exc)
        raise


async def disconnect_db() -> None:
    global _client
    if _client:
        _client.close()
        logger.info("MongoDB connection closed")


def get_db() -> AsyncIOMotorDatabase:
    if _db is None:
        raise RuntimeError("Database not initialised. Call connect_db() first.")
    return _db
