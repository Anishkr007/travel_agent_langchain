from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from app.utils.object_id import doc_to_json

async def get_user_by_email(db: AsyncIOMotorDatabase, email: str) -> dict | None:
    user = await db.users.find_one({"email": email})
    return doc_to_json(user)

async def get_user_by_id(db: AsyncIOMotorDatabase, user_id: str) -> dict | None:
    try:
        oid = ObjectId(user_id)
    except Exception:
        return None
    user = await db.users.find_one({"_id": oid})
    return doc_to_json(user)

async def create_user(db: AsyncIOMotorDatabase, user_data: dict) -> str:
    result = await db.users.insert_one(user_data)
    # create default preferences
    await db.preferences.insert_one({"user_id": result.inserted_id})
    return str(result.inserted_id)

async def get_user_preferences(db: AsyncIOMotorDatabase, user_id: str) -> dict | None:
    try:
        oid = ObjectId(user_id)
    except Exception:
        return None
    prefs = await db.preferences.find_one({"user_id": oid})
    return doc_to_json(prefs)

async def update_user_preferences(db: AsyncIOMotorDatabase, user_id: str, updates: dict) -> bool:
    try:
        oid = ObjectId(user_id)
    except Exception:
        return False
    result = await db.preferences.update_one(
        {"user_id": oid},
        {"$set": updates}
    )
    return result.modified_count > 0

async def store_refresh_token(db: AsyncIOMotorDatabase, user_id: str, token_hash: str, expires_at):
    try:
        oid = ObjectId(user_id)
    except Exception:
        return
    await db.refresh_tokens.insert_one({
        "user_id": oid,
        "token_hash": token_hash,
        "expires_at": expires_at,
        "revoked": False
    })

async def get_refresh_token(db: AsyncIOMotorDatabase, token_hash: str):
    token_doc = await db.refresh_tokens.find_one({"token_hash": token_hash, "revoked": False})
    return doc_to_json(token_doc)

async def revoke_refresh_token(db: AsyncIOMotorDatabase, token_hash: str):
    await db.refresh_tokens.update_one(
        {"token_hash": token_hash},
        {"$set": {"revoked": True}}
    )
