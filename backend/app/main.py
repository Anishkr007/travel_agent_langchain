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

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://travel-agent-langchain.vercel.app",
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(profile.router, prefix="/api/profile", tags=["profile"])

@app.get("/api/health")
async def health_check():
    return {"status": "ok"}
