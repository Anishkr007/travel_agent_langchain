import json
import asyncio
from fastapi import APIRouter, Depends, HTTPException, Request
from sse_starlette.sse import EventSourceResponse
from langchain_core.messages import HumanMessage
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.models.schemas import ChatRequest
from app.database.mongodb import get_database
from app.services.user_service import get_user_preferences
from app.graph.graph import get_compiled_graph

router = APIRouter()

@router.post("/chat")
async def chat_endpoint(
    request: ChatRequest, 
    req: Request, 
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    user_id = request.user_id if getattr(request, 'user_id', None) else "guest"
    thread_id = request.thread_id if getattr(request, 'thread_id', None) else "guest"
    message = request.message
    
    async def event_generator():
        try:
            # 1. Load User Profile Preferences
            profile = await get_user_preferences(db, user_id) or {}
            
            # The structure of profile comes from the DB directly now
            profile_dict = {
                "name": "Guest",
                "favorite_destinations": profile.get("favorite_destinations", []),
                "budget_preference": profile.get("budget_preference"),
                "food_preference": profile.get("food_preference"),
                "traveler_type": profile.get("traveler_type"),
                "seat_preference": profile.get("seat_preference")
            }

            # 2. Setup Graph and Stream
            async with get_compiled_graph() as graph:
                # Use "production" tag if not running locally, but here we just use "dev" as default for this example unless env var IS_PROD is used.
                is_prod = False # Hardcoded for local environment since we don't have an env var for it yet
                config = {
                    "configurable": {"thread_id": thread_id},
                    "tags": ["production" if is_prod else "dev", "chat"],
                    "metadata": {"user_id": user_id, "thread_id": thread_id}
                }
                
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
                        if tool_name in ["get_weather", "search_travel_info", "search_flights"]:
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

from fastapi.responses import JSONResponse

@router.post("/travel")
async def travel_endpoint(
    request: ChatRequest, 
    req: Request, 
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    user_id = getattr(request, 'user_id', None) or "guest"
    thread_id = getattr(request, 'thread_id', None) or "guest"
    message = request.message
    
    try:
        profile = await get_user_preferences(db, user_id) or {}
        profile_dict = {
            "name": "Guest",
            "favorite_destinations": profile.get("favorite_destinations", []),
            "budget_preference": profile.get("budget_preference"),
            "food_preference": profile.get("food_preference"),
            "traveler_type": profile.get("traveler_type"),
            "seat_preference": profile.get("seat_preference")
        }

        async with get_compiled_graph() as graph:
            config = {
                "configurable": {"thread_id": thread_id},
                "tags": ["dev", "chat"],
                "metadata": {"user_id": user_id, "thread_id": thread_id}
            }
            
            input_state = {
                "messages": [HumanMessage(content=message)],
                "user_id": user_id,
                "thread_id": thread_id,
                "user_profile": profile_dict
            }
            
            # Use ainvoke for a complete run and return the final message
            result = await graph.ainvoke(input_state, config)
            final_message = result["messages"][-1].content
            
            return JSONResponse({
                "success": True,
                "answer": final_message,
                "thread_id": thread_id
            })
            
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)
