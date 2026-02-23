require('dotenv').config()

const http      = require('http')
const express   = require('express')
const cors      = require('cors')
const mongoose  = require('mongoose')
const WebSocket = require('ws')

const roomsRouter   = require('./routes/rooms')
const executeRouter = require('./routes/execute')
const { setupExecuteWS } = require('./routes/execute-ws')

const PORT      = process.env.PORT || 4000
const MONGO_URI = process.env.MONGO_URI

// ── Express setup ─────────────────────────────────────────────────────────────
const app = express()
app.use(cors({ origin: '*' }))
app.use(express.json())

app.use('/api/rooms',   roomsRouter)
app.use('/api/execute', executeRouter)

app.get('/health', (_, res) =>
  res.json({ status: 'ok', time: new Date().toISOString() })
)

// ── HTTP + WebSocket server ───────────────────────────────────────────────────
const server = http.createServer(app)
const wss    = new WebSocket.Server({ noServer: true })

// Load y-websocket server utility
let setupWSConnection
try {
  // y-websocket v1.x exposes its server util at bin/utils.cjs or bin/utils
  setupWSConnection = require('y-websocket/bin/utils').setupWSConnection
} catch (_) {
  try {
    setupWSConnection = require('y-websocket/bin/utils.cjs').setupWSConnection
  } catch (_2) {
    // Minimal inline fallback
    const Y = require('yjs')
    const docs = new Map()
    setupWSConnection = (ws, req, { docName = 'room' } = {}) => {
      ws.binaryType = 'arraybuffer'
      if (!docs.has(docName)) docs.set(docName, new Y.Doc())
      const doc = docs.get(docName)

      ws.on('message', (msg) => {
        const data = new Uint8Array(msg instanceof ArrayBuffer ? msg : Buffer.from(msg))
        Y.applyUpdate(doc, data.slice(1))
        wss.clients.forEach(client => {
          if (client !== ws && client.readyState === WebSocket.OPEN) client.send(msg)
        })
      })

      // Send current state to new client
      const state = Y.encodeStateAsUpdate(doc)
      if (state.length > 2) ws.send(Buffer.concat([Buffer.from([0]), Buffer.from(state)]))
    }
  }
}

// Upgrade HTTP connection to WebSocket for Yjs paths
server.on('upgrade', (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req)
  })
})

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const pathname = url.pathname

  if (pathname === '/api/execute-ws') {
    console.log('[WS] Interactive execution started')
    setupExecuteWS(ws, req)
  } else {
    // Default Yjs behavior
    const docName = decodeURIComponent(pathname.slice(1)) || 'default'
    console.log(`[WS] peer joined room: "${docName}"`)
    setupWSConnection(ws, req, { docName, gc: true })
  }
})

// ── MongoDB connection ────────────────────────────────────────────────────────
async function start() {
  if (MONGO_URI) {
    try {
      await mongoose.connect(MONGO_URI, { dbName: 'codecollab' })
      console.log('✅ MongoDB connected')
    } catch (err) {
      console.error('❌ MongoDB error:', err.message, '— continuing without DB')
    }
  } else {
    console.warn('⚠️  MONGO_URI not set — room persistence disabled')
  }

  server.listen(PORT, () => {
    console.log(`🚀 Backend  →  http://localhost:${PORT}`)
    console.log(`📡 Yjs WS   →  ws://localhost:${PORT}`)
    console.log(`🔌 REST API →  http://localhost:${PORT}/api/rooms`)
  })
}

start()
