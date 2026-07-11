import json
from langchain_core.tools import tool
from app.services.aviationstack_client import AviationStackClient
from langsmith import traceable

@tool
@traceable(name="flight-tool", run_type="tool")
async def search_flights(query: str) -> str:
    """Search for flights based on a natural-language travel query
    (e.g. 'flights from Delhi to Kathmandu', 'flights to Nepal',
    'all country flight info'). Do not pass IATA codes directly unless
    the user explicitly gave them — pass the user's original phrasing
    and let this tool resolve locations itself."""
    result = await AviationStackClient.search_flights(query)
    return json.dumps(result)
