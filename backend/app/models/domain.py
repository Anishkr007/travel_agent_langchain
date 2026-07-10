from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from app.utils.object_id import PyObjectId

class MongoModel(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)

class User(MongoModel):
    email: EmailStr
    hashed_password: str
    name: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Preference(MongoModel):
    user_id: PyObjectId
    favorite_destinations: list[str] = Field(default_factory=list)
    budget_preference: Optional[str] = None
    food_preference: Optional[str] = None
    traveler_type: Optional[str] = None
    seat_preference: Optional[str] = None

class Trip(MongoModel):
    user_id: PyObjectId
    origin: Optional[str] = None
    destination: Optional[str] = None
    dates: Optional[str] = None
    budget_tier: Optional[Literal["budget", "mid-range", "luxury"]] = None
    status: str = "planning"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ItineraryDay(BaseModel):
    day_number: int
    morning: Optional[str] = None
    afternoon: Optional[str] = None
    evening: Optional[str] = None
    night: Optional[str] = None
    estimated_cost: Optional[str] = None

class Itinerary(MongoModel):
    trip_id: PyObjectId
    days: list[ItineraryDay] = Field(default_factory=list)

class ChatHistory(MongoModel):
    user_id: PyObjectId
    thread_id: str
    role: str
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Bookmark(MongoModel):
    user_id: PyObjectId
    item_type: Literal["attraction", "hotel", "restaurant"]
    item_data: dict
    source_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class RefreshToken(MongoModel):
    user_id: PyObjectId
    token_hash: str
    expires_at: datetime
    revoked: bool = False

class Session(MongoModel):
    user_id: PyObjectId
    device_info: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_active_at: datetime = Field(default_factory=datetime.utcnow)
