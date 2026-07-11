# ✈️ Wander AI – Multi-Agent AI Travel Planner

An AI-powered travel planner built with **LangGraph**, **FastAPI**, **OpenAI**, and **React** that creates personalized travel itineraries using multiple AI agents, real-time weather, flight information, and intelligent web search.

<p align="center">

![Python](https://img.shields.io/badge/Python-3.11-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688)
![LangGraph](https://img.shields.io/badge/LangGraph-AI%20Workflow-orange)
![LangSmith](https://img.shields.io/badge/LangSmith-Tracing-purple)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)
![React](https://img.shields.io/badge/React-Frontend-61DAFB)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT-black)

</p>

---

# 🌍 Overview

Wander AI is an intelligent **Multi-Agent AI Travel Planner** that combines **LangGraph**, **OpenAI**, and multiple external APIs to generate complete travel plans.

Instead of simply answering questions, the AI:

- ✈️ Searches live flights
- 🌦 Retrieves live weather
- 🌍 Searches the web for attractions
- 🏨 Recommends hotels
- 💰 Estimates travel budgets
- 📅 Creates day-by-day itineraries
- 🧠 Personalizes recommendations using AI

---

# ✨ Features

## 🤖 AI Planning

- Multi-Agent Workflow using LangGraph
- OpenAI GPT-powered reasoning
- Intelligent itinerary generation
- Personalized recommendations
- Budget estimation
- Destination suggestions

---

## 🌎 Live Travel Information

- ✈️ Flight Search (AviationStack API)
- 🌦 Live Weather (OpenWeather API)
- 🔎 Web Search (Tavily Search)
- 🏨 Hotel Recommendations
- 📍 Tourist Attractions

---

## 💬 AI Chat Experience

- ChatGPT-style UI
- Real-time streaming responses
- Markdown rendering
- Copy responses
- PDF itinerary export
- Responsive design
- Mobile friendly

---

## 👤 User Features

- Authentication
- User Profiles
- Travel Preferences
- Favorite Destinations
- Persistent Chat Memory

---

# 🏗 Architecture

```text
                User
                  │
                  ▼
        React Frontend (Vercel)
                  │
                  ▼
          FastAPI Backend
                  │
      ┌───────────┼────────────┐
      │           │            │
      ▼           ▼            ▼
 LangGraph     MongoDB      LangSmith
      │
      ├───────────────────────────────┐
      ▼               ▼               ▼
 OpenAI GPT      Tavily Search   OpenWeather
      │
      ▼
 AviationStack
```

---

# ⚡ Tech Stack

## Frontend

- React
- Vite
- JavaScript
- HTML
- CSS
- Framer Motion

## Backend

- FastAPI
- LangGraph
- LangChain
- OpenAI

## Database

- MongoDB Atlas

## AI Observability

- LangSmith

## APIs

- OpenAI API
- Tavily Search API
- OpenWeather API
- AviationStack API

## Deployment

- Docker
- Render
- Vercel

---

# 📂 Project Structure

```text
travel_agent_langchain
│
├── backend
│   ├── app
│   ├── Dockerfile
│   ├── requirements.txt
│   └── ...
│
├── frontend
│   ├── app.js
│   ├── style.css
│   ├── index.html
│   └── ...
│
├── assets
│   ├── home.png
│   ├── chat.png
│   ├── itinerary.png
│   └── demo.gif
│
└── README.md
```

---

# 📸 Demo

## Home Page

> Add Screenshot

---

## Chat Interface

> Add Screenshot

---

## Generated Itinerary

> Add Screenshot

---

## Demo GIF

> Add demo.gif here

---

# 🚀 Installation

## Clone Repository

```bash
git clone https://github.com/Anishkr007/travel_agent_langchain.git

cd travel_agent_langchain
```

---

## Backend

```bash
cd backend

python -m venv venv
```

Windows

```bash
venv\Scripts\activate
```

Linux / Mac

```bash
source venv/bin/activate
```

Install dependencies

```bash
pip install -r requirements.txt
```

Run

```bash
uvicorn app.main:app --reload
```

---

## Frontend

```bash
cd frontend

npm install

npm run dev
```

---

# 🔑 Environment Variables

```env
OPENAI_API_KEY=

TAVILY_API_KEY=

OPENWEATHER_API_KEY=

AVIATIONSTACK_API_KEY=

MONGODB_URI=

LANGSMITH_API_KEY=

LANGSMITH_TRACING=true

LANGSMITH_PROJECT=wander-ai
```

---

# 🌐 Deployment

Frontend

- Vercel

Backend

- Render

Database

- MongoDB Atlas

---

# 📈 LangSmith Observability

LangSmith is used for:

- Agent execution tracing
- Workflow visualization
- LLM debugging
- Tool execution monitoring
- Prompt inspection
- Performance analysis
- Error tracking

---

# 🚀 Future Improvements

- Google Maps Integration
- Hotel Booking APIs
- Flight Booking APIs
- Voice Assistant
- Multi-language Support
- Expense Tracking
- Offline Travel Guide
- Mobile Application
- Push Notifications

---

# 📚 What I Learned

- LangGraph Multi-Agent Systems
- FastAPI Development
- LangSmith Observability
- Docker Deployment
- MongoDB Atlas
- REST APIs
- OpenAI Streaming
- AI Workflow Design
- Cloud Deployment
- Responsive Frontend Development

---

# 🤝 Contributing

Contributions are welcome!

Feel free to fork this repository and submit a pull request.

---

# ⭐ Support

If you found this project useful, consider giving it a ⭐ on GitHub.

---

# 👨‍💻 Author

**Anish Kumar**

GitHub: https://github.com/Anishkr007

LinkedIn: https://www.linkedin.com/in/anish-kumar-17827628b/

---

## ⭐ If you like this project, don't forget to Star the repository!
