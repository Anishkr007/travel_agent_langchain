from langchain_core.tools import tool
from app.services.tavily_client import TavilyClient

@tool
async def search_travel_info(query: str) -> str:
    """Search for travel information, attractions, hotels, or news. Requires cited facts."""
    result = await TavilyClient.search(query)
    import json
    return json.dumps(result)
