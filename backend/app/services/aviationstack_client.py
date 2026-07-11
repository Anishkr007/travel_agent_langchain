import httpx
import re
import airportsdata
import pycountry
from app.config import settings
from typing import Dict, Any, Tuple, Optional

# Load IATA data once at module level
# airports = airportsdata.load("IATA")
try:
    airports = airportsdata.load("IATA")
except Exception as e:
    airports = {}

COUNTRY_MAIN_AIRPORT = {
    "japan": "NRT",
    "nepal": "KTM",
    "uae": "DXB",
    "united arab emirates": "DXB",
    "dubai": "DXB",
    "bangladesh": "DAC",
    "thailand": "BKK",
    "india": "DEL",
    "usa": "JFK",
    "united states": "JFK",
    "uk": "LHR",
    "united kingdom": "LHR"
}

CITY_MAIN_AIRPORT = {
    "tokyo": "NRT",
    "kathmandu": "KTM",
    "dubai": "DXB",
    "dhaka": "DAC",
    "bangkok": "BKK",
    "delhi": "DEL",
    "new delhi": "DEL",
    "new york": "JFK",
    "london": "LHR",
    "paris": "CDG",
    "singapore": "SIN",
    "sydney": "SYD"
}

class AviationStackClient:
    BASE_URL = "http://api.aviationstack.com/v1/flights"

    @staticmethod
    def resolve_location_to_iata(location: str) -> Optional[str]:
        if not location:
            return None
        
        loc_lower = location.lower().strip()
        
        # 1. Check if it's already a 3-letter IATA code
        if len(loc_lower) == 3 and loc_lower.upper() in airports:
            return loc_lower.upper()
            
        # 2. Check direct city/country overrides
        if loc_lower in CITY_MAIN_AIRPORT:
            return CITY_MAIN_AIRPORT[loc_lower]
        if loc_lower in COUNTRY_MAIN_AIRPORT:
            return COUNTRY_MAIN_AIRPORT[loc_lower]
            
        # 3. Try to resolve country name via pycountry to see if it matches
        try:
            country = pycountry.countries.lookup(loc_lower)
            if country and country.name.lower() in COUNTRY_MAIN_AIRPORT:
                return COUNTRY_MAIN_AIRPORT[country.name.lower()]
        except Exception:
            pass

        # 4. Search through airportsdata for a matching city or country
        # Score candidates by whether they have 'International' in the name
        candidates = []
        for iata, data in airports.items():
            c_name = str(data.get("city", "")).lower()
            c_country = str(data.get("country", "")).lower()
            a_name = str(data.get("name", "")).lower()
            
            if loc_lower == c_name or loc_lower == c_country or loc_lower in a_name:
                score = 1 if "international" in a_name else 0
                candidates.append((score, iata))
                
        if candidates:
            candidates.sort(reverse=True)
            return candidates[0][1]
            
        return None

    @staticmethod
    def parse_route(query: str) -> Tuple[Optional[str], Optional[str]]:
        query_lower = query.lower()
        
        # If it's a global flights query
        if any(ph in query_lower for ph in ["all flights", "global flights", "worldwide flights", "all country flight"]):
            return None, None
            
        origin = None
        destination = None
        
        # Regex patterns
        # 1. from X to Y
        m = re.search(r'from\s+([a-zA-Z\s]+)\s+to\s+([a-zA-Z\s]+)', query_lower)
        if m:
            origin = m.group(1).strip()
            destination = m.group(2).strip()
        else:
            # 2. to Y from X
            m = re.search(r'to\s+([a-zA-Z\s]+)\s+from\s+([a-zA-Z\s]+)', query_lower)
            if m:
                destination = m.group(1).strip()
                origin = m.group(2).strip()
            else:
                # 3. Just to X
                m = re.search(r'to\s+([a-zA-Z\s]+)', query_lower)
                if m:
                    destination = m.group(1).strip()
                # 4. Just from X
                m = re.search(r'from\s+([a-zA-Z\s]+)', query_lower)
                if m:
                    origin = m.group(1).strip()
                    
        # If no regex matched but we have city names in the query, we might try to extract them,
        # but regex is safer. Let's just use what we have or fallback to default origin.
        
        if origin:
            origin_iata = AviationStackClient.resolve_location_to_iata(origin)
        else:
            origin_iata = None
            
        if destination:
            dest_iata = AviationStackClient.resolve_location_to_iata(destination)
        else:
            dest_iata = None
            
        # If only destination is found, use default origin
        if dest_iata and not origin_iata:
            origin_iata = settings.DEFAULT_ORIGIN_IATA
            
        return origin_iata, dest_iata

    @staticmethod
    async def search_flights(query: str, limit: int = 5) -> Dict[str, Any]:
        if not settings.AVIATIONSTACK_API_KEY:
            return {"error": "AVIATIONSTACK_API_KEY is missing. Please configure it in .env."}
            
        origin_iata, dest_iata = AviationStackClient.parse_route(query)
        
        params = {
            "access_key": settings.AVIATIONSTACK_API_KEY,
            "limit": limit
        }
        
        route_desc = "Global live flights"
        if origin_iata:
            params["dep_iata"] = origin_iata
        if dest_iata:
            params["arr_iata"] = dest_iata
            
        if origin_iata and dest_iata:
            route_desc = f"Flights from {origin_iata} to {dest_iata}"
        elif origin_iata:
            route_desc = f"Departures from {origin_iata}"
        elif dest_iata:
            route_desc = f"Arrivals to {dest_iata}"
            
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(AviationStackClient.BASE_URL, params=params, timeout=10.0)
                response.raise_for_status()
                data = response.json()
                
                if "error" in data:
                    return {"error": data["error"].get("info", "AviationStack API Error")}
                    
                flights = []
                for flight in data.get("data", []):
                    f_info = flight.get("flight", {})
                    d_info = flight.get("departure", {})
                    a_info = flight.get("arrival", {})
                    
                    flights.append({
                        "airline": flight.get("airline", {}).get("name", "Unknown Airline"),
                        "flight_number": f_info.get("iata") or f_info.get("number"),
                        "status": flight.get("flight_status", "unknown"),
                        "departure": {
                            "airport": d_info.get("airport"),
                            "iata": d_info.get("iata"),
                            "scheduled": d_info.get("scheduled"),
                            "terminal": d_info.get("terminal"),
                            "gate": d_info.get("gate")
                        },
                        "arrival": {
                            "airport": a_info.get("airport"),
                            "iata": a_info.get("iata"),
                            "scheduled": a_info.get("scheduled"),
                            "terminal": a_info.get("terminal"),
                            "gate": a_info.get("gate")
                        }
                    })
                    
                return {
                    "route": route_desc,
                    "info": "AviationStack provides live flight status and schedules. It DOES NOT provide ticket fares or prices. Please check an airline or booking site for prices.",
                    "flights": flights
                }
                
        except Exception as e:
            return {"error": str(e)}
