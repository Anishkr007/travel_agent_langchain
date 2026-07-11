from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    OPENAI_API_KEY: str = ""
    TAVILY_API_KEY: str = ""
    OPENWEATHER_API_KEY: str = ""
    AVIATIONSTACK_API_KEY: str = ""
    DEFAULT_ORIGIN_IATA: str = "DEL"
    LANGSMITH_TRACING: str = "false"
    LANGSMITH_ENDPOINT: str = "https://api.smith.langchain.com"
    LANGSMITH_API_KEY: str = ""
    LANGSMITH_PROJECT: str = "travel-agent"
    MONGODB_URL: str
    DATABASE_NAME: str = "tripplanner"
    ALLOWED_ORIGINS: str = "http://localhost:5173"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
