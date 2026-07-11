# Deployment Guide (Render)

This project is configured to run on [Render](https://render.com/) with a decoupled architecture: the backend deployed as a Docker Web Service, and the frontend deployed as a Static Site.

## Local Development (Docker Compose)

To run the full stack locally (Backend + MongoDB) without needing a local Mongo installation:

1. Copy `.env.example` to `.env` at the root of the repository and fill in your API keys.
2. Run:
   ```bash
   docker compose up --build
   ```
3. The backend will be available at `http://localhost:8000`, and the local Mongo instance will run on port `27017`.
4. Verify the backend health by visiting: `http://localhost:8000/api/health`.

---

## Deploying to Render

### 1. Database Setup (MongoDB Atlas)
- Create a cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
- Get your connection string (it will look like `mongodb+srv://<user>:<password>@cluster0...`).
- Add Render's outgoing IP addresses to your Atlas Network Access allowlist (or allow access from anywhere `0.0.0.0/0` if preferred for simplicity).

### 2. Backend (Web Service)
Deploy the backend as a **Web Service**.

- **Environment**: Docker
- **Root Directory**: `backend`
- **Build Command**: (Leave empty, Render uses the Dockerfile automatically)
- **Start Command**: (Leave empty, Render uses the CMD from the Dockerfile)

**Required Environment Variables**:
- `MONGODB_URL`: Your MongoDB Atlas connection string (e.g., `mongodb+srv://...`)
- `JWT_SECRET`: A strong, random string for signing JWT tokens.
- `OPENAI_API_KEY`: Your OpenAI API key.
- `TAVILY_API_KEY`: Your Tavily API key.
- `OPENWEATHER_API_KEY`: Your OpenWeather API key.
- `AVIATIONSTACK_API_KEY`: Your AviationStack API key.
- `ALLOWED_ORIGINS`: Set this to your deployed frontend URL (e.g., `https://my-travel-app.onrender.com`). *Note: Initially set to `http://localhost:5173`, update it after deploying the frontend.*

*(Optional for observability)*:
- `LANGSMITH_TRACING`: `true`
- `LANGSMITH_ENDPOINT`: `https://api.smith.langchain.com`
- `LANGSMITH_API_KEY`: Your LangSmith API key.
- `LANGSMITH_PROJECT`: `travel-agent`

### 3. Frontend (Static Site)
Deploy the frontend as a **Static Site**.

- **Root Directory**: `frontend`
- **Build Command**: (Leave empty, no build step required for Vanilla JS)
- **Publish Directory**: `.` (or `frontend` depending on Render's auto-detection)

**Before Deploying the Frontend**:
- Open `frontend/app.js` and change `const API_BASE = "http://localhost:8000/api";` to point to your new Render backend URL (e.g., `const API_BASE = "https://my-backend.onrender.com/api";`).

### 4. Finalizing
Once the frontend is deployed and you have its live URL (e.g., `https://wander-ai-frontend.onrender.com`), go back to your Backend Web Service settings in Render and update the `ALLOWED_ORIGINS` environment variable to include this exact URL, then trigger a manual deploy for the backend to apply the updated CORS policy.
