import json
import asyncio
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
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
                collected_flights = []
                flight_route = ""
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
                        output = event["data"].get("output")
                        if not output:
                            continue
                        # Handle ToolMessage objects, strings, and dicts
                        try:
                            if hasattr(output, 'content'):
                                raw = output.content
                            elif isinstance(output, str):
                                raw = output
                            else:
                                raw = output
                            parsed = json.loads(raw) if isinstance(raw, str) else raw
                        except Exception:
                            parsed = {}

                        if tool_name == "search_flights" or "flight" in tool_name.lower():
                            raw_flights = parsed.get("flights", [])
                            flight_route = parsed.get("route", "")
                            def fmt_time(ts):
                                if not ts: return "--"
                                from datetime import datetime, timezone
                                try:
                                    dt = datetime.fromisoformat(ts.replace('Z', '+00:00'))
                                    return dt.strftime("%b %d, %I:%M %p")
                                except Exception:
                                    return ts
                            for f in raw_flights:
                                dep = f.get("departure", {})
                                arr = f.get("arrival", {})
                                collected_flights.append({
                                    "airline": f.get("airline", "Unknown"),
                                    "flightNumber": f.get("flight_number", ""),
                                    "status": f.get("status", "scheduled"),
                                    "from": dep.get("iata", "--"),
                                    "to": arr.get("iata", "--"),
                                    "departTime": fmt_time(dep.get("scheduled")),
                                    "arriveTime": fmt_time(arr.get("scheduled"))
                                })
                            # Also emit the raw tool_data for compatibility
                            yield {
                                "event": "message",
                                "data": json.dumps({"type": "tool_data", "tool": "search_flights", "data": parsed})
                            }
                        elif tool_name in ["get_weather", "search_travel_info"]:
                            yield {
                                "event": "message",
                                "data": json.dumps({"type": "tool_data", "tool": tool_name, "data": parsed})
                            }
                            
                # Emit done with collected flights embedded
                yield {
                    "event": "message",
                    "data": json.dumps({"type": "done", "flights": collected_flights, "flight_route": flight_route})
                }
                
        except Exception as e:
            yield {
                "event": "error",
                "data": json.dumps({"error": str(e)})
            }
            
    return EventSourceResponse(event_generator())

@router.post("/travel")
async def travel_endpoint(
    request: ChatRequest, 
    req: Request, 
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    user_id = request.user_id if getattr(request, 'user_id', None) else "guest"
    thread_id = request.thread_id if getattr(request, 'thread_id', None) else "guest"
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
            is_prod = False
            config = {
                "configurable": {"thread_id": thread_id},
                "tags": ["production" if is_prod else "dev", "chat"],
                "metadata": {"user_id": user_id, "thread_id": thread_id}
            }
            
            input_state = {
                "messages": [HumanMessage(content=message)],
                "user_id": user_id,
                "thread_id": thread_id,
                "user_profile": profile_dict
            }
            
            result = await graph.ainvoke(input_state, config)
            final_message = result["messages"][-1].content
            
            flights_data = []
            for msg in reversed(result["messages"]):
                if getattr(msg, "name", None) == "search_flights":
                    try:
                        tool_data = json.loads(msg.content)
                        raw_flights = tool_data.get("flights", [])
                        
                        def format_time(ts):
                            if not ts: return "--"
                            from datetime import datetime
                            try:
                                dt = datetime.fromisoformat(ts.replace('Z', '+00:00'))
                                return dt.strftime("%b %d, %I:%M %p")
                            except:
                                return ts

                        for f in raw_flights:
                            dep = f.get("departure", {})
                            arr = f.get("arrival", {})
                            flights_data.append({
                                "airline": f.get("airline", "Unknown"),
                                "flightNumber": f.get("flight_number", ""),
                                "status": f.get("status", "scheduled"),
                                "from": dep.get("iata", "--"),
                                "to": arr.get("iata", "--"),
                                "departTime": format_time(dep.get("scheduled")),
                                "arriveTime": format_time(arr.get("scheduled"))
                            })
                        break
                    except Exception:
                        pass
                        
            return JSONResponse({
                "success": True,
                "answer": final_message,
                "thread_id": thread_id,
                "flights": flights_data
            })
            
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)
