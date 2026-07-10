from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from bson import ObjectId
from app.config import settings
from app.database.mongodb import get_database
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.models.domain import User
from app.utils.object_id import doc_to_json

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> dict:
    print(f"DEBUG AUTH: received token: {token[:10]}...")
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            print("DEBUG AUTH: user_id is None in payload")
            raise credentials_exception
    except JWTError as e:
        print(f"DEBUG AUTH: JWTError: {e}")
        raise credentials_exception
    
    try:
        oid = ObjectId(user_id)
    except Exception as e:
        print(f"DEBUG AUTH: ObjectId error: {e}")
        raise credentials_exception

    user = await db.users.find_one({"_id": oid})
    if user is None:
        print("DEBUG AUTH: user not found in DB")
        raise credentials_exception
    
    return doc_to_json(user)
    
    return doc_to_json(user)
