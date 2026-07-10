from langchain_core.tools import tool
from app.services.openweather_client import OpenWeatherClient

@tool
async def get_weather(location: str) -> str:
    """Get the current weather for a specific location."""
    result = await OpenWeatherClient.get_weather(location)
    import json
    return json.dumps(result)
