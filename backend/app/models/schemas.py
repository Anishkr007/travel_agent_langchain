from pydantic import BaseModel, Field
from typing import List, Optional, Any

class UserProfileBase(BaseModel):
    name: Optional[str] = None
    favorite_destinations: List[str] = Field(default_factory=list)
    budget_preference: Optional[str] = None
    food_preference: Optional[str] = None
    travel_history: List[str] = Field(default_factory=list)
    trip_duration_preference: Optional[str] = None
    traveler_type: Optional[str] = None
    seat_preference: Optional[str] = None

class UserProfileUpdate(UserProfileBase):
    pass

class UserProfileResponse(UserProfileBase):
    user_id: str

    class Config:
        from_attributes = True

class ChatRequest(BaseModel):
    thread_id: str
    user_id: str
    message: str

class ChatResponseChunk(BaseModel):
    type: str  # "token", "tool_call", "weather", "search_results", "error", "done"
    content: Optional[str] = None
    data: Optional[Any] = None
