/**
 * Minimal y-websocket server-side connection handler.
 * Replaces the npm `y-websocket` package's server util so we can bundle
 * it directly without needing the full package (which has ESM issues on some Node versions).
 */

const Y        = require('yjs')
const WebSocket = require('ws')

// In-memory store of docs: roomName -> Y.Doc
const docs = new Map()

function getDoc(docName) {
  if (!docs.has(docName)) {
    const doc = new Y.Doc()
    docs.set(docName, doc)
  }
  return docs.get(docName)
}

const messageSync        = 0
const messageAwareness   = 1
const messageAuth        = 2

function readSyncMessage(decoder, encoder, doc, transact) {
  const { readVarUint, writeVarUint, writeVarUint8Array } = require('./encoding')
  const messageType = readVarUint(decoder)
  const { encodeStateAsUpdate, applyUpdate, encodeStateVector } = Y

  switch (messageType) {
    case 0: { // syncStep1
      const stateVector = readVarUint8Array(decoder)
      const update = encodeStateAsUpdate(doc, stateVector)
      writeVarUint(encoder, 0) // sync
      writeVarUint(encoder, 1) // syncStep2
      writeVarUint8Array(encoder, update)
      break
    }
    case 1: { // syncStep2
      const update = readVarUint8Array(decoder)
      transact(() => applyUpdate(doc, update))
      break
    }
    case 2: { // update
      const update = readVarUint8Array(decoder)
      transact(() => applyUpdate(doc, update))
      break
    }
  }
}

// We'll use the official y-websocket package's server utility instead
// This file acts as a lightweight forwarder

let _setupWSConnection
try {
  // Try loading y-websocket server utils (installed separately)
  const ywsUtils = require('y-websocket/bin/utils')
  _setupWSConnection = ywsUtils.setupWSConnection
} catch (_) {
  // Fallback: minimal implementation
  _setupWSConnection = function setupWSConnection(ws, req, { docName = 'default' } = {}) {
    const doc = getDoc(docName)
    const awareness = new Map() // simple awareness store

    ws.binaryType = 'arraybuffer'

    // Send initial sync step 1
    const { encodeStateVector, encodeStateAsUpdate, applyUpdate } = Y

    function send(data) {
      if (ws.readyState === WebSocket.OPEN) ws.send(data)
    }

    // On new connection, send full doc state
    ws.on('open', () => {})

    ws.on('message', (message) => {
      try {
        const data  = new Uint8Array(message)
        const msgType = data[0]

        if (msgType === 0) {
          // Sync message — apply update to shared doc
          const update = data.slice(1)
          applyUpdate(doc, update)

          // Broadcast to all other peers in the same room
          wss_broadcast(docName, ws, data)
        }
      } catch (e) {
        console.error('WS message error:', e)
      }
    })

    ws.on('close', () => {})

    // Send current doc state to new client
    try {
      const state = encodeStateAsUpdate(doc)
      if (state.length > 2) {
        const msg = new Uint8Array([0, ...state])
        send(msg)
      }
    } catch (_) {}
  }
}

// Track connections per room for broadcasting
const rooms = new Map() // docName -> Set<WebSocket>

function wss_broadcast(docName, senderWs, data) {
  const peers = rooms.get(docName)
  if (!peers) return
  peers.forEach(peer => {
    if (peer !== senderWs && peer.readyState === WebSocket.OPEN) {
      peer.send(data)
    }
  })
}

function setupWSConnection(ws, req, opts = {}) {
  const docName = opts.docName || req.url?.slice(1) || 'default'

  // Track this connection in the room
  if (!rooms.has(docName)) rooms.set(docName, new Set())
  rooms.get(docName).add(ws)

  ws.on('close', () => {
    const peers = rooms.get(docName)
    if (peers) {
      peers.delete(ws)
      if (peers.size === 0) rooms.delete(docName)
    }
  })

  _setupWSConnection(ws, req, { ...opts, docName })
}

module.exports = { setupWSConnection }
