# 🚀 CodeCollab

**The Ultimate Real-time Collaborative Development Environment**

CodeCollab is a powerful, full-stack platform designed for developers to code, brainstorm, and communicate together in real-time. Whether it's remote pair programming, technical interviews, or classroom learning, CodeCollab provides the perfect shared workspace.

##  Key Features

- **⚡ Interactive Terminal**: Full-featured VS Code-like terminal using `xterm.js` with real-time `stdin`/`stdout` streaming and a robust remote fallback runner.
- **📝 Collaborative Editor**: Multi-file tab support powered by **Monaco Editor** and **Yjs** for conflict-free real-time synchronization.
- **🤖 AI Assistant**: Context-aware developer helper integrated with the **Groq API** to help you write, debug, and explain code.
- **🎨 Shared Whiteboard**: Real-time canvas for architectural diagrams and brainstorming sessions.
- **🎥 Video & Chat**: Seamless group video calls (via Daily.co) and instant messaging baked right into the layout.
- **🔒 Secure Rooms**: Password-protected private rooms with role-based permissions and persistent room metadata.

## 🛠 Tech Stack

- **Frontend**: React, Vite, TailwindCSS, Monaco Editor, Xterm.js, Yjs (WebRTC/WebSocket).
- **Backend**: Node.js, Express, Socket.io/WS, Mongoose (MongoDB Atlas).
- **Services**: Daily.co (Video), Groq API (AI), Wandbox (Remote Execution Fallback).

## 🌐 Deployment Guide

### Backend (Logic & WebSockets)
**Recommended**: [Render](https://render.com)
- **Root Directory**: `backend`
- **Build Command**: `npm install`
- **Start Command**: `node index.js`
- **Env Vars**: `MONGO_URI`, `JWT_SECRET`, `VITE_GROQ_API_KEY`.

### Frontend (UI & React)
**Recommended**: [Vercel](https://vercel.com)
- **Framework Preset**: `Vite`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Env Vars**: `VITE_WS_URL` (Set to your backend's `wss://` address), `VITE_GROQ_API_KEY`.

## 💻 Local Setup

1. **Clone the repo**: `git clone <your-repo-link>`
2. **Install deps**: `npm run install-all`
3. **Setup environment**: Create `.env` files based on `.env.example` in both root and backend folders.
4. **Run Dev**: `npm run dev`

---
Built by Prakhar Jain
