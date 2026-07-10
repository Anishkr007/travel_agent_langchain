from app.graph.state import TravelState
from app.services.user_service import update_user_preferences, get_user_preferences
from app.database.mongodb import get_database, connect_to_mongo
from motor.motor_asyncio import AsyncIOMotorClient
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from app.config import settings

def get_extraction_llm():
    return ChatOpenAI(
        model="gpt-3.5-turbo", 
        temperature=0,
        api_key=settings.OPENAI_API_KEY or "missing_key"
    )

async def memory_node(state: TravelState):
    if not settings.OPENAI_API_KEY or settings.OPENAI_API_KEY == "your_openai_api_key_here":
        return {}
        
    extraction_llm = get_extraction_llm()
    messages = state["messages"]
    user_id = state["user_id"]
    
    # Get the last user message
    user_messages = [m for m in messages if isinstance(m, HumanMessage)]
    if not user_messages:
        return {}
    
    last_user_message = user_messages[-1].content
    
    # Extract profile details
    sys_prompt = """Extract user profile preferences from the message. 
    Only output JSON matching this schema: 
    {
      "name": "string or null",
      "favorite_destinations": ["list of strings"],
      "budget_preference": "string or null",
      "food_preference": "string or null",
      "travel_history": ["list of strings"],
      "trip_duration_preference": "string or null",
      "traveler_type": "string or null",
      "seat_preference": "string or null"
    }
    If a preference is not mentioned, leave it null or empty list.
    Only extract new information mentioned in the most recent message."""
    
    try:
        response = await extraction_llm.ainvoke([
            SystemMessage(content=sys_prompt),
            HumanMessage(content=last_user_message)
        ])
        
        import json
        extracted_data = json.loads(response.content)
        
        # filter out nulls/empties
        updates = {k: v for k, v in extracted_data.items() if v}
        
        if updates:
            # We need a new client here since nodes run in the background 
            # and might not have the FastAPI Request DB dependency
            client = AsyncIOMotorClient(settings.MONGODB_URL)
            db = client[settings.DATABASE_NAME]
            try:
                await update_user_preferences(db, user_id, updates)
                updated_profile = await get_user_preferences(db, user_id)
                
                return {
                    "user_profile": {
                        "favorite_destinations": updated_profile.get("favorite_destinations", []),
                        "budget_preference": updated_profile.get("budget_preference"),
                        "food_preference": updated_profile.get("food_preference"),
                        "traveler_type": updated_profile.get("traveler_type"),
                        "seat_preference": updated_profile.get("seat_preference")
                    }
                }
            finally:
                client.close()
    except Exception as e:
        print(f"Memory extraction failed: {e}")
        
    return {}
