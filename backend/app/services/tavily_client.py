import httpx
from app.config import settings
from typing import Dict, Any

class TavilyClient:
    BASE_URL = "https://api.tavily.com/search"
    
    @staticmethod
    async def search(query: str, search_depth: str = "basic") -> Dict[str, Any]:
        if not settings.TAVILY_API_KEY:
            return {"error": "TAVILY_API_KEY is missing. Please configure it in .env."}
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    TavilyClient.BASE_URL,
                    json={
                        "api_key": settings.TAVILY_API_KEY,
                        "query": query,
                        "search_depth": search_depth,
                        "include_answer": False,
                        "include_images": False,
                        "include_raw_content": False,
                        "max_results": 5,
                        "include_domains": [],
                        "exclude_domains": []
                    },
                    timeout=10.0
                )
                response.raise_for_status()
                data = response.json()
                
                results = []
                for result in data.get("results", []):
                    results.append({
                        "title": result.get("title", ""),
                        "content": result.get("content", ""),
                        "url": result.get("url", "")
                    })
                return {"results": results}
            except httpx.HTTPStatusError as e:
                return {"error": f"Failed to fetch search results: HTTP {e.response.status_code}"}
            except httpx.RequestError as e:
                return {"error": f"Failed to fetch search results: Network error ({str(e)})"}
            except Exception as e:
                return {"error": f"Failed to parse search data: {str(e)}"}
