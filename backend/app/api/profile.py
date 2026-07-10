from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.models.schemas import UserProfileUpdate
from app.database.mongodb import get_database
from app.middleware.auth import get_current_user
from app.services.user_service import get_user_preferences, update_user_preferences

router = APIRouter()

@router.get("/{user_id}")
async def get_profile(
    user_id: str, 
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    if str(current_user["_id"]) != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this profile")
        
    profile = await get_user_preferences(db, user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
        
    # We return the profile info plus the user's name
    profile["name"] = current_user.get("name", "")
    return profile

@router.put("/{user_id}")
async def update_profile(
    user_id: str, 
    update_data: UserProfileUpdate, 
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    if str(current_user["_id"]) != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this profile")
        
    # Exclude unset fields from the update to avoid wiping out data
    updates = update_data.model_dump(exclude_unset=True)
    if not updates:
        return {"status": "success"}
        
    success = await update_user_preferences(db, user_id, updates)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to update profile")
        
    return {"status": "success"}
