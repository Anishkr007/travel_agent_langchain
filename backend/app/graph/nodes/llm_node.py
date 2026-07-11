from langchain_openai import ChatOpenAI
from langchain_core.messages import AIMessage
from app.graph.state import TravelState
from app.tools.weather_tool import get_weather
from app.tools.search_tool import search_travel_info
from app.tools.flight_tool import search_flights
import json
from app.config import settings

def get_llm():
    # Provide a dummy key if empty so startup doesn't crash, but requests will fail cleanly
    return ChatOpenAI(
        model="gpt-3.5-turbo", 
        temperature=0, 
        streaming=True,
        api_key=settings.OPENAI_API_KEY or "missing_key"
    )

tools = [get_weather, search_travel_info, search_flights]

async def llm_node(state: TravelState):
    if not settings.OPENAI_API_KEY or settings.OPENAI_API_KEY == "your_openai_api_key_here":
        # Fail gracefully
        return {"messages": [AIMessage(content="OPENAI_API_KEY is missing. Please configure it in .env.")], "pending_tool_calls": []}
        
    llm = get_llm()
    llm_with_tools = llm.bind_tools(tools)
    messages = state["messages"]
    
    # We inject the system prompt dynamically with the user profile
    system_prompt = f"""You are a premium AI travel planner.
User Profile: {json.dumps(state['user_profile'])}

CRITICAL INSTRUCTIONS:
1. YOU MUST ALWAYS USE THE `search_flights` TOOL to find live flight information if the user asks for a trip! Pass their natural language request to the tool.
2. YOU MUST ALWAYS INCLUDE a dedicated "## ✈️ Flight Options" section containing a Markdown table of the flight results (Airline, Flight Number, Departure Time, Arrival Time, Price). Do not skip this!
3. YOU MUST ALWAYS INCLUDE a dedicated "## 🏨 Hotel Options" section containing a Markdown table of accommodations.
4. For the itinerary, provide a time-blocked schedule per day (Morning / Afternoon / Evening). Name specific activities, restaurants, and landmarks. Do not use generic placeholders.
5. Include an estimated cost per day.
6. Output a final "## 💰 Budget Breakdown" table at the end (flights, hotels, food, activities, total) using proper Markdown table syntax.
7. Output MUST be valid Markdown (#/##/### headings, - lists, | tables). NEVER output raw unformatted text blocks.

Clearly state that flight data is live schedule info, not guaranteed fare pricing."""

    from langchain_core.messages import SystemMessage, trim_messages
    sys_msg = SystemMessage(content=system_prompt)
    
    # Trim the conversation history to save tokens
    # Keep the last 10 messages, ensuring it starts with a Human message if possible
    trimmed_messages = trim_messages(
        messages,
        max_tokens=10,
        strategy="last",
        token_counter=len,
        start_on="human",
        allow_partial=False
    )
    
    response = await llm_with_tools.ainvoke([sys_msg] + trimmed_messages)
    
    pending_tool_calls = []
    if getattr(response, 'tool_calls', None):
        pending_tool_calls = [tc["name"] for tc in response.tool_calls]
    
    return {"messages": [response], "pending_tool_calls": pending_tool_calls}
