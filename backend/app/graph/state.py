from typing import TypedDict, Annotated, Optional, Dict, Any, List
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages
import operator

class TravelState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]
    user_id: str
    thread_id: str
    destination: Optional[str]
    trip_duration_days: Optional[int]
    travel_dates: Optional[str]
    weather_data: Optional[Dict[str, Any]]
    search_results: Optional[Dict[str, Any]]
    budget_estimate: Optional[Dict[str, Any]]
    user_profile: Dict[str, Any]
    pending_tool_calls: List[str]
