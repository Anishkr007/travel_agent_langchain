from langchain_core.messages import ToolMessage
from app.graph.state import TravelState
from app.tools.weather_tool import get_weather
from app.tools.search_tool import search_travel_info
from app.tools.flight_tool import search_flights
import json

tools = {
    "get_weather": get_weather,
    "search_travel_info": search_travel_info,
    "search_flights": search_flights
}

async def tools_node(state: TravelState):
    messages = state["messages"]
    last_message = messages[-1]
    
    tool_messages = []
    weather_data = state.get("weather_data", None)
    search_results = state.get("search_results", None)
    flight_data = state.get("flight_data", None)
    
    for tool_call in last_message.tool_calls:
        tool_name = tool_call["name"]
        if tool_name in tools:
            tool = tools[tool_name]
            result = await tool.ainvoke(tool_call["args"])
            
            tool_messages.append(
                ToolMessage(
                    content=result,
                    name=tool_name,
                    tool_call_id=tool_call["id"],
                )
            )
            
            # Update state based on tool used
            if tool_name == "get_weather":
                weather_data = json.loads(result)
            elif tool_name == "search_travel_info":
                # tag results if needed
                search_results = json.loads(result)
            elif tool_name == "search_flights":
                flight_data = json.loads(result)
                
    return {
        "messages": tool_messages,
        "weather_data": weather_data,
        "search_results": search_results,
        "flight_data": flight_data,
        "pending_tool_calls": []
    }
