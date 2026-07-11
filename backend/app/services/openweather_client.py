import httpx
from app.config import settings
from typing import Dict, Any
from langsmith import traceable

class OpenWeatherClient:
    BASE_URL = "https://api.openweathermap.org/data/2.5/weather"
    
    @staticmethod
    @traceable(name="weather-tool", run_type="tool")
    async def get_weather(location: str) -> Dict[str, Any]:
        if not settings.OPENWEATHER_API_KEY:
            return {"error": "OPENWEATHER_API_KEY is missing. Please configure it in .env."}
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    OpenWeatherClient.BASE_URL,
                    params={
                        "q": location,
                        "appid": settings.OPENWEATHER_API_KEY,
                        "units": "metric"
                    },
                    timeout=5.0
                )
                response.raise_for_status()
                data = response.json()
                return {
                    "temp": data["main"]["temp"],
                    "feels_like": data["main"]["feels_like"],
                    "humidity": data["main"]["humidity"],
                    "wind_speed": data["wind"]["speed"],
                    "description": data["weather"][0]["description"],
                    "icon": data["weather"][0]["icon"],
                    "sunrise": data["sys"]["sunrise"],
                    "sunset": data["sys"]["sunset"],
                    "location": data["name"],
                }
            except httpx.HTTPStatusError as e:
                return {"error": f"Failed to fetch weather: HTTP {e.response.status_code}"}
            except httpx.RequestError as e:
                return {"error": f"Failed to fetch weather: Network error ({str(e)})"}
            except KeyError as e:
                return {"error": f"Failed to parse weather data: missing {str(e)}"}
