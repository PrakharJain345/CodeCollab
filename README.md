# 🚀 CodeCollab

**The Ultimate Real-time Collaborative Development Environment**

CodeCollab is a powerful, full-stack platform designed for developers to code, brainstorm, and communicate together in real-time. Whether it's remote pair programming, technical interviews, or classroom learning, CodeCollab provides the perfect shared workspace.

##  Key Features

- **🛡️ Deep Obsidian Aesthetic**: A premium, high-tech interface with glassmorphism effects and sophisticated animations.
- **⚡ Interactive Terminal**: Full-featured VS Code-like terminal using `xterm.js` with real-time `stdin`/`stdout` streaming.
- **📝 Collaborative Editor**: Multi-file tab support powered by **Monaco Editor** and **Yjs** for conflict-free synchronization.
- **🤖 AI Expert**: Context-aware developer assistant using **Groq API** (Llama 3.3 70B) to help you code faster.
- **🎨 Shared Canvas**: Real-time collaborative whiteboard for brainstorming and architecture diagrams.
- **🎥 Secure Video**: Face-to-face collaboration powered by **Jitsi (JaaS)** integrated directly into the workspace.
- **🔒 Private Rooms**: Password-protected rooms with permanent persistence for code and history.

## 🛠 Tech Stack

- **Frontend**: React, Vite, Premium CSS Design System, Monaco Editor, Xterm.js, Yjs.
- **Backend**: Node.js, Express, WebSockets (`ws`), Mongoose, MongoDB Atlas.
- **Services**: Jitsi as a Service (Video), Groq API (AI Assistant), Wandbox (Remote Runner Fallback).

## 🌐 Deployment Guide

### Backend (Node.js & WebSockets)
**Recommended**: [Render](https://render.com)
- **Runtime**: Node
- **Build Command**: `npm run install-all` (from root)
- **Start Command**: `npm start` (from root)
- **Env Vars**: `MONGO_URI`, `JWT_SECRET`, `NODE_VERSION=18.0.0`.

### Frontend (React & Vite)
**Recommended**: [Vercel](https://vercel.com)
- **Framework Preset**: `Vite`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Env Vars**: `VITE_WS_URL` (e.g. `wss://your-backend.onrender.com`), `VITE_GROQ_API_KEY`, `VITE_JAAS_APP_ID`.

## 💻 Local Setup

1. **Clone the repo**: `git clone <your-repo-link>`
2. **Install deps**: `npm run install-all`
3. **Setup environment**: Create `.env` files based on `.env.example` in both root and backend folders.
4. **Run Dev**: `npm run dev`

---
Built by Prakhar Jain
