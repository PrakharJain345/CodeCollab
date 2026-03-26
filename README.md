# CodeCollab

CodeCollab is a full-stack, real-time collaborative development environment built to facilitate remote pair programming, technical interviews, and shared learning. It combines a robust code editor with interactive terminal access, a shared whiteboard, context-aware AI assistance, and integrated video communication.

## Features

- **Real-time Synchronization:** Powered by Yjs natively integrated with Monaco Editor, enabling conflict-free concurrent editing using CRDTs.
- **Interactive Terminal:** A full-featured terminal powered by xterm.js with real-time bidirectional streaming to the backend pseudo-terminal.
- **Context-aware AI Assistant:** Integrated with the Groq API (Llama 3) to provide instant, context-aware debugging and insights based on the current editor state.
- **Shared Canvas:** A collaborative whiteboard for brainstorming and real-time architecture diagramming.
- **Integrated Video Conferencing:** Face-to-face communication built directly into the workspace via Jitsi as a Service (JaaS).
- **Persistent Storage:** Room persistence, history tracking, and access control managed via a Node.js and Express backend connected to MongoDB.

## Architecture & Technology Stack

**Frontend**
- React 19 / Vite
- Monaco Editor
- Xterm.js
- Yjs (y-monaco, y-websocket)

**Backend**
- Node.js / Express
- WebSockets (ws)
- Mongoose / MongoDB Atlas

**External Services**
- Groq API (AI Assistant)
- Jitsi JaaS (Video)
- Wandbox (Remote Runner Fallback)

## Getting Started

### Prerequisites

- Node.js
- MongoDB instance (Atlas or local)
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/PrakharJain345/CodeCollab.git
   cd CodeCollab
   ```

2. Install dependencies for both the frontend and backend environments:
   ```bash
   npm run install-all
   ```

### Configuration

Create environment variable files for both the frontend and backend based on the provided examples.

**Backend (`backend/.env`):**
```env
PORT=4000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

**Frontend (`.env`):**
```env
VITE_WS_URL=ws://localhost:4000
VITE_GROQ_API_KEY=your_groq_api_key
VITE_JAAS_APP_ID=your_jitsi_app_id
```

### Running Locally

To run the application locally, you need to start both the frontend development server and the backend server.

1. Start the React frontend:
   ```bash
   npm run dev
   ```

2. In a separate terminal session, start the backend server:
   ```bash
   npm start
   ```

## Deployment

### Backend (Recommended: Render)
- **Runtime:** Node
- **Build Command:** `npm run install-all`
- **Start Command:** `npm start`
- **Environment Variables:** `MONGO_URI`, `JWT_SECRET`, `NODE_VERSION=18.x`

### Frontend (Recommended: Vercel)
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Environment Variables:** `VITE_WS_URL` (points to your deployed backend WebSocket URL, e.g., wss://your-backend.onrender.com), `VITE_GROQ_API_KEY`, `VITE_JAAS_APP_ID`

## License

MIT License

Copyright (c) 2026 Prakhar Jain

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
