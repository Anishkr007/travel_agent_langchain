# ✈️ Wander AI - Multi-Agent AI Travel Planner

An intelligent AI-powered travel planner built using **LangGraph**, **FastAPI**, **OpenAI**, and **React** that generates complete travel itineraries with live weather, flight information, and web search.

![Python](https://img.shields.io/badge/Python-3.11-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688)
![LangGraph](https://img.shields.io/badge/LangGraph-Agent-orange)
![React](https://img.shields.io/badge/React-Frontend-61DAFB)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-green)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT-black)
![License](https://img.shields.io/badge/License-MIT-blue)

---

# 🚀 Overview

Wander AI is a production-ready AI Travel Planner that combines multiple AI agents and external APIs to create personalized travel plans.

Instead of simply answering questions, the application:

- Searches live flight information
- Retrieves real-time weather
- Searches the web for attractions
- Generates day-by-day itineraries
- Estimates trip budgets
- Recommends hotels and destinations
- Uses AI to personalize recommendations

---

# ✨ Features

### 🤖 AI Planning

- Multi-Agent Architecture using LangGraph
- OpenAI GPT-powered reasoning
- Intelligent itinerary generation
- Budget planning
- Personalized travel suggestions

---

### 🌍 Live Travel Information

- ✈️ Live Flight Search
- 🌦 Real-time Weather
- 🔎 Web Search using Tavily
- 🏨 Hotel Recommendations
- 📍 Tourist Attractions

---

### 💬 Chat Experience

- Streaming AI responses
- Markdown support
- Copy responses
- Download itinerary as PDF
- Beautiful modern UI
- Responsive design

---

### 👤 User Features

- Authentication
- User Profiles
- Travel Preferences
- Favorite Destinations
- Conversation Memory

---

# 🛠 Tech Stack

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

## APIs

- OpenAI API
- Tavily Search API
- OpenWeather API
- AviationStack API

## Deployment

- Render
- Vercel
- Docker

---

# 🏗 Architecture

```
                User
                  │
                  ▼
        React Frontend (Vercel)
                  │
                  ▼
          FastAPI Backend
                  │
      ┌───────────┼───────────┐
      │           │           │
      ▼           ▼           ▼
 LangGraph    MongoDB      OpenAI
      │
      ├──────────────┐
      ▼              ▼
 Weather API     Tavily Search
      │
      ▼
 AviationStack
```

---

# 📂 Project Structure

```
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
└── README.md
```

---

# ⚙️ Installation

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

source venv/bin/activate
```

Windows

```bash
venv\Scripts\activate
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

Backend

```
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

# 📸 Demo

### Landing Page

(Add Screenshot)

### Chat Interface

(Add Screenshot)

### Generated Itinerary

(Add Screenshot)

---

# 🚀 Future Improvements

- Voice Assistant
- Google Maps Integration
- Hotel Booking APIs
- Flight Booking APIs
- Multi-language Support
- Image Generation
- AI Expense Tracker
- Offline Travel Guide
- Mobile App
- Push Notifications

---

# 📚 What I Learned

- LangGraph Multi-Agent Systems
- FastAPI Production Deployment
- Docker
- MongoDB Atlas
- OpenAI Streaming
- REST APIs
- Authentication
- Full Stack Development
- Cloud Deployment
- Responsive UI Design

---

# 🤝 Contributing

Pull requests are welcome.

For major changes, please open an issue first to discuss your ideas.

---

# ⭐ Support

If you found this project useful,

please ⭐ the repository.

---

# 👨‍💻 Author

**Anish Kumar**

GitHub

https://github.com/Anishkr007

LinkedIn

(Add LinkedIn Profile)

---

## ⭐ If you like this project, don't forget to Star the repository!
