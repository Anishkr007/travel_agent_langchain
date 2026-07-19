from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import chat, profile
from app.database.mongodb import connect_to_mongo, close_mongo_connection

from app.config import settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.LANGSMITH_API_KEY:
        print(f"LangSmith tracing: enabled (project={settings.LANGSMITH_PROJECT})")
    else:
        print("LangSmith tracing: disabled (LANGSMITH_API_KEY not set)")
        
    await connect_to_mongo()
    yield
    await close_mongo_connection()

app = FastAPI(title="AI Travel Planner API", lifespan=lifespan)

origins = [
    "https://travel-agent-langchain.vercel.app",
    "https://travel-agent-langchain-olive.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "null",
]
if settings.ALLOWED_ORIGINS:
    origins.extend([o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(set(origins)),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/api", tags=["chat"])
app.include_router(profile.router, prefix="/api/profile", tags=["profile"])

@app.get("/api/health")
async def health_check():
    return {"status": "ok"}
