# 🚀 CodeCollab

**Professional Full-Stack Collaborative Code Editor**

CodeCollab is a powerful, real-time developer environment featuring shared editing, interactive terminals, whiteboards, video calls, and AI assistance.

## 🌈 Key Features
- **Interactive Terminal**: Real-time streaming and `stdin` support using `xterm.js`.
- **Collaborative Editor**: Multi-file tab support with Monaco & Yjs.
- **AI Assistant**: Smart developer helper powered by Groq API.
- **Shared Whiteboard**: Draw and brainstorm together live.
- **Video & Chat**: Seamless communication while you code.

## 🌐 Deployment Guide

### 1. Backend (Logic & WebSockets)
**Recommended Platform**: [Render](https://render.com) or [Railway](https://railway.app)
- **Root Directory**: `backend`
- **Build Command**: `npm install`
- **Start Command**: `node index.js`
- **Env Vars**: `MONGO_URI`, `JWT_SECRET`, `VITE_GROQ_API_KEY`.

### 2. Frontend (UI & React)
**Recommended Platform**: [Vercel](https://vercel.com)
- **Framework Preset**: `Vite`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Env Vars**: `VITE_WS_URL` (Set to your backend's `wss://` address).

---
Created with ❤️ by Antigravity
