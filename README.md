# Wander AI ✈️

Wander AI is an intelligent, multi-agent travel planner built with a modern Python stack and a sleek, vanilla HTML/JS/CSS frontend. It helps users plan complete itineraries, look up live flight data, and check real-time weather at their destinations.

## 🚀 Features

- **Multi-Agent Workflow:** Powered by LangGraph to intelligently route between LLM reasoning, memory retrieval, and external tool execution.
- **Live Travel Data:** 
  - Real-time weather via OpenWeather API.
  - Live flight schedules and status via AviationStack API (with smart natural-language-to-IATA-code resolution).
  - General web search via Tavily API.
- **Robust Memory:** Full conversational memory and checkpointing using MongoDB, so you never lose the context of your trip planning.
- **Authentication & Profiles:** JWT-based user authentication with stored travel preferences (budget, dietary restrictions, favorite destinations).
- **Responsive UI:** A lightning-fast, glassmorphism-styled frontend built with vanilla HTML, CSS, and JS (no bulky frameworks). Fully mobile-ready.
- **Export to PDF:** Instantly generate a PDF of your planned itinerary.

## 🛠️ Tech Stack

**Backend:**
- **Framework:** FastAPI
- **AI/LLM:** LangChain & LangGraph
- **Database:** MongoDB (Motor async driver)
- **Checkpointer:** `langgraph-checkpoint-mongodb`
- **Observability:** LangSmith (for tracing agent decisions and token usage)

**Frontend:**
- **Core:** Vanilla HTML5, CSS3, JavaScript
- **Dev Server:** Vite (used purely for local static serving and fast refresh)
- **Libraries (CDN):** Marked (Markdown parsing), DOMPurify (HTML sanitization), jsPDF (PDF export)

**Deployment & Infrastructure:**
- **Containerization:** Docker & Docker Compose
- **Platform:** Configured for Render (Backend as a Docker Web Service, Frontend as a Static Site)
- **Database Hosting:** MongoDB Atlas

## 🏗️ Getting Started (Local Development)

### 1. Prerequisites
- [Docker & Docker Compose](https://www.docker.com/) (Optional, but recommended for easy setup)
- [Node.js](https://nodejs.org/) (for serving the frontend)
- Python 3.11+ (if running the backend bare-metal)

### 2. Environment Setup
Copy the example environment files and fill in your API keys:
```bash
cp .env.example .env
cp backend/.env.example backend/.env
```
*You will need API keys for OpenAI, Tavily, OpenWeather, AviationStack, and (optionally) LangSmith.*

### 3. Run with Docker Compose
The easiest way to run the backend and database locally is via Docker Compose:
```bash
docker compose up --build
```
This will start:
- A local MongoDB instance on port `27017`
- The FastAPI backend on `http://localhost:8000`

*To verify the backend is running, visit `http://localhost:8000/api/health`.*

### 4. Run the Frontend
In a new terminal, navigate to the `frontend` folder and start the Vite dev server:
```bash
cd frontend
npm install
npm run dev
```
The frontend will be available at `http://localhost:5173`.

## 🌍 Deployment

See the [DEPLOYMENT.md](./DEPLOYMENT.md) file for comprehensive instructions on deploying the application to Render.

## 📝 License
MIT License
