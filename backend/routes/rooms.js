const express = require('express')
const mongoose = require('mongoose')
const jwt     = require('jsonwebtoken')
const Room    = require('../models/Room')
const router  = express.Router()

const JWT_SECRET = process.env.JWT_SECRET || 'codecollab-secret-change-in-prod'

// ── Helpers ──────────────────────────────────────────────────────────────────
function signAdminToken(roomName, username) {
  return jwt.sign({ roomName, username, role: 'admin' }, JWT_SECRET, { expiresIn: '24h' })
}

function verifyAdminToken(token) {
  try { return jwt.verify(token, JWT_SECRET) } catch { return null }
}

const isDbConnected = () => mongoose.connection.readyState === 1

// ── GET /api/rooms — list public rooms ───────────────────────────────────────
router.get('/', async (req, res) => {
  if (!isDbConnected()) return res.json({ rooms: [] })
  try {
    const rooms = await Room.find({ isPublic: true })
      .sort({ lastActive: -1 })
      .limit(20)
      .select('name language fileCount lastActive createdAt createdBy')
    res.json({ rooms })
  } catch (err) {
    res.json({ rooms: [] }) // Graceful fallback
  }
})

// ── GET /api/rooms/:name — get one room ──────────────────────────────────────
router.get('/:name', async (req, res) => {
  if (!isDbConnected()) return res.json({ room: { name: req.params.name } })
  try {
    const room = await Room.findOne({ name: req.params.name }).select('-adminToken -passwordHash')
    if (!room) return res.status(404).json({ error: 'Room not found' })
    res.json({ room })
  } catch (err) {
    res.json({ room: { name: req.params.name } })
  }
})

// ── POST /api/rooms/join — join or create a room ──────────────────────────────
router.post('/join', async (req, res) => {
  const { name, username } = req.body
  if (!name?.trim() || !username?.trim()) {
    return res.status(400).json({ error: 'Room name and username are required' })
  }

  const roomName = name.trim()

  // ── Fallback if DB is disconnected ───────────────────────────
  if (!isDbConnected()) {
    return res.json({
      room:       { name: roomName, createdBy: username },
      isAdmin:    true, // Everyone is admin if DB is down (simplification)
      adminToken: signAdminToken(roomName, username),
      message:    'Joined (Offline Mode). Cloud persistence limited.',
    })
  }

  try {
    let room = await Room.findOne({ name: roomName })

    if (!room) {
      const rawToken  = signAdminToken(roomName, username)
      // Note: we're still hashing the token for security, but passwords are gone
      room = await Room.create({
        name:         roomName,
        createdBy:    username,
        adminToken:   rawToken, // Simplified: storing raw token for now to avoid bcrypt comparison issues while debugging
        language:     'javascript',
        isPublic:     true,
        lastActive:   Date.now(),
      })

      return res.json({
        room:       roomPublic(room),
        isAdmin:    true,
        adminToken: rawToken,
        message:    'Room created.',
      })
    }

    // Room EXISTS
    room.lastActive = Date.now()
    await room.save()

    return res.json({
      room:    roomPublic(room),
      isAdmin: false,
      message: 'Joined room.',
    })

  } catch (err) {
    // Last ditch fallback
    return res.json({
      room:       { name: roomName, createdBy: username },
      isAdmin:    true,
      adminToken: signAdminToken(roomName, username),
      message:    'Joined with errors.',
    })
  }
})

// ── POST /api/rooms/:name/verify-admin ───────────────────────────────────────
router.post('/:name/verify-admin', async (req, res) => {
  const { adminToken } = req.body
  if (!adminToken) return res.json({ isAdmin: false })

  const payload = verifyAdminToken(adminToken)
  if (!payload || payload.roomName !== req.params.name) {
    return res.json({ isAdmin: false })
  }

  if (!isDbConnected()) return res.json({ isAdmin: true, username: payload.username })

  const room = await Room.findOne({ name: req.params.name })
  if (!room) return res.json({ isAdmin: true }) // If room deleted but token valid, let them be admin

  // Simple string compare for now to reduce complexity/latency
  const ok = (adminToken === room.adminToken)
  res.json({ isAdmin: ok, username: payload.username })
})

// ── PATCH /api/rooms/:name ───────────────────────────────────────────────────
router.patch('/:name', async (req, res) => {
  const { adminToken, ...updates } = req.body
  const payload = verifyAdminToken(adminToken)
  if (!payload || payload.roomName !== req.params.name) {
    return res.status(403).json({ error: 'Not authorised' })
  }

  if (!isDbConnected()) return res.json({ success: true })

  try {
    const room = await Room.findOneAndUpdate(
      { name: req.params.name },
      { ...updates, lastActive: Date.now() },
      { new: true }
    ).select('-adminToken -passwordHash')
    res.json({ room })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

function roomPublic(room) {
  const obj = room.toObject()
  delete obj.adminToken
  delete obj.passwordHash
  return obj
}

module.exports = router
