// ===================================================================
// Wander AI — vanilla JS frontend
// Talks to the existing FastAPI backend (unchanged): /api/auth, /api/chat, /api/profile
// ===================================================================

const API_BASE = "https://travel-agent-langchain.onrender.com/api";

// ---------- Token storage ----------
const getTokens = () => ({
  accessToken: localStorage.getItem("access_token"),
  refreshToken: localStorage.getItem("refresh_token"),
});
const setTokens = (access, refresh) => {
  localStorage.setItem("access_token", access);
  localStorage.setItem("refresh_token", refresh);
};
const clearTokens = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
};

// ---------- Authenticated fetch with auto-refresh ----------
async function fetchWithAuth(endpoint, options = {}) {
  let { accessToken } = getTokens();
  if (!accessToken) throw new Error("No access token");

  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${accessToken}`);
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  let response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

  if (response.status === 401) {
    const { refreshToken } = getTokens();
    if (refreshToken) {
      const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        setTokens(data.access_token, data.refresh_token);
        headers.set("Authorization", `Bearer ${data.access_token}`);
        response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
      } else {
        clearTokens();
        throw new Error("Session expired");
      }
    }
  }
  return response;
}

// ---------- App state ----------
let currentUser = null; // { id, email, name }
let messages = []; // { id, role, content, toolData: [{tool, data}] }
let isLoading = false;

// ---------- DOM refs ----------
const el = (id) => document.getElementById(id);
const views = {
  login: el("view-login"),
  register: el("view-register"),
  app: el("view-app"),
};
const pages = {
  chat: el("page-chat"),
  profile: el("page-profile"),
};

// ===================================================================
// Router
// ===================================================================
function currentRoute() {
  return (location.hash || "#/chat").replace("#", "");
}

async function router() {
  const route = currentRoute();

  if (!currentUser) {
    Object.values(views).forEach((v) => v.classList.add("hidden"));
    if (route === "/register") {
      views.register.classList.remove("hidden");
    } else {
      views.login.classList.remove("hidden");
    }
    return;
  }

  // Logged in: show app shell
  views.login.classList.add("hidden");
  views.register.classList.add("hidden");
  views.app.classList.remove("hidden");

  const target = route === "/profile" ? "profile" : "chat";
  Object.entries(pages).forEach(([name, node]) => {
    node.classList.toggle("hidden", name !== target);
  });
  document.querySelectorAll(".nav-item").forEach((n) => {
    n.classList.toggle("active", n.dataset.nav === target);
  });

  if (target === "profile") loadProfile();
}

window.addEventListener("hashchange", router);

// ===================================================================
// Auth
// ===================================================================
async function initAuth() {
  const { accessToken } = getTokens();
  if (accessToken) {
    try {
      const res = await fetchWithAuth("/auth/me");
      if (res.ok) {
        currentUser = await res.json();
        applyUserToUI();
      } else {
        clearTokens();
      }
    } catch {
      clearTokens();
    }
  }
  router();
}

function applyUserToUI() {
  const name = currentUser.name || currentUser.email?.split("@")[0] || "Traveler";
  const initials = (currentUser.name || currentUser.email || "??")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  el("user-name").textContent = name;
  el("user-avatar").textContent = initials;
}

el("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const errBox = el("login-error");
  errBox.classList.add("hidden");
  const email = el("login-email").value;
  const password = el("login-password").value;

  try {
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData,
    });
    if (!res.ok) throw new Error("Invalid credentials");
    const data = await res.json();
    setTokens(data.access_token, data.refresh_token);
    const meRes = await fetchWithAuth("/auth/me");
    currentUser = await meRes.json();
    applyUserToUI();
    location.hash = "#/chat";
    router();
  } catch (err) {
    errBox.textContent = err.message || "Login failed";
    errBox.classList.remove("hidden");
  }
});

el("register-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const errBox = el("register-error");
  errBox.classList.add("hidden");
  const name = el("register-name").value;
  const email = el("register-email").value;
  const password = el("register-password").value;

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || "Registration failed");
    }
    const data = await res.json();
    setTokens(data.access_token, data.refresh_token);
    const meRes = await fetchWithAuth("/auth/me");
    currentUser = await meRes.json();
    applyUserToUI();
    location.hash = "#/chat";
    router();
  } catch (err) {
    errBox.textContent = err.message || "Registration failed";
    errBox.classList.remove("hidden");
  }
});

el("logout-btn").addEventListener("click", () => {
  clearTokens();
  currentUser = null;
  messages = [];
  location.hash = "#/login";
  router();
});

// ===================================================================
// Chat
// ===================================================================
const chatScroll = el("chat-scroll");
const hero = el("hero");
const messagesEl = el("messages");
const composer = el("composer");
const chatInput = el("chat-input");
const chatSend = el("chat-send");
const heroInput = el("hero-input");
const heroSend = el("hero-send");

function threadId() {
  const userId = currentUser?.id || "unknown";
  return `thread_${userId}`;
}

document.querySelectorAll(".quick-prompts button").forEach((btn) => {
  btn.addEventListener("click", () => {
    heroInput.value = btn.dataset.prompt;
    heroInput.focus();
  });
});

heroInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    submitMessage(heroInput.value);
  }
});
heroSend.addEventListener("click", () => submitMessage(heroInput.value));

chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") submitMessage(chatInput.value);
});
chatSend.addEventListener("click", () => submitMessage(chatInput.value));

function scrollToBottom() {
  chatScroll.scrollTop = chatScroll.scrollHeight;
}

function renderConversationStarted() {
  hero.classList.add("hidden");
  messagesEl.classList.remove("hidden");
  composer.classList.remove("hidden");
}

// Strips a trailing raw JSON object the model sometimes leaks after its
// answer (e.g. profile-extraction data). Purely a display-layer safety
// net — the real fix belongs in the backend system prompt.
function stripTrailingJSON(text) {
  const idx = text.lastIndexOf("{");
  if (idx === -1) return text;
  const tail = text.slice(idx).trim();
  try {
    JSON.parse(tail);
    return text.slice(0, idx).trim();
  } catch {
    return text;
  }
}

function renderMarkdown(text) {
  const clean = stripTrailingJSON(text || "");
  const html = window.marked ? window.marked.parse(clean) : clean;
  return window.DOMPurify ? window.DOMPurify.sanitize(html) : html;
}

function addUserMessage(text) {
  const tpl = el("tpl-msg-user").content.cloneNode(true);
  tpl.querySelector(".msg-content").textContent = text;
  messagesEl.appendChild(tpl);
  scrollToBottom();
}

function addAssistantMessage() {
  const tpl = el("tpl-msg-assistant").content.cloneNode(true);
  const node = tpl.querySelector(".msg-assistant");
  const contentEl = node.querySelector(".msg-content");
  contentEl.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
  messagesEl.appendChild(node);
  scrollToBottom();
  return node;
}

function looksLikeItinerary(text) {
  return /day\s*1/i.test(text || "");
}

function finalizeAssistantMessage(node, content) {
  const contentEl = node.querySelector(".msg-content");
  contentEl.innerHTML = renderMarkdown(content);

  const actions = node.querySelector(".msg-actions");
  if (looksLikeItinerary(content)) {
    actions.classList.remove("hidden");
    actions.querySelector(".copy-btn").addEventListener("click", async (e) => {
      const btn = e.currentTarget;
      const ok = await navigator.clipboard.writeText(stripTrailingJSON(content)).then(() => true).catch(() => false);
      const original = btn.innerHTML;
      btn.innerHTML = ok ? "Copied!" : "Failed";
      setTimeout(() => (btn.innerHTML = original), 1400);
    });
    actions.querySelector(".pdf-btn").addEventListener("click", () => exportItineraryToPDF(content));
  }
}

async function submitMessage(rawText) {
  const text = (rawText || "").trim();
  if (!text || isLoading) return;

  renderConversationStarted();
  addUserMessage(text);
  heroInput.value = "";
  chatInput.value = "";
  setLoading(true);

  const assistantNode = addAssistantMessage();
  const contentEl = assistantNode.querySelector(".msg-content");
  const toolsEl = assistantNode.querySelector(".msg-tools");
  let accumulated = "";
  let firstToken = true;

  try {
    const response = await fetchWithAuth("/chat/chat", {
      method: "POST",
      body: JSON.stringify({
        user_id: currentUser?.id || "unknown",
        thread_id: threadId(),
        message: text,
      }),
    });
    if (!response.ok || !response.body) throw new Error("Chat request failed");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let done = false;

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (!value) continue;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        let data;
        try {
          data = JSON.parse(line.slice(6));
        } catch {
          continue;
        }

        if (data.type === "token") {
          if (firstToken) {
            contentEl.innerHTML = "";
            firstToken = false;
          }
          accumulated += data.content || "";
          contentEl.textContent = accumulated; // plain text while streaming
          scrollToBottom();
        } else if (data.type === "tool_data") {
          renderToolCard(toolsEl, data.tool, data.data);
          scrollToBottom();
        } else if (data.error) {
          accumulated += `\n\n**Error:** ${data.error}`;
        }
      }
    }
  } catch (err) {
    accumulated = accumulated || "Something went wrong. Please try again.";
  } finally {
    finalizeAssistantMessage(assistantNode, accumulated);
    setLoading(false);
    scrollToBottom();
  }
}

function setLoading(loading) {
  isLoading = loading;
  heroSend.disabled = loading;
  chatSend.disabled = loading;
  heroSend.querySelector(".btn-label").classList.toggle("hidden", loading);
  heroSend.querySelector(".btn-loader").classList.toggle("hidden", !loading);
}

// ---------- Tool result cards ----------
function renderToolCard(container, tool, data) {
  if (tool === "get_weather") {
    container.appendChild(buildWeatherCard(data));
  } else if (tool === "search_flights") {
    container.appendChild(buildFlightCard(data));
  }
}

function buildWeatherCard(data) {
  const wrap = document.createElement("div");
  wrap.className = "tool-card";
  const iconUrl = data.icon ? `https://openweathermap.org/img/wn/${data.icon}.png` : "";
  const fmtTime = (ts) => (ts ? new Date(ts * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--");

  wrap.innerHTML = `
    <div class="weather-head">
      <div>
        <h3>${escapeHtml(data.location || "")}</h3>
        <p>${escapeHtml(data.description || "")}</p>
      </div>
      <div class="weather-temp">
        ${iconUrl ? `<img src="${iconUrl}" width="32" height="32" alt="" />` : ""}
        <span>${Math.round(data.temp ?? 0)}°</span>
      </div>
    </div>
    <div class="weather-grid">
      <div class="weather-item"><span class="label">Wind</span><span class="value">${data.wind_speed ?? "--"} m/s</span></div>
      <div class="weather-item"><span class="label">Humidity</span><span class="value">${data.humidity ?? "--"}%</span></div>
      <div class="weather-item"><span class="label">Sunrise</span><span class="value">${fmtTime(data.sunrise)}</span></div>
      <div class="weather-item"><span class="label">Sunset</span><span class="value">${fmtTime(data.sunset)}</span></div>
    </div>
  `;
  return wrap;
}

function buildFlightCard(data) {
  const wrap = document.createElement("div");
  wrap.className = "tool-card";

  const route = data.route || "Flight results";
  const flights = data.flights || [];

  let html = `<div class="flight-route-title">${escapeHtml(route)}</div>`;
  html += `<div class="flight-note">ⓘ AviationStack provides live flight status and schedules. It does not provide ticket fares or prices — check an airline or booking site for pricing.</div>`;

  if (!flights.length) {
    html += `<div class="flight-list"><p class="muted-line" style="padding:0 0 12px">No live flight data found for this route right now.</p></div>`;
  } else {
    html += `<div class="flight-list">`;
    for (const f of flights) {
      const dep = f.departure || {};
      const arr = f.arrival || {};
      html += `
        <div class="flight-card">
          <div class="flight-card-head">
            <div><span class="flight-airline">${escapeHtml(f.airline || "Unknown airline")}</span><span class="flight-num">${escapeHtml(f.flight_number || "")}</span></div>
            <span class="flight-status">${escapeHtml(f.status || "scheduled")}</span>
          </div>
          <div class="flight-route">
            <div class="flight-endpoint">
              <span class="code">${escapeHtml(dep.iata || "--")}</span>
              <span class="time">${escapeHtml(dep.scheduled ? new Date(dep.scheduled).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "--")}</span>
            </div>
            <div class="flight-line"></div>
            <div class="flight-endpoint">
              <span class="code">${escapeHtml(arr.iata || "--")}</span>
              <span class="time">${escapeHtml(arr.scheduled ? new Date(arr.scheduled).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "--")}</span>
            </div>
          </div>
        </div>
      `;
    }
    html += `</div>`;
  }

  wrap.innerHTML = html;
  return wrap;
}

function escapeHtml(str) {
  const d = document.createElement("div");
  d.textContent = String(str ?? "");
  return d.innerHTML;
}

// ---------- PDF export ----------
function exportItineraryToPDF(content) {
  const clean = stripTrailingJSON(content);
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  const maxWidth = pageWidth - margin * 2;
  let y = 60;

  const ensureSpace = (needed) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin + 10;
    }
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(20, 20, 25);
  doc.text("Your Trip Itinerary", margin, y);
  y += 28;

  for (const rawLine of clean.split("\n")) {
    const line = rawLine.trim();
    if (!line) {
      y += 10;
      continue;
    }
    if (/^#{1,3}\s*(Day\s*\d+|Flight|Budget)/i.test(line)) {
      ensureSpace(30);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(37, 99, 235);
      doc.text(line.replace(/^#+\s*/, ""), margin, y);
      y += 20;
      continue;
    }
    const cleanLine = line.replace(/\*\*(.*?)\*\*/g, "$1").replace(/^-\s*/, "• ").replace(/^#+\s*/, "");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(50, 50, 50);
    for (const w of doc.splitTextToSize(cleanLine, maxWidth)) {
      ensureSpace(16);
      doc.text(w, margin, y);
      y += 15;
    }
  }

  doc.save("ai-travel-plan.pdf");
}

// ===================================================================
// Profile
// ===================================================================
async function loadProfile() {
  const loadingEl = el("profile-loading");
  const contentEl = el("profile-content");
  contentEl.classList.add("hidden");
  loadingEl.classList.remove("hidden");

  try {
    const res = await fetchWithAuth(`/profile/${currentUser.id}`);
    if (!res.ok) throw new Error("Failed to load profile");
    const profile = await res.json();

    const fields = [
      { label: "Name", value: profile.name || "Not set" },
      { label: "Budget", value: profile.budget_preference || "Not set" },
      { label: "Dietary", value: profile.food_preference || "Not set" },
      { label: "Traveler type", value: profile.traveler_type || "Not set" },
      { label: "Seat preference", value: profile.seat_preference || "Not set" },
    ];

    el("profile-fields").innerHTML = fields
      .map((f) => `<div class="profile-field"><span class="f-label">${escapeHtml(f.label)}</span><span>${escapeHtml(f.value)}</span></div>`)
      .join("");

    const dests = profile.favorite_destinations || [];
    el("profile-destinations").innerHTML = dests.length
      ? dests.map((d) => `<span class="chip">${escapeHtml(d)}</span>`).join("")
      : `<span class="muted-line">None yet. Chat with the AI to start building your list.</span>`;

    loadingEl.classList.add("hidden");
    contentEl.classList.remove("hidden");
  } catch (e) {
    loadingEl.textContent = "Could not load profile.";
  }
}

// ===================================================================
// Boot
// ===================================================================
initAuth();
