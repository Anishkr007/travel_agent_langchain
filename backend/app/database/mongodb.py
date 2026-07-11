from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.config import settings
import logging

logger = logging.getLogger(__name__)

class MongoDB:
    client: AsyncIOMotorClient | None = None
    db: AsyncIOMotorDatabase | None = None

mongodb = MongoDB()

async def create_indexes(db: AsyncIOMotorDatabase):
    # Users
    await db.users.create_index("email", unique=True)
    # Trips
    await db.trips.create_index("user_id")
    # Itineraries
    await db.itineraries.create_index("trip_id")
    # Chat History
    await db.chat_history.create_index([("user_id", 1), ("thread_id", 1)])
    # Bookmarks
    await db.bookmarks.create_index("user_id")
    # Preferences
    await db.preferences.create_index("user_id", unique=True)
    # Refresh Tokens
    await db.refresh_tokens.create_index("user_id")
    await db.refresh_tokens.create_index("expires_at", expireAfterSeconds=0)
    # Sessions
    await db.sessions.create_index("last_active_at", expireAfterSeconds=86400) # 1 day TTL

async def connect_to_mongo():
    logger.info("Connecting to MongoDB...")
    try:
        # 10s server selection timeout so we don't hang forever
        mongodb.client = AsyncIOMotorClient(settings.MONGODB_URL, serverSelectionTimeoutMS=10000)
        # Force a connection attempt to fail fast if unreachable
        await mongodb.client.admin.command('ping')
        mongodb.db = mongodb.client[settings.DATABASE_NAME]
        await create_indexes(mongodb.db)
        logger.info("Connected to MongoDB!")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        # Allow the app to start so health checks pass, but log loudly
        # Or raise if we want the container to crash (Render will restart it)
        # The prompt says: "produces a clear startup error in logs instead of hanging silently"
        raise RuntimeError(f"Could not connect to MongoDB: {e}")

async def close_mongo_connection():
    if mongodb.client:
        logger.info("Closing MongoDB connection...")
        mongodb.client.close()

async def get_database() -> AsyncIOMotorDatabase:
    return mongodb.db
