import json
import asyncio
from fastapi import APIRouter, Depends, HTTPException, Request
from sse_starlette.sse import EventSourceResponse
from langchain_core.messages import HumanMessage
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.models.schemas import ChatRequest
from app.database.mongodb import get_database
from app.middleware.auth import get_current_user
from app.services.user_service import get_user_preferences
from app.graph.graph import get_compiled_graph

router = APIRouter()

@router.post("/chat")
async def chat_endpoint(
    request: ChatRequest, 
    req: Request, 
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    user_id = str(current_user["_id"])
    thread_id = request.thread_id
    message = request.message
    
    async def event_generator():
        try:
            # 1. Load User Profile Preferences
            profile = await get_user_preferences(db, user_id) or {}
            
            # The structure of profile comes from the DB directly now
            profile_dict = {
                "name": current_user.get("name", "Traveler"),
                "favorite_destinations": profile.get("favorite_destinations", []),
                "budget_preference": profile.get("budget_preference"),
                "food_preference": profile.get("food_preference"),
                "traveler_type": profile.get("traveler_type"),
                "seat_preference": profile.get("seat_preference")
            }

            # 2. Setup Graph and Stream
            async with get_compiled_graph() as graph:
                config = {"configurable": {"thread_id": thread_id}}
                
                # The initial state payload
                input_state = {
                    "messages": [HumanMessage(content=message)],
                    "user_id": user_id,
                    "thread_id": thread_id,
                    "user_profile": profile_dict
                }
                
                # 3. Stream graph execution
                async for event in graph.astream_events(input_state, config, version="v1"):
                    if event["event"] == "on_chat_model_stream":
                        chunk = event["data"]["chunk"]
                        if getattr(chunk, 'content', None):
                            yield {
                                "event": "message",
                                "data": json.dumps({"type": "token", "content": chunk.content})
                            }
                    elif event["event"] == "on_tool_end":
                        tool_name = event["name"]
                        if tool_name in ["get_weather", "search_travel_info"]:
                            output = event["data"]["output"]
                            yield {
                                "event": "message",
                                "data": json.dumps({"type": "tool_data", "tool": tool_name, "data": json.loads(output)})
                            }
                            
                yield {
                    "event": "message",
                    "data": json.dumps({"type": "done"})
                }
                
        except Exception as e:
            yield {
                "event": "error",
                "data": json.dumps({"error": str(e)})
            }
            
    return EventSourceResponse(event_generator())
